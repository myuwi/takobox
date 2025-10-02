import { mutationOptions } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { meOptions } from "./me";

export const loginOptions = mutationOptions({
  mutationFn: login,
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await context.client.invalidateQueries({ queryKey: meOptions.queryKey });
  },
});
