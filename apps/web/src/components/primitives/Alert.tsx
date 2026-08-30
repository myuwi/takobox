import type { PropsWithChildren } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

const alertVariants = cva("flex gap-3 rounded-md px-3 py-2.5", {
  variants: {
    variant: {
      error: "border border-destructive/20 bg-destructive/10 text-destructive",
      info: "border border-border text-foreground",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

export interface AlertProps extends PropsWithChildren, VariantProps<typeof alertVariants> {
  className?: string;
  onDismiss?: () => void;
}

export const Alert = ({ className, variant, children, onDismiss }: AlertProps) => {
  const Icon = variant === "info" ? Info : CircleAlert;

  return (
    <div className={cn(alertVariants({ variant, className }))}>
      <Icon />
      {children}
      {onDismiss && (
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onDismiss}>
          <X />
        </Button>
      )}
    </div>
  );
};
