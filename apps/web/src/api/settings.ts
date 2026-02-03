import { client } from "./client";

export const getSettings = async () => {
  return await client.get("/settings");
};
