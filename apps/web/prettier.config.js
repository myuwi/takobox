import base from "../../prettier.config.js";

export default {
  ...base,
  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "^react(-dom)?(/.+)?$",
    "^@tanstack/react-start",
    "^@tanstack/",
    "<THIRD_PARTY_MODULES>",
    "^@/",
    "^[.]",
  ],
  tailwindStylesheet: "./src/index.css",
  tailwindFunctions: ["cva", "tw"],
};
