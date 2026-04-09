import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "src");

/** Файлы из `src/` и алиасы из tsconfig — в бандл; npm — через require() без лишнего CJS interop. */
const INTERNAL_ALIAS =
  /^(config|bot|types|db\/|commands\/|handlers\/|services\/|utils\/|middleware\/|constants\/|events\/|jobs\/|parsers\/|store\/|server\/)/;

function isBundledProjectModule(id: string): boolean {
  if (id.startsWith("\0")) {
    return true;
  }
  if (id.startsWith(".")) {
    return true;
  }
  const normalized = id.replace(/\\/g, "/");
  const srcNorm = src.replace(/\\/g, "/");
  if (normalized === srcNorm || normalized.startsWith(`${srcNorm}/`)) {
    return true;
  }
  return INTERNAL_ALIAS.test(id);
}

export default defineConfig({
  resolve: {
    alias: [
      { find: /^config$/, replacement: resolve(src, "config.ts") },
      { find: /^bot$/, replacement: resolve(src, "bot.ts") },
      { find: /^types$/, replacement: resolve(src, "types.ts") },
      { find: /^db\/(.*)$/, replacement: resolve(src, "db/$1") },
      { find: /^commands\/(.*)$/, replacement: resolve(src, "commands/$1") },
      { find: /^handlers\/(.*)$/, replacement: resolve(src, "handlers/$1") },
      { find: /^services\/(.*)$/, replacement: resolve(src, "services/$1") },
      { find: /^utils\/(.*)$/, replacement: resolve(src, "utils/$1") },
      { find: /^middleware\/(.*)$/, replacement: resolve(src, "middleware/$1") },
      { find: /^constants\/(.*)$/, replacement: resolve(src, "constants/$1") },
      { find: /^events\/(.*)$/, replacement: resolve(src, "events/$1") },
      { find: /^jobs\/(.*)$/, replacement: resolve(src, "jobs/$1") },
      { find: /^parsers\/(.*)$/, replacement: resolve(src, "parsers/$1") },
      { find: /^store\/(.*)$/, replacement: resolve(src, "store/$1") },
      { find: /^server\/(.*)$/, replacement: resolve(src, "server/$1") },
    ],
  },
  build: {
    ssr: "src/index.ts",
    outDir: "dist",
    emptyOutDir: true,
    target: "node20",
    rollupOptions: {
      external: (id) => !isBundledProjectModule(id),
      output: {
        format: "cjs",
        entryFileNames: "index.js",
      },
    },
  },
});
