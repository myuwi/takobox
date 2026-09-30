import { z } from "zod";

const schema = z.object({
  TAKOBOX_INTERNAL_API_URL: z.url(),
  TAKOBOX_DISABLE_LANDING_PAGE: z.stringbool().default(false),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
}

export const env = result.data;
