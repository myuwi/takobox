import type { AuthPayload } from "@/types/AuthPayload";
import type { Token } from "@/types/Token";
import type { User } from "@/types/User";
import { client } from "./client";

export const login = (payload: AuthPayload) =>
  client.post("auth/login", { json: payload }).json<Token>();

export const register = (payload: AuthPayload) =>
  client.post("auth/register", { json: payload }).json<Token>();

export const me = () => client.get("me").json<User>();
