export default {
  printWidth: 100,
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
