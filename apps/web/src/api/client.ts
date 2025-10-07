import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import axios, { type AxiosError } from "axios";
import { isServer } from "@/utils/env";

export const client = axios.create({
  baseURL: isServer ? process.env.TAKOBOX_INTERNAL_API_URL : "/api",
});

const getServerHeaders = createServerOnlyFn(getRequestHeaders);

if (isServer) {
  client.interceptors.request.use((config) => {
    config.headers.set(getServerHeaders().toJSON());
    return config;
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError;
  }
}
