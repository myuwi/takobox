import type { AxiosProgressEvent } from "axios";
import { client } from "./client";

export interface ProgressInfo {
  file: File;
  event: AxiosProgressEvent;
}

export type ProgressCallback = (info: ProgressInfo) => void;

export const getFiles = async () => {
  const { data } = await client.get<never[]>("files");
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
