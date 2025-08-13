import type { CollectionDto } from "@/types/CollectionDto";
import { client } from "./client";

export const getCollections = async () => {
  const { data } = await client.get<CollectionDto[]>("collections");
  return data;
};

export const createCollection = async (name: string) => {
  const { data } = await client.post("collections", { name });
  return data;
};

export const deleteCollection = async (id: string) => {
  const { data } = await client.delete(`collections/${id}`);
  return data;
};
