import type { AxiosProgressEvent } from "axios";
import type { FileDto, FileWithCollections } from "@/types/FileDto";
import { client } from "./client";

export interface ProgressInfo {
  file: File;
  event: AxiosProgressEvent;
}

export type ProgressCallback = (info: ProgressInfo) => void;

export const getFiles = async () => {
  const { data } = await client.get<FileDto[]>("files");
  return data;
};

export const getFile = async (id: string) => {
  const { data } = await client.get<FileWithCollections>(`files/${id}`);
  return data;
};

export const uploadFile = async (
  file: File,
  progressCallback?: ProgressCallback,
  signal?: AbortSignal,
) => {
  const form = new FormData();
  form.append("file", file);

  const { data } = await client.post("files", form, {
    onUploadProgress: (event) => progressCallback?.({ file, event }),
    signal,
  });
  return data;
};

export const deleteFile = async (id: string) => {
  const { data } = await client.delete(`files/${id}`);
  return data;
};

export const regenerateThumbnail = async (id: string) => {
  const { data } = await client.post(`files/${id}/regenerate-thumbnail`);
  return data;
};
