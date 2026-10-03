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

const runtimeErrorScript = `
<script>
window.addEventListener('error', function (e) {
  var msg = (e && e.message) || 'Unknown JavaScript error';
  var box = document.getElementById('__luno_runtime_error');
  if (!box) {
    box = document.createElement('pre');
    box.id = '__luno_runtime_error';
    box.style.cssText = 'position:fixed;z-index:999999;left:12px;right:12px;top:12px;max-height:90vh;overflow:auto;padding:16px;background:#111;color:#f66;font:13px/1.45 monospace;white-space:pre-wrap;border-radius:10px;';
    document.documentElement.appendChild(box);
  }
  box.textContent = 'LUNO / Prisma runtime error\\n\\n' + msg;
});
window.addEventListener('unhandledrejection', function (e) {
  var reason = e && e.reason;
  var msg = reason && (reason.stack || reason.message) || String(reason);
  var box = document.getElementById('__luno_runtime_error');
  if (!box) {
    box = document.createElement('pre');
    box.id = '__luno_runtime_error';
    box.style.cssText = 'position:fixed;z-index:999999;left:12px;right:12px;top:12px;max-height:90vh;overflow:auto;padding:16px;background:#111;color:#f66;font:13px/1.45 monospace;white-space:pre-wrap;border-radius:10px;';
    document.documentElement.appendChild(box);
  }
  box.textContent = 'LUNO / Prisma runtime error\\n\\n' + msg;
});
</script>
`;

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
index = index.replace("</head>", runtimeErrorScript + "</head>");

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

// Wget can HTML-encode the plus signs in this inline fallback branch.
// Decode that source corruption so Safari parses the original JavaScript.
index = index.replace(/&#32;\+&#32;/g, "+");

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
