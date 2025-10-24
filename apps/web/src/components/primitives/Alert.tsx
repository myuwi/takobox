import type { PropsWithChildren } from "react";
import { CircleAlert, X } from "lucide-react";
import { Button } from "./Button";

export interface AlertProps extends PropsWithChildren {
  onDismiss?: () => void;
}

export const Alert = ({ children, onDismiss }: AlertProps) => {
  return (
    <div className="flex gap-3 rounded-md bg-red-300/20 px-4 py-3 text-red-500">
      <CircleAlert size={20} className="h-[1lh]" />
      {children}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          onClick={onDismiss}
        >
          <X />
        </Button>
      )}
    </div>
  );
};
