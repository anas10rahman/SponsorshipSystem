import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { devSeedApi } from "./dev/seed-api";

export default defineConfig({
  plugins: [react(), devSeedApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    // Dev opsional: teruskan /api ke backend live (set API_PROXY=https://...).
    proxy: process.env.API_PROXY
      ? { "/api": { target: process.env.API_PROXY, changeOrigin: true, secure: true } }
      : undefined,
  },
});
