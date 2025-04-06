import { useMutation } from "@tanstack/react-query";
import { register } from "@/api/auth";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
    },
  });
}
