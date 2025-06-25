import { client } from "./client";

export const getFiles = () => client.get("files").json<never[]>();
