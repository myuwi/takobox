import { useMutation } from "@tanstack/react-query";
import * as auth from "@/api/auth";

export function useLoginMutation() {
  return useMutation({
    mutationFn: auth.login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
    },
  });
}
