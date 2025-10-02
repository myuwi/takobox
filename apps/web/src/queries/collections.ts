import { queryOptions, useMutation } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: createCollection,
    onSuccess: async (_, _variables, _mutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: collectionsOptions.queryKey,
      });
    },
  });
}

export function useRenameCollectionMutation() {
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameCollection(id, name),
    onSuccess: async (_, _variables, _mutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: collectionsOptions.queryKey,
      });
    },
  });
}

export function useDeleteCollectionMutation() {
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: async (_, _variables, _mutateResult, context) => {
      await context.client.invalidateQueries({
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
  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      addFileToCollection(id, fileId),
    onSuccess: async (_, variables, _mutateResult, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: fileOptions(variables.fileId).queryKey,
        }),
        context.client.invalidateQueries({
          queryKey: collectionFilesOptions(variables.id).queryKey,
        }),
      ]);
    },
  });
}

export function useRemoveFileFromCollectionMutation() {
  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      removeFileFromCollection(id, fileId),
    onSuccess: async (_, variables, _mutateResult, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: fileOptions(variables.fileId).queryKey,
        }),
        context.client.invalidateQueries({
          queryKey: collectionFilesOptions(variables.id).queryKey,
        }),
      ]);
    },
  });
}
