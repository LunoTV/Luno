import { defineConfig } from "vite";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { cpSync } from "node:fs";
import { build as esbuild } from "esbuild";

const require = createRequire(import.meta.url);

function bundleStremioCoreWorker() {
  return {
    name: "bundle-stremio-core-worker",
    async buildStart() {
      const packageDir = dirname(require.resolve("@stremio/stremio-core-web/package.json"));
      const publicDir = join(process.cwd(), "public");
      mkdirSync(publicDir, { recursive: true });

      const demoSourceDir = join(process.cwd(), "addons", "luno-demo");
      const demoPublicDir = join(publicDir, "addons", "luno-demo");
      cpSync(demoSourceDir, demoPublicDir, { recursive: true });

      await esbuild({
        entryPoints: [join(packageDir, "worker.js")],
        bundle: true,
        platform: "browser",
        format: "iife",
        outfile: join(publicDir, "core-worker.js"),
        loader: { ".wasm": "file" },
        assetNames: "core-assets/[name]-[hash]",
        sourcemap: false,
        logLevel: "info"
      });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [bundleStremioCoreWorker()],
  build: { outDir: "dist", emptyOutDir: true }
});
