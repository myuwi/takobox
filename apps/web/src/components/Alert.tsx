import type { PropsWithChildren } from "react";
import { CircleAlert } from "lucide-react";

export type AlertProps = PropsWithChildren;

export const Alert = ({ children }: AlertProps) => {
  return (
    <div className="flex items-center gap-2 rounded-md bg-red-300/20 px-3 py-2 text-red-500">
      <CircleAlert size={20} />
      {children}
    </div>
  );
};
