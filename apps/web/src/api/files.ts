import { typedForm } from "@takobox/openapi-client";
import type { AxiosProgressEvent } from "axios";
import { client } from "./client";

export const getFiles = async () => {
  return await client.get("/files");
};

export const getFile = async (id: string) => {
  return await client.get("/files/{id}", { path: { id } });
};

export const uploadFile = async (
  file: File,
  collectionId?: string,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
  signal?: AbortSignal,
) => {
  return await client.post("/files", {
    query: { collectionId },
    body: typedForm({ file }),
    onUploadProgress,
    signal,
  });
};

export const renameFile = async (id: string, name: string) => {
  return await client.patch("/files/{id}", {
    path: { id },
    body: { name },
  });
};

export const deleteFile = async (id: string) => {
  return await client.delete("/files/{id}", { path: { id } });
};

export const regenerateThumbnail = async (id: string) => {
  return await client.post("/files/{id}/regenerate-thumbnail", { path: { id } });
};
