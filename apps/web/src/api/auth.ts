import type { AuthPayload } from "@/model/AuthPayload";
import type { Token } from "@/model/Token";
import { client } from "./client";

export const login = (payload: AuthPayload) =>
  client.post("/auth/login", { json: payload }).json<Token>();

export const register = (payload: AuthPayload) =>
  client.post("/auth/register", { json: payload }).json<Token>();
