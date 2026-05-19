import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // IMPORTANT
  base: "/",

  server: {
    port: 5173,

    proxy: {
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/config": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/send": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/report": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/batch": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/scheduled": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/dashboard": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/parse-excel": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/provider-info": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },

      "/user": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
  },
});