import { createIsomorphicFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import axios, { type AxiosError } from "axios";

const getServerCookie = createIsomorphicFn().server(() => getHeader("cookie"));

const isServer = typeof window === "undefined";

export const client = axios.create({
  baseURL: isServer ? "http://localhost:8000" : "/api",
});

client.interceptors.request.use((config) => {
  const cookie = getServerCookie();
  if (cookie) {
    config.headers.set("cookie", cookie);
  }
  return config;
});

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: AxiosError;
  }
}
