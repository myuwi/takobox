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
  signal?: AbortSignal;
  onUploadProgress?: ProgressCallback;
}

export function useUploadFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      signal,
      onUploadProgress,
    }: UploadFileMutationArgs) => {
      return uploadFile(file, onUploadProgress, signal);
    },
    onSuccess: async (_) => {
      await queryClient.refetchQueries({ queryKey: filesOptions.queryKey });
    },
  });
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFile,
    onSuccess: async (_) => {
      await queryClient.refetchQueries({ queryKey: filesOptions.queryKey });
    },
  });
}
