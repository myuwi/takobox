import { useQuery } from "@tanstack/react-query";
import { me } from "@/api/users";

export function useMeQuery() {
  const enabled = !!localStorage.getItem("token");

  return useQuery({
    queryKey: ["me"],
    queryFn: me,
    enabled,
  });
}
