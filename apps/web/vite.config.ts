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
    define: {
      "import.meta.env.TAKOBOX_DISABLE_LANDING_PAGE": JSON.stringify(
        process.env.TAKOBOX_DISABLE_LANDING_PAGE === "true",
      ),
    },
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
