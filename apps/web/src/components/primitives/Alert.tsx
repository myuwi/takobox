import type { PropsWithChildren } from "react";
import { CircleAlert, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export interface AlertProps extends PropsWithChildren {
  className?: string;
  onDismiss?: () => void;
}

export const Alert = ({ className, children, onDismiss }: AlertProps) => {
  return (
    <div className={cn("flex gap-3 rounded-md bg-red-300/20 px-4 py-3 text-red-500", className)}>
      <CircleAlert size={20} className="h-[1lh]" />
      {children}
      {onDismiss && (
        <Button variant="ghost" size="icon-sm" className="ml-auto p-0" onClick={onDismiss}>
          <X />
        </Button>
      )}
    </div>
  );
};
