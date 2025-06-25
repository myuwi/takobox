import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getFiles, uploadFile, type ProgressCallback } from "@/api/files";

export const filesOptions = queryOptions({
  queryKey: ["files"],
  queryFn: getFiles,
});

export function useFilesQuery() {
  return useQuery(filesOptions);
}

interface UploadFileMutationOptions {
  onUploadProgress?: ProgressCallback;
}

export function useUploadFileMutation(opts: UploadFileMutationOptions = {}) {
  const { onUploadProgress } = opts;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFile(file, onUploadProgress),
    onSuccess: async (_) => {
      await queryClient.refetchQueries({ queryKey: filesOptions.queryKey });
    },
  });
}
