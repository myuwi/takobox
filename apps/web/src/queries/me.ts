import { queryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { client } from "@/api/client";

export const meOptions = queryOptions({
  queryKey: ["me"],
  staleTime: Infinity,
  queryFn: async () => {
    try {
      const { data } = await client.me.get();
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        return null;
      }

      throw error;
    }
  },
});
