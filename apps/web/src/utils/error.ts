import { isAxiosError } from "axios";

export const formatError = (error: unknown) => {
  const data = isAxiosError(error) ? error.response?.data : undefined;

  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  return error instanceof Error ? error.message : String(error);
};
