import { queryOptions } from "@tanstack/react-query";
import { client } from "@/api/client";

export const settingsOptions = queryOptions({
  queryKey: ["settings"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data } = await client.settings.get();
    return data;
  },
});
