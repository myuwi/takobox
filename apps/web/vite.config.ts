import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, routeToken: "_layout" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
