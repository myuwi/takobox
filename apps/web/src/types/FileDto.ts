export type FileDto = {
  id: string;
  userId: string;
  name: string;
  original: string;
  size: number;
  createdAt: string;
};

export type FileWithCollections = {
  id: string;
  userId: string;
  name: string;
  original: string;
  size: number;
  createdAt: string;
  collections: { id: string; name: string }[];
};
