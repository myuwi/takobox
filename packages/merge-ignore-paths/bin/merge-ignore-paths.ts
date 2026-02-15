#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import ignoreWalk from "ignore-walk";

const processNestedRule = (rule: string, basePath: string): string => {
  const isNegated = rule.startsWith("!");
  if (isNegated) {
    rule = rule.slice(1);
  }

  const hasLeadingSlash = rule.startsWith("/");
  const hasLeadingWildcard = rule.startsWith("**");

  rule = join("../..", basePath, hasLeadingSlash || hasLeadingWildcard ? "" : "**", rule);

  // Re‑append negation if needed.
  return isNegated ? `!${rule}` : rule;
};

const collectIgnoreRules = (): string[] => {
  const baseDir = ".";
  const ignoreFiles = [".gitignore", ".prettierignore"];
  return ignoreWalk
    .sync({ path: baseDir, ignoreFiles })
    .filter((path) => !path.startsWith(".git/"))
    .filter((path) =>
      ignoreFiles.some((ignoreFile) => path === ignoreFile || path.endsWith("/" + ignoreFile)),
    )
    .flatMap((path) => {
      const basePath = dirname(path);
      return [`# ${path}`].concat(
        readFileSync(join(baseDir, path), "utf8")
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => !line.startsWith("#"))
          .filter(Boolean)
          .map((rule) => processNestedRule(rule, basePath)),
      );
    });
};

try {
  const rules = collectIgnoreRules();
  const content = rules.join("\n") + "\n";

  mkdirSync("node_modules/.cache", { recursive: true });
  writeFileSync("node_modules/.cache/.prettierignore", content);

  console.log("node_modules/.cache/.prettierignore");
} catch (error) {
  console.error("Error generating .prettierignore:", error);
  process.exit(1);
}
