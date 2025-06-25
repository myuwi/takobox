import { getHeader } from "@tanstack/react-start/server";
import axios, { type AxiosError } from "axios";

const isServer = typeof window === "undefined";

export const client = axios.create({
  baseURL: isServer ? "http://localhost:8000" : "/api",
});

client.interceptors.request.use((config) => {
  if (isServer) {
    config.headers.set("cookie", getHeader("cookie") ?? "");
  }
  return config;
});

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError;
  }
}
