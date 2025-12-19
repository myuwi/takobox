export type FileDto = {
  id: string;
  name: string;
  filename: string;
  size: number;
  createdAt: string;
};

export type FileWithCollections = FileDto & {
  collections: { id: string; name: string }[];
};
