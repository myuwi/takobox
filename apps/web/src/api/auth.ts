import type { AuthPayload } from "@/types";
import { client } from "./client";

export const login = async (payload: AuthPayload) => {
  return await client.post("/auth/login", { json: payload });
};

export const register = async (payload: AuthPayload) => {
  return await client.post("/auth/register", { json: payload });
};

export const logout = async () => {
  return await client.post("/auth/logout");
};

export const me = async () => {
  return await client.get("/me");
};
