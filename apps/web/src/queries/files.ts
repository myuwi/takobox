import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";
import { client } from "@/api/client";
import { collectionFilesOptions } from "./collections";

export const filesOptions = queryOptions({
  queryKey: ["files"],
  queryFn: async () => {
    const { data } = await client.files.list();
    return data;
  },
});

export const fileOptions = (id: string) =>
  queryOptions({
    queryKey: ["files", id],
    queryFn: async () => {
      const { data } = await client.files.get({ path: { id } });
      return data;
    },
  });

interface UploadFileMutationArgs {
  file: File;
  collectionId?: string;
  onUploadProgress?: (event: AxiosProgressEvent) => void;
  signal?: AbortSignal;
}

export const uploadFileOptions = mutationOptions({
  mutationFn: ({ file, collectionId, onUploadProgress, signal }: UploadFileMutationArgs) => {
    return client.files.upload({
      body: { file },
      query: { collectionId },
      onUploadProgress,
      signal,
    });
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
  mutationFn: ({ id, name }: { id: string; name: string }) =>
    client.files.rename({ path: { id }, body: { name } }),
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
  mutationFn: (id: string) => client.files.delete({ path: { id } }),
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
