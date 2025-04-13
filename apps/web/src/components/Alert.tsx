import type { PropsWithChildren } from "react";

export type AlertProps = PropsWithChildren;

export const Alert = ({ children }: AlertProps) => {
  return (
    <div className="rounded-md bg-red-300/20 px-3 py-2 text-center text-red-500">
      {children}
    </div>
  );
};
