import axios, { type AxiosInstance } from "axios";
import type { Client, PathsObject, InternalRequestOptions, ClientRequestOptions } from "./types";

type FetcherFn = (method: string, path: string, opts?: InternalRequestOptions) => void;

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
  options?: Omit<ClientRequestOptions, "baseURL">,
): Client<T, Prefix>;
export function createClient<T extends PathsObject, Prefix extends string = string>(
  instance: AxiosInstance,
): Client<T, Prefix>;
export function createClient<T extends PathsObject, Prefix extends string = string>(
  baseUrlOrInstance: Prefix | AxiosInstance,
  options?: ClientRequestOptions,
): Client<T, Prefix> {
  const axiosInstance =
    typeof baseUrlOrInstance === "string"
      ? axios.create({ baseURL: baseUrlOrInstance, ...options })
      : baseUrlOrInstance;

  return createProxy(async (method, url, opts = {}) => {
    const { path, body, query, header, cookie: _cookie, ...axiosOpts } = opts;
    url = buildUrl(url, path);

    // TODO: support args.cookie?
    const res = await axiosInstance.request({
      method,
      url,
      data: body,
      params: query,
      headers: header,
      ...axiosOpts,
    });

    return res.data;
  }) as unknown as Client<T, Prefix>;
}
