import type { AxiosProgressEvent } from "axios";
import { client } from "./client";

export type ProgressCallback = (progress: AxiosProgressEvent) => void;

export const getFiles = async () => {
  const { data } = await client.get<never[]>("files");
  return data;
};

export const uploadFile = async (
  file: File,
  progressCallback?: ProgressCallback,
) => {
  const form = new FormData();
  form.append("files", file);

  const { data } = await client.post("files", form, {
    onUploadProgress: (progress) => progressCallback?.(progress),
  });
  return data;
};
