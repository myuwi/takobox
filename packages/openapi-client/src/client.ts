import axios, { type AxiosInstance } from "axios";
import type { Client, Parameters, PathsObject, RequestOptions } from "./types";

type FetcherFn = (
  method: string,
  path: string,
  opts?: Parameters,
  fetcherOpts?: RequestOptions,
) => void;

const createProxy = (fetcher: FetcherFn) => {
  return new Proxy(() => {}, {
    get(_target, method, _receiver) {
      if (typeof method !== "string") return;
      return fetcher.bind(null, method);
    },
  });
};

const buildUrl = (path: string, params?: Record<string, string>) => {
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      const rep = `{${key}}`;
      path = path.replace(rep, value ? `/${value}` : "");
    }
  }

  return path;
};

export function createClient<T extends PathsObject, Prefix extends string = string>(
  baseUrl: Prefix,
  options?: Omit<RequestOptions, "baseURL">,
): Client<T, Prefix>;
export function createClient<T extends PathsObject, Prefix extends string = string>(
  instance: AxiosInstance,
): Client<T, Prefix>;
export function createClient<T extends PathsObject, Prefix extends string = string>(
  baseUrlOrInstance: Prefix | AxiosInstance,
  options?: RequestOptions,
): Client<T, Prefix> {
  const axiosInstance =
    typeof baseUrlOrInstance !== "string"
      ? baseUrlOrInstance
      : axios.create({ baseURL: baseUrlOrInstance, ...options });

  return createProxy(async (method, path, args = {}, axiosOpts) => {
    const url = buildUrl(path, args.path);

    // TODO: support args.cookie?
    const res = await axiosInstance.request({
      method,
      url,
      data: args.body,
      params: args.query,
      headers: args.header,
      ...axiosOpts,
    });

    return res.data;
  }) as unknown as Client<T, Prefix>;
}
