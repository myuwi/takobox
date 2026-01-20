import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [
      devtools(),
      tsconfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart({
        router: {
          routeToken: "_layout",
        },
      }),
      react(),
      isProd && nitro({ config: { preset: "bun" } }),
    ],
  };
});
