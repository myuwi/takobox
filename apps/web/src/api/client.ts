import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import axios, { type AxiosError } from "axios";
import { isServer } from "@/utils/env";

// TODO: Remove session cookie and redirect to login page on 401

export const client = axios.create({
  // Firefox doesn't support upload progress on fetch; hence xhr.
  adapter: isServer ? "fetch" : "xhr",
  baseURL: isServer ? process.env.TAKOBOX_INTERNAL_API_URL : "/api",
});

const getServerHeaders = createServerOnlyFn(() =>
  Object.fromEntries(getRequestHeaders().entries()),
);

if (isServer) {
  client.interceptors.request.use((config) => {
    config.headers.set(getServerHeaders());
    return config;
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError;
  }
}
