#!/usr/bin/env bun

import * as fs from "fs/promises";
import { parseArgs } from "util";

import openapiTS, {
  type SchemaObject,
  type TransformNodeOptions,
  type TransformObject,
  NULL,
  astToString,
} from "openapi-typescript";
import ts from "typescript";
import assert from "assert";

const { values } = parseArgs({
  args: process.argv,
  options: {
    input: { short: "i", type: "string" },
    output: { short: "o", type: "string" },
  },
  strict: true,
  allowPositionals: true,
});

assert(values.input, "Input path is not defined.");
assert(values.output, "Output path is not defined.");

const BLOB = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Blob"),
);
const FILE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("File"),
);

const transformFileAndBlob = (
  schemaObject: SchemaObject,
  options: TransformNodeOptions,
): ts.TypeNode | TransformObject | undefined => {
  if (schemaObject.format === "binary") {
    if (options.path?.endsWith("multipart~1form-data")) {
      return {
        schema: schemaObject.nullable
          ? ts.factory.createUnionTypeNode([FILE, NULL])
          : FILE,
        questionToken: true,
      };
    }

    if (options.path?.endsWith("application~1octet-stream")) {
      return {
        schema: schemaObject.nullable
          ? ts.factory.createUnionTypeNode([BLOB, NULL])
          : BLOB,
        questionToken: true,
      };
    }

    return undefined;
  }
};

const url = values.input.startsWith("http")
  ? new URL(values.input)
  : new URL(values.input, import.meta.url);

const ast = await openapiTS(url, {
  exportType: true,
  transform: transformFileAndBlob,
});

const schema = astToString(ast);
await fs.writeFile(values.output, schema);
