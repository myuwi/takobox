import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { client } from "@/api/client";
import { fileCollectionsOptions } from "./files";

export const collectionsOptions = queryOptions({
  queryKey: ["collections"],
  queryFn: async () => {
    const { data } = await client.collections.list();
    return data;
  },
});

const collectionOptions = (collectionId: string) =>
  queryOptions({
    queryKey: ["collections", collectionId],
    // queryFn: getCollection,
  });

export const createCollectionOptions = mutationOptions({
  mutationFn: (name: string) => client.collections.create({ body: { name } }),
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await context.client.invalidateQueries({
      queryKey: collectionsOptions.queryKey,
    });
  },
});

export const renameCollectionOptions = mutationOptions({
  mutationFn: ({ id, name }: { id: string; name: string }) =>
    client.collections.rename({ path: { id }, body: { name } }),
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await context.client.invalidateQueries({
      queryKey: collectionsOptions.queryKey,
    });
  },
});

export const deleteCollectionOptions = mutationOptions({
  mutationFn: (id: string) => client.collections.delete({ path: { id } }),
  onSuccess: async (_, collectionId, _mutateResult, context) => {
    context.client.removeQueries(collectionOptions(collectionId));

    await context.client.invalidateQueries({
      queryKey: collectionsOptions.queryKey,
    });
  },
});

export const collectionFilesOptions = (id: string) =>
  queryOptions({
    queryKey: ["collections", id, "files"],
    queryFn: async () => {
      const { data } = await client.collections.files.list({
        path: { id },
      });
      return data;
    },
  });

export const addFileToCollectionOptions = mutationOptions({
  mutationKey: ["collections", "files", "add"],
  mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
    client.collections.files.add({
      path: { id },
      body: { id: fileId },
    }),
  onSuccess: async (_, variables, _mutateResult, context) => {
    await Promise.all([
      context.client.invalidateQueries({
        queryKey: fileCollectionsOptions(variables.fileId).queryKey,
      }),
      context.client.invalidateQueries({
        queryKey: collectionFilesOptions(variables.id).queryKey,
      }),
    ]);
  },
});

export const removeFileFromCollectionOptions = mutationOptions({
  mutationKey: ["collections", "files", "remove"],
  mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
    client.collections.files.remove({
      path: { id },
      body: { id: fileId },
    }),
  onSuccess: async (_, variables, _mutateResult, context) => {
    await Promise.all([
      context.client.invalidateQueries({
        queryKey: fileCollectionsOptions(variables.fileId).queryKey,
      }),
      context.client.invalidateQueries({
        queryKey: collectionFilesOptions(variables.id).queryKey,
      }),
    ]);
  },
});
