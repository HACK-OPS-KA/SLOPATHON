import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { screamyBirdRelay } from "./relay/vite-websocket-relay";

export default defineConfig({
  root: "static",
  base: "/screamy-bird/",
  plugins: [react(), screamyBirdRelay()],
  server: {
    host: "0.0.0.0",
    allowedHosts: [".trycloudflare.com"],
  },
  preview: {
    host: "0.0.0.0",
    port: 4187,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
  build: {
    outDir: "../dist-static",
    emptyOutDir: true,
  },
});
