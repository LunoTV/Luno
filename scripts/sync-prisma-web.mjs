import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const stagingRoot = resolve(root, ".prisma-sync");
const staging = resolve(stagingRoot, "prisma.ws");
const publicDir = resolve(root, "public");

rmSync(stagingRoot, { recursive: true, force: true });
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(stagingRoot, { recursive: true });

try {
  execFileSync("wget", [
    "--mirror",
    "--page-requisites",
    "--convert-links",
    "--adjust-extension",
    "--no-parent",
    "--execute=robots=off",
    "--domains=prisma.ws",
    "--directory-prefix=.prisma-sync",
    "http://prisma.ws/"
  ], { cwd: root, stdio: "inherit" });
} catch (error) {
  if (error?.status !== 8) throw error;
}

if (!existsSync(staging)) {
  throw new Error("Prisma Web mirror was not created.");
}

// app.min.js is constructed by the original Prisma index and is therefore not
// discovered by wget's HTML crawler. It is the actual browser entry resource.
const appTarget = resolve(staging, "app.min.js");
mkdirSync(resolve(appTarget, ".."), { recursive: true });
execFileSync("wget", [
  "--execute=robots=off",
  "--output-document",
  appTarget,
  "http://prisma.ws/app.min.js"
], { cwd: root, stdio: "inherit" });

execFileSync("cp", ["-R", staging, publicDir], { cwd: root, stdio: "inherit" });

const indexPath = resolve(publicDir, "index.html");
if (!existsSync(indexPath)) {
  throw new Error("Prisma Web mirror does not contain public/index.html.");
}

let index = readFileSync(indexPath, "utf8");

// The original webOS helper is HTTP-only and unavailable from the HTTPS Pages
// origin. Do not replace it with a shim; remove only its script tag.
index = index.replace(
  '<script src="http://prisma.ws/webos/webOSTV.js"></script>',
  ""
);

// Normalize whichever mirrored app.css filename wget produced.
const cssDir = resolve(publicDir, "css");
const cssFiles = readdirSync(cssDir).filter((name) => name.startsWith("app.css"));
if (cssFiles.length === 0) {
  throw new Error("Prisma Web mirror does not contain app.css.");
}
const cssSource = cssFiles.find((name) => name !== "app.css") ?? cssFiles[0];
const normalCss = resolve(cssDir, "app.css");
if (cssSource !== "app.css") {
  if (existsSync(normalCss)) rmSync(normalCss);
  renameSync(resolve(cssDir, cssSource), normalCss);
}

index = index.replace(/css\/app\.css%3F[^"'\s>]+/, "css/app.css");

writeFileSync(indexPath, index);
writeFileSync(resolve(publicDir, ".luno-prisma-source"), [
  "source=https://prisma.ws/",
  "materialized-by=LUNO Stage 1",
  "generated-at=" + new Date().toISOString(),
  ""
].join("\n"));

for (const relativePath of ["app.min.js", "css/app.css"]) {
  if (!existsSync(resolve(publicDir, relativePath))) {
    throw new Error("Required Prisma Web resource is missing: " + relativePath);
  }
}

console.log("Prisma Web materialized into public/ with browser entry resources.");
