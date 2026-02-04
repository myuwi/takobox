import type { AuthPayload } from "@/types";
import { client } from "./client";

export const login = async (data: AuthPayload) => {
  return await client.post("/auth/login", { body: data });
};

export const register = async (data: AuthPayload) => {
  return await client.post("/auth/register", { body: data });
};

export const logout = async () => {
  return await client.post("/auth/logout");
};

export const me = async () => {
  return await client.get("/me");
};
