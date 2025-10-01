import type { CollectionDto } from "@/types/CollectionDto";
import type { FileDto } from "@/types/FileDto";
import { client } from "./client";

export const getCollections = async () => {
  const { data } = await client.get<CollectionDto[]>("collections");
  return data;
};

export const createCollection = async (name: string) => {
  const { data } = await client.post("collections", { name });
  return data;
};

export const renameCollection = async (id: string, name: string) => {
  const { data } = await client.patch(`collections/${id}`, { name });
  return data;
};

export const deleteCollection = async (id: string) => {
  const { data } = await client.delete(`collections/${id}`);
  return data;
};

export const getCollectionFiles = async (id: string) => {
  const { data } = await client.get<FileDto[]>(`collections/${id}/files`);
  return data;
};

export const addFileToCollection = async (id: string, fileId: string) => {
  const { data } = await client.post(`collections/${id}/files`, { id: fileId });
  return data;
};

export const removeFileFromCollection = async (id: string, fileId: string) => {
  const { data } = await client.delete(`collections/${id}/files`, {
    data: { id: fileId },
  });
  return data;
};
