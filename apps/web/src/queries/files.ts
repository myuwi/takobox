import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";
import { deleteFile, getFile, getFiles, renameFile, uploadFile } from "@/api/files";
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
  onUploadProgress?: (event: AxiosProgressEvent) => void;
  signal?: AbortSignal;
}

export const uploadFileOptions = mutationOptions({
  mutationFn: ({ file, collectionId, onUploadProgress, signal }: UploadFileMutationArgs) => {
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

export const renameFileOptions = mutationOptions({
  mutationFn: ({ id, name }: { id: string; name: string }) => renameFile(id, name),
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await Promise.all([
      context.client.invalidateQueries({
        queryKey: filesOptions.queryKey,
        exact: true,
      }),
      context.client.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "collections" && query.queryKey[2] === "files",
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
        predicate: (query) => query.queryKey[0] === "collections" && query.queryKey[2] === "files",
      }),
    ]);
  },
});
