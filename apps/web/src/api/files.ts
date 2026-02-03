import type { AxiosProgressEvent } from "axios";
import { client } from "./client";

export interface ProgressInfo {
  file: File;
  event: AxiosProgressEvent;
}

export type ProgressCallback = (info: ProgressInfo) => void;

export const getFiles = async () => {
  return await client.get("/files");
};

export const getFile = async (id: string) => {
  return await client.get("/files/{file_id}", { path: { file_id: id } });
};

export const uploadFile = async (
  file: File,
  collectionId?: string,
  progressCallback?: ProgressCallback,
  signal?: AbortSignal,
) => {
  return await client.post(
    "/files",
    { form: { file }, query: { collectionId } },
    {
      onUploadProgress: (event) => progressCallback?.({ file, event }),
      signal,
    },
  );
};

export const renameFile = async (id: string, name: string) => {
  return await client.patch("/files/{file_id}", {
    path: { file_id: id },
    json: { name },
  });
};

export const deleteFile = async (id: string) => {
  return await client.delete("/files/{file_id}", { path: { file_id: id } });
};

export const regenerateThumbnail = async (id: string) => {
  return await client.post("/files/{file_id}/regenerate-thumbnail", { path: { file_id: id } });
};
