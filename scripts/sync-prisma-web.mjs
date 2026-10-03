import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const staging = resolve(root, ".prisma-sync", "prisma.ws");
const publicDir = resolve(root, "public");

rmSync(resolve(root, ".prisma-sync"), { recursive: true, force: true });
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(resolve(root, ".prisma-sync"), { recursive: true });

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

if (!existsSync(staging)) throw new Error("Prisma Web mirror was not created.");

execFileSync("cp", ["-R", staging, publicDir], { cwd: root, stdio: "inherit" });

if (!existsSync(resolve(publicDir, "index.html"))) {
  throw new Error("Prisma Web mirror does not contain public/index.html.");
}

writeFileSync(resolve(publicDir, ".luno-prisma-source"), [
  "source=https://prisma.ws/",
  "materialized-by=LUNO Stage 1",
  "generated-at=" + new Date().toISOString(),
  ""
].join("\n"));

console.log("Prisma Web materialized into public/.");
