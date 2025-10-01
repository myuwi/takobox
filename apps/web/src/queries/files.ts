import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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

export function useUploadFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      collectionId,
      signal,
      onUploadProgress,
    }: UploadFileMutationArgs) => {
      return uploadFile(file, collectionId, onUploadProgress, signal);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: filesOptions.queryKey,
          exact: true,
        }),
        variables.collectionId &&
          queryClient.invalidateQueries({
            queryKey: collectionFilesOptions(variables.collectionId).queryKey,
          }),
      ]);
    },
  });
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: async (_, fileId) => {
      queryClient.removeQueries(fileOptions(fileId));

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: filesOptions.queryKey,
          exact: true,
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "collections" &&
            query.queryKey[2] === "files",
        }),
      ]);
    },
  });
}
