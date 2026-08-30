import { useQuery } from "@tanstack/react-query";
import { meOptions } from "@/queries/me";
import { settingsOptions } from "@/queries/settings";
import { Alert } from "./primitives/Alert";

export const ConnectionBanner = () => {
  const me = useQuery(meOptions);
  const settings = useQuery(settingsOptions);

  const unreachable =
    (me.errorUpdateCount > 0 && !me.isSuccess) ||
    (settings.errorUpdateCount > 0 && !settings.isSuccess);

  return (
    <output className="fixed inset-x-0 bottom-0 z-50">
      {unreachable && (
        <Alert className="justify-center rounded-b-none">
          Unable to reach the server. Some information may be missing or out of date.
        </Alert>
      )}
    </output>
  );
};
