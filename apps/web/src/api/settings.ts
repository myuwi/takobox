import type { Settings } from "@/types/Settings";
import { client } from "./client";

export const getSettings = async () => {
  const { data } = await client.get<Settings>("settings");
  return data;
};
