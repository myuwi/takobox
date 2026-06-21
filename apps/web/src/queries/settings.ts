import { queryOptions } from "@tanstack/react-query";
import { client } from "@/api/client";

export const settingsOptions = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data } = await client.settings.get();
    return data;
  },
});
