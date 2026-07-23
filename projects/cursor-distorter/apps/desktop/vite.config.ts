import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// When NO_ELECTRON=1 the app builds/serves as a plain web app (Safe Demo Sandbox
// only). This is used for dev, Playwright interaction tests, and CI web builds.
// Electron main/preload are only wired in for the full desktop build.
const noElectron = process.env.NO_ELECTRON === "1";

const alias = {
  "@cursor-distorter/shared-types": r("../../packages/shared-types/src/index.ts"),
  "@cursor-distorter/chaos-engine": r("../../packages/chaos-engine/src/index.ts"),
  "@cursor-distorter/cursor-effects": r("../../packages/cursor-effects/src/index.ts"),
  "@cursor-distorter/ui": r("../../packages/ui/src/index.ts"),
  "@": r("./src"),
};

export default defineConfig(async () => {
  const plugins = [react()];

  if (!noElectron) {
    // Lazy-load electron plugins so a pure web build never needs them installed/resolved.
    const electron = (await import("vite-plugin-electron/simple")).default;
    const renderer = (await import("vite-plugin-electron-renderer")).default;
    plugins.push(
      electron({
        main: { entry: "electron/main.ts" },
        preload: { input: r("./electron/preload.ts") },
      }) as never,
      renderer() as never,
    );
  }

  return {
    base: "./",
    resolve: { alias },
    plugins,
    server: { port: 5199, strictPort: false },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
    },
  };
});
