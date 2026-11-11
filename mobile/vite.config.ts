import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "~": path.resolve(root, "src") },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom", "@tanstack/react-query"],
  },
  server: { host: true, port: 5196, strictPort: true },
  build: {
    outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes("node_modules")) return;
      if (/@ionic|ionicons|@stencil/.test(id)) return "ionic";
      if (/@tanstack/.test(id)) return "data";
      if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "react";
    } } },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
