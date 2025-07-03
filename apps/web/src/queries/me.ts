import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { me } from "@/api/auth";

const getMe = createServerFn().handler(async () => {
  const session = getCookie("session");
  if (!session) {
    return null;
  }

  try {
    return await me();
  } catch (_) {
    return null;
  }
});

export const meOptions = queryOptions({
  queryKey: ["me"],
  queryFn: getMe,
});

export function useMeQuery() {
  return useQuery(meOptions);
}
