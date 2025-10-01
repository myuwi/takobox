import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addFileToCollection,
  createCollection,
  deleteCollection,
  getCollectionFiles,
  getCollections,
  removeFileFromCollection,
  renameCollection,
} from "@/api/collections";
import { fileOptions } from "./files";

export const collectionsOptions = queryOptions({
  queryKey: ["collections"],
  queryFn: getCollections,
});

export function useCreateCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: async (_) => {
      await queryClient.refetchQueries({
        queryKey: collectionsOptions.queryKey,
      });
    },
  });
}

export function useRenameCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameCollection(id, name),
    onSuccess: async (_) => {
      await queryClient.refetchQueries({
        queryKey: collectionsOptions.queryKey,
      });
    },
  });
}

export function useDeleteCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: async (_) => {
      await queryClient.refetchQueries({
        queryKey: collectionsOptions.queryKey,
      });
    },
  });
}

export const collectionFilesOptions = (id: string) =>
  queryOptions({
    queryKey: ["collections", id, "files"],
    queryFn: () => getCollectionFiles(id),
  });

export function useAddFileToCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      addFileToCollection(id, fileId),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: fileOptions(variables.fileId).queryKey,
        }),
        queryClient.refetchQueries({
          queryKey: collectionFilesOptions(variables.id).queryKey,
        }),
      ]);
    },
  });
}

export function useRemoveFileFromCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      removeFileFromCollection(id, fileId),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: fileOptions(variables.fileId).queryKey,
        }),
        queryClient.refetchQueries({
          queryKey: collectionFilesOptions(variables.id).queryKey,
        }),
      ]);
    },
  });
}
