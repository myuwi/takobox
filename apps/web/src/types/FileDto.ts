export type FileDto = {
  id: string;
  userId: string;
  name: string;
  original: string;
  size: number;
  createdAt: string;
};

export type FileWithCollections = FileDto & {
  collections: { id: string; name: string }[];
};
