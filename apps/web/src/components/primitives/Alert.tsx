import type { PropsWithChildren } from "react";
import { CircleAlert, X } from "lucide-react";
import { Button } from "./Button";

export interface AlertProps extends PropsWithChildren {
  onDismiss?: () => void;
}

export const Alert = ({ children, onDismiss }: AlertProps) => {
  return (
    <div className="flex items-center gap-3 rounded-md bg-red-300/20 px-3 py-2 text-red-500">
      <CircleAlert size={20} />
      {children}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6 p-1"
          onClick={onDismiss}
        >
          <X />
        </Button>
      )}
    </div>
  );
};
