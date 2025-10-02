import { mutationOptions } from "@tanstack/react-query";
import { register } from "@/api/auth";
import { meOptions } from "./me";

export const registerOptions = mutationOptions({
  mutationFn: register,
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await context.client.invalidateQueries({ queryKey: meOptions.queryKey });
  },
});
