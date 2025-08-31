import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCollection,
  deleteCollection,
  getCollections,
  renameCollection,
} from "@/api/collections";

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
