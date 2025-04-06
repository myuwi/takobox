import eslintConfig from "@takobox/eslint-config";

export default [
  { ignores: ["node_modules/", "**/routeTree.gen.ts"] },
  ...eslintConfig,
];
