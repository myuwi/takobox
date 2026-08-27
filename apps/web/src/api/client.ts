import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import axios, { type AxiosError, isAxiosError } from "axios";
import { createTakoboxClient, type ErrorResponse } from "@takobox/sdk";
import { isServer } from "@/utils/env";

let unauthorizedHandler: (() => void) | undefined;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

const axiosInstance = axios.create({
  // Firefox doesn't support upload progress on fetch; hence xhr.
  adapter: isServer ? "fetch" : "xhr",
  baseURL: isServer ? process.env.TAKOBOX_INTERNAL_API_URL : "/api",
});

const getServerHeaders = createServerOnlyFn(() =>
  Object.fromEntries(getRequestHeaders().entries()),
);

if (isServer) {
  axiosInstance.interceptors.request.use((config) => {
    config.headers.set(getServerHeaders());
    return config;
  });
} else {
  axiosInstance.interceptors.response.use(undefined, (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError<ErrorResponse>;
  }
}

export const client = createTakoboxClient({
  axios: axiosInstance,
});
