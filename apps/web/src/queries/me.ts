import { useQuery } from "@tanstack/react-query";
import * as users from "@/api/users";

export function useMeQuery() {
  const enabled = !!localStorage.getItem("token");

  return useQuery({
    queryKey: ["me"],
    queryFn: users.me,
    enabled,
  });
}
