import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { queryOptions } from "@tanstack/react-query";
import { me } from "@/api/auth";

const getMe = createServerFn().handler(async () => {
  const session = getCookie("session");
  if (!session) {
    return null;
  }

  return await me();
});

export const meOptions = queryOptions({
  queryKey: ["me"],
  queryFn: getMe,
});
