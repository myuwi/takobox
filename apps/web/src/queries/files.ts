import { queryOptions, useQuery } from "@tanstack/react-query";
import { getFiles } from "@/api/files";

export const filesOptions = queryOptions({
  queryKey: ["files"],
  queryFn: getFiles,
});

export function useFilesQuery() {
  return useQuery(filesOptions);
}
