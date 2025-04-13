import { getHeader } from "@tanstack/react-start/server";
import ky from "ky";

const isServer = typeof window === "undefined";

export const client = ky.extend({
  prefixUrl: isServer ? "http://localhost:8000" : "/api",
  retry: 0,
  hooks: {
    beforeRequest: [
      (req) => {
        if (isServer) {
          req.headers.set("cookie", getHeader("cookie") ?? "");
        }
      },
    ],
  },
});
