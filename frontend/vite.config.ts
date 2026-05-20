import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:3000";
  const proxyRoutes = [
    "/auth",
    "/config",
    "/send",
    "/report",
    "/batch",
    "/scheduled",
    "/dashboard",
    "/parse-excel",
    "/provider-info",
    "/health",
    "/user",
  ];

  return {
    plugins: [react()],

    // IMPORTANT
    base: "/",

    server: {
      port: 5173,
      proxy: Object.fromEntries(
        proxyRoutes.map((route) => [
          route,
          {
            target: apiUrl,
            changeOrigin: true,
            secure: false,
          },
        ])
      ),
    },

    build: {
      outDir: "dist",
    },
  };
});
