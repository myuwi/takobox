import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8000/docs/openapi.json",
  output: {
    path: "./src/gen",
    clean: true,
  },
  plugins: [
    {
      name: "@hey-api/client-axios",
      baseUrl: false,
      throwOnError: true,
    },
    {
      name: "@hey-api/sdk",
      client: false,
      operations: {
        strategy: "single",
        containerName: "TakoboxClient",
        methods: "instance",
      },
      paramsStructure: "grouped",
    },
    { enums: "javascript", name: "@hey-api/typescript" },
  ],
});
