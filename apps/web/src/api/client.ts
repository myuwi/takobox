import { getHeader } from "@tanstack/react-start/server";
import ky, { HTTPError } from "ky";

const isServer = typeof window === "undefined";

export class ApiError extends HTTPError {
  // biome-ignore lint/suspicious/noExplicitAny: could be anything
  data?: any;
  constructor(error: HTTPError) {
    super(error.response, error.request, error.options);
  }
}

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
    beforeError: [
      async (e) => {
        const error = new ApiError(e);

        if (
          error.response.headers
            .get("content-type")
            ?.includes("application/json")
        ) {
          error.data = await error.response.clone().json();
        }

        return error;
      },
    ],
  },
});

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
