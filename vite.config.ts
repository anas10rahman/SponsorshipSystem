import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
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
