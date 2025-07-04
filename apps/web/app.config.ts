import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "src",
    routeToken: "_layout",
  },
  vite: {
    plugins: [
      tsconfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
  },
  server: {
    devProxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
    preset: "bun",
  },
});
