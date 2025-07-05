import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { meOptions } from "./me";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: async (_) => {
      await queryClient.invalidateQueries({ queryKey: meOptions.queryKey });
    },
  });
}
