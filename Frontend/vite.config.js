import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static SPA build. Served from a host with SPA rewrites (Vercel, Netlify,
// Cloudflare Pages) so every route resolves to index.html instead of 404.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Local development only: keep the browser same-origin so the local
      // backend (http://localhost:5000) can be reached without CORS issues.
      // Production builds use VITE_API_BASE_URL and are unaffected.
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
