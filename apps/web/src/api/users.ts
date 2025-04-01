import type { User } from "@/model/User";
import { client } from "./client";

export const me = () => client.get("/me").json<User>();
