import { TakoboxClient } from "./gen";
import { createClient as createHeyApiClient, type Config } from "./gen/client";
export * from "./gen/types.gen";
export { TakoboxClient };

export type TakoboxClientConfig = Omit<Config, "throwOnError">;

export const createTakoboxClient = (options: TakoboxClientConfig = {}) => {
  return new TakoboxClient({
    client: createHeyApiClient({ ...options, throwOnError: true }),
  });
};
