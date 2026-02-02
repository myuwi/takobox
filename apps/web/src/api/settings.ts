import type { SettingsDto } from "@/types";
import { client } from "./client";

export const getSettings = async () => {
  const { data } = await client.get<SettingsDto>("settings");
  return data;
};
