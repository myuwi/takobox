import { client } from "./client";

export const getCollections = async () => {
  return await client.get("/collections");
};

export const createCollection = async (name: string) => {
  return await client.post("/collections", { json: { name } });
};

export const renameCollection = async (id: string, name: string) => {
  return await client.patch("/collections/{collection_id}", {
    path: { collection_id: id },
    json: { name },
  });
};

export const deleteCollection = async (id: string) => {
  return await client.delete("/collections/{collection_id}", {
    path: { collection_id: id },
  });
};

export const getCollectionFiles = async (id: string) => {
  return await client.get("/collections/{collection_id}/files", {
    path: { collection_id: id },
  });
};

export const addFileToCollection = async (id: string, fileId: string) => {
  return await client.post("/collections/{collection_id}/files", {
    path: { collection_id: id },
    json: { id: fileId },
  });
};

export const removeFileFromCollection = async (id: string, fileId: string) => {
  return await client.delete("/collections/{collection_id}/files", {
    path: { collection_id: id },
    json: { id: fileId },
  });
};
