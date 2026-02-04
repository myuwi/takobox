import type { AxiosRequestConfig } from "axios";
import type { HasRequiredKeys, RemovePrefix, Simplify } from "type-fest";
import type { TypedFormData } from "./typed-form";

export interface Parameters {
  path?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any> | TypedFormData<any>;
  header?: any;
  cookie?: any;
}

export interface OperationObject {
  parameters: any;
  requestBody?: any;
  responses: any;
}

export type PathItemObject = {
  [M in HttpMethod]?: OperationObject;
};

export type PathsObject = Record<string, PathItemObject>;

// prettier-ignore
export type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
// prettier-ignore
export type SuccessfulStatusCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;

export type RequestOptions = AxiosRequestConfig;

export type RequestOpts<Body, Params> = {
  [K in keyof Params as Params[K] extends never | undefined ? never : K]: Params[K];
} & (Body extends { content: { "application/json": infer JsonBody } }
  ? { body: JsonBody }
  : Body extends {
        content: { "multipart/form-data": infer FormBody };
      }
    ? { body: TypedFormData<FormBody extends object ? FormBody : never> }
    : {});

export type SuccessResponse<R> =
  R extends Record<infer Status, object>
    ? Status extends SuccessfulStatusCode
      ? R[Status] extends { content: infer C }
        ? C extends { "application/json": infer Json }
          ? Simplify<Json>
          : void
        : void
      : never
    : never;

export type PathsWithMethod<Paths extends {}, M extends string> = {
  [P in keyof Paths]: Paths[P] extends {
    [K in M]: any;
  }
    ? P
    : never;
}[keyof Paths];

// TODO: Improve type signature
export type ClientMethod<Paths extends PathsObject, Method extends string> = <
  P extends PathsWithMethod<Paths, Method>,
  O extends Paths[P] extends { [M in Method]: any } ? Required<Paths[P][Method]> : never,
  Opts extends RequestOpts<O["requestBody"] extends never ? {} : O["requestBody"], O["parameters"]>,
>(
  url: P,
  ...opts: HasRequiredKeys<Opts> extends true
    ? [opts: Opts, fetcherOpts?: RequestOptions]
    : [opts?: Opts, fetcherOpts?: RequestOptions]
) => Promise<O extends { responses: infer R } ? SuccessResponse<R> : never>;

type ClientImpl<Paths extends PathsObject> = {
  [M in HttpMethod as PathsWithMethod<Paths, M> extends never ? never : M]: ClientMethod<Paths, M>;
};

export type Client<Paths extends PathsObject, Prefix extends string> = ClientImpl<{
  [P in keyof Paths as RemovePrefix<P extends string ? P : never, Prefix>]: Paths[P];
}>;
