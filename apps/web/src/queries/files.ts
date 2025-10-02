import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  deleteFile,
  getFile,
  getFiles,
  uploadFile,
  type ProgressCallback,
} from "@/api/files";
import { collectionFilesOptions } from "./collections";

export const filesOptions = queryOptions({
  queryKey: ["files"],
  queryFn: getFiles,
});

export const fileOptions = (id: string) =>
  queryOptions({
    queryKey: ["files", id],
    queryFn: () => getFile(id),
  });

interface UploadFileMutationArgs {
  file: File;
  collectionId?: string;
  signal?: AbortSignal;
  onUploadProgress?: ProgressCallback;
}

export const uploadFileOptions = mutationOptions({
  mutationFn: ({
    file,
    collectionId,
    signal,
    onUploadProgress,
  }: UploadFileMutationArgs) => {
    return uploadFile(file, collectionId, onUploadProgress, signal);
  },
  onSuccess: async (_, variables, _mutateResult, context) => {
    await Promise.all([
      context.client.invalidateQueries({
        queryKey: filesOptions.queryKey,
        exact: true,
      }),
      variables.collectionId &&
        context.client.invalidateQueries({
          queryKey: collectionFilesOptions(variables.collectionId).queryKey,
        }),
    ]);
  },
});

export const deleteFileOptions = mutationOptions({
  mutationFn: deleteFile,
  onSuccess: async (_, fileId, _mutateResult, context) => {
    context.client.removeQueries(fileOptions(fileId));

    await Promise.all([
      context.client.invalidateQueries({
        queryKey: filesOptions.queryKey,
        exact: true,
      }),
      context.client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "collections" && query.queryKey[2] === "files",
      }),
    ]);
  },
});
