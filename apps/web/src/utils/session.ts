import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { logout as logoutFn } from "@/api/auth";

export const logout = createServerFn().handler(async () => {
  await logoutFn();

  throw redirect({
    to: "/",
    reloadDocument: true,
  });
});
