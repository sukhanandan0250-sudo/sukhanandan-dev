import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "/",

  server: {
    port: 5173,

    proxy: {
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/config": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/send": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/report": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/dashboard": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/user": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
  },
});