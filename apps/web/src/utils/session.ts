import { createServerFn } from "@tanstack/react-start";
import { deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

export const logout = createServerFn().handler(() => {
  deleteCookie("token");

  throw redirect({
    to: "/",
    reloadDocument: true,
  });
});
