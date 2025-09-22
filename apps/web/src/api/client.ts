import { serverOnly } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";
import axios, { type AxiosError } from "axios";
import { isServer } from "@/utils/env";

export const client = axios.create({
  baseURL: isServer ? process.env.INTERNAL_API_URL : "/api",
});

const getServerHeaders = serverOnly(getHeaders);

if (isServer) {
  client.interceptors.request.use((config) => {
    config.headers.set(getServerHeaders() as Record<string, string>);
    return config;
  });
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError;
  }
}
