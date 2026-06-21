import { TakoboxClient } from "./gen";
import { createClient as createHeyApiClient, type Config } from "./gen/client";
export * from "./gen/types.gen";
export { type Config as TakoboxClientConfig, TakoboxClient };

export const createTakoboxClient = (options: Config = {}) => {
  return new TakoboxClient({
    client: createHeyApiClient(options),
  });
};
