import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "static",
  base: "/SLOPATHON/projects/silence-enforcer/",
  publicDir: "../public",
  plugins: [
    react(),
    {
      name: "github-pages-metadata",
      transformIndexHtml(html) {
        return html.replaceAll(
          "https://lab.janpfrenger.com/silence-enforcer/",
          "https://janpfrenger.github.io/SLOPATHON/projects/silence-enforcer/",
        );
      },
    },
  ],
  build: {
    outDir: "../dist-github",
    emptyOutDir: true,
  },
});
