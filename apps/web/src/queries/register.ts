import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "@/api/auth";
import { meOptions } from "./me";

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: async (_) => {
      await queryClient.refetchQueries({ queryKey: meOptions.queryKey });
    },
  });
}
