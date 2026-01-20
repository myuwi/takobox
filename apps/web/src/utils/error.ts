import type { AxiosError } from "axios";

export const formatError = (error: AxiosError) => {
  const data = error.response?.data;

  return data && typeof data === "object" && "message" in data && typeof data.message === "string"
    ? data.message
    : error.message;
};
