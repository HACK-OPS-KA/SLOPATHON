import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@cursor-distorter/shared-types": r("./packages/shared-types/src/index.ts"),
      "@cursor-distorter/chaos-engine": r("./packages/chaos-engine/src/index.ts"),
      "@cursor-distorter/cursor-effects": r("./packages/cursor-effects/src/index.ts"),
      "@cursor-distorter/ui": r("./packages/ui/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/src/**/*.{test,spec}.ts",
      "apps/**/src/**/*.{test,spec}.ts",
    ],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/index.ts", "**/*.test.ts", "**/__tests__/**"],
    },
  },
});
