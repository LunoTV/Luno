import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
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

// app.min.js is constructed by the original Prisma index and therefore is not
// discovered by wget's HTML crawler. These are actual Prisma Web resources.
const explicitResources = [
  ["http://prisma.ws/app.min.js", "app.min.js"],
  ["http://prisma.ws/prisma-main/app.min.js", "prisma-main/app.min.js"],
  ["http://prisma.ws/prisma-main/css/app.css", "prisma-main/css/app.css"],
  ["http://prisma.ws/css/app.css", "css/app.css"]
];

for (const [url, relativePath] of explicitResources) {
  const target = resolve(staging, relativePath);
  mkdirSync(resolve(target, ".."), { recursive: true });
  execFileSync("wget", ["--execute=robots=off", "--output-document", target, url], {
    cwd: root,
    stdio: "inherit"
  });
}

execFileSync("cp", ["-R", staging, publicDir], { cwd: root, stdio: "inherit" });

const indexPath = resolve(publicDir, "index.html");
if (!existsSync(indexPath)) {
  throw new Error("Prisma Web mirror does not contain public/index.html.");
}

let index = readFileSync(indexPath, "utf8");

// The original webOS helper is unavailable from prisma.ws at materialization
// time (HTTP 500). It is not required for the ordinary browser entry path, so
// do not leave a mixed-content HTTP script in the HTTPS Pages build.
index = index.replace(
  /\s*<script src="http:\/\/prisma\.ws\/webos\/webOSTV\.js"><\/script>\s*/,
  "\n"
);

// Normalize the mirrored stylesheet filename containing a query string.
const queriedCss = resolve(publicDir, "css", "app.css?v=4347e7d76b.css");
const normalCss = resolve(publicDir, "css", "app.css");
if (existsSync(queriedCss)) {
  if (existsSync(normalCss)) rmSync(normalCss);
  renameSync(queriedCss, normalCss);
}
index = index.replace(
  "css/app.css%3Fv=4347e7d76b.css",
  "css/app.css"
);

writeFileSync(indexPath, index);
writeFileSync(resolve(publicDir, ".luno-prisma-source"), [
  "source=https://prisma.ws/",
  "materialized-by=LUNO Stage 1",
  "generated-at=" + new Date().toISOString(),
  ""
].join("\n"));

for (const relativePath of [
  "app.min.js",
  "css/app.css"
]) {
  if (!existsSync(resolve(publicDir, relativePath))) {
    throw new Error("Required Prisma Web resource is missing: " + relativePath);
  }
}

console.log("Prisma Web materialized into public/ with runtime entry resources.");
