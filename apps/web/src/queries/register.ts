import { mutationOptions } from "@tanstack/react-query";
import type { AuthCredentials } from "@takobox/sdk";
import { client } from "@/api/client";
import { meOptions } from "./me";

export const registerOptions = mutationOptions({
  mutationFn: (body: AuthCredentials) => client.auth.register({ body }),
  onSuccess: async (_, _variables, _mutateResult, context) => {
    await context.client.invalidateQueries({ queryKey: meOptions.queryKey });
  },
});
