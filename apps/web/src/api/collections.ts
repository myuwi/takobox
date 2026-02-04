import { client } from "./client";

export const getCollections = async () => {
  return await client.get("/collections");
};

export const createCollection = async (name: string) => {
  return await client.post("/collections", { body: { name } });
};

export const renameCollection = async (id: string, name: string) => {
  return await client.patch("/collections/{id}", {
    path: { id },
    body: { name },
  });
};

export const deleteCollection = async (id: string) => {
  return await client.delete("/collections/{id}", {
    path: { id },
  });
};

export const getCollectionFiles = async (id: string) => {
  return await client.get("/collections/{id}/files", {
    path: { id },
  });
};

export const addFileToCollection = async (id: string, fileId: string) => {
  return await client.post("/collections/{id}/files", {
    path: { id },
    body: { id: fileId },
  });
};

export const removeFileFromCollection = async (id: string, fileId: string) => {
  return await client.delete("/collections/{id}/files", {
    path: { id },
    body: { id: fileId },
  });
};
