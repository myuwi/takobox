import { queryOptions } from "@tanstack/react-query";
import { getSettings } from "@/api/settings";

export const settingsOptions = queryOptions({
  queryKey: ["settings"],
  queryFn: getSettings,
});
