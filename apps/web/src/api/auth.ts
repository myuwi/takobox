import type { AuthPayload, UserDto } from "@/types";
import { client } from "./client";

export const login = async (payload: AuthPayload) => {
  const { data } = await client.post("auth/login", payload);
  return data;
};

export const register = async (payload: AuthPayload) => {
  const { data } = await client.post("auth/register", payload);
  return data;
};

export const logout = async () => {
  const { data } = await client.post("auth/logout");
  return data;
};

export const me = async () => {
  const { data } = await client.get<UserDto>("me");
  return data;
};
