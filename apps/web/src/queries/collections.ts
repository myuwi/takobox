import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addFileToCollection,
  createCollection,
  deleteCollection,
  getCollections,
  removeFileFromCollection,
  renameCollection,
} from "@/api/collections";
import { fileOptions } from "./files";

export const collectionsOptions = queryOptions({
  queryKey: ["collections"],
  queryFn: getCollections,
});

export function useCollectionsQuery() {
  return useQuery(collectionsOptions);
}

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

export function useAddFileToCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      addFileToCollection(id, fileId),
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: fileOptions(variables.fileId).queryKey,
      });
    },
  });
}

export function useRemoveFileFromCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      removeFileFromCollection(id, fileId),
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: fileOptions(variables.fileId).queryKey,
      });
    },
  });
}
