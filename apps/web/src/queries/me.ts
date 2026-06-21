import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { queryOptions } from "@tanstack/react-query";
import { client } from "@/api/client";

const getMe = createServerFn().handler(async () => {
  const session = getCookie("session");
  if (!session) {
    return null;
  }

  try {
    const { data } = await client.me.get();
    return data;
  } catch (_) {
    return null;
  }
});

export const meOptions = queryOptions({
  queryKey: ["me"],
  queryFn: getMe,
});
