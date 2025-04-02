import { useMutation } from "@tanstack/react-query";
import * as auth from "@/api/auth";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: auth.register,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
    },
  });
}
