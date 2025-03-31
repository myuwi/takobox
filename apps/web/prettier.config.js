export default {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  importOrder: [
    "<BUILTIN_MODULES>",
    "^vite$",
    "^react(-dom)?",
    "<THIRD_PARTY_MODULES>",
    "^@/",
    "^[./]",
  ],
  tailwindStylesheet: "./src/styles.css",
  tailwindFunctions: ["cva"],
};
