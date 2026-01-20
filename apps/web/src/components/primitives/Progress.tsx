import type React from "react";
import { Progress as ProgressPrimitive } from "@base-ui-components/react";
import { cn } from "@/utils/cn";

export function Progress({
  className,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root className="relative w-full" {...props}>
      <ProgressPrimitive.Track
        className={cn("h-2 w-full overflow-hidden rounded-full bg-accent", className)}
      >
        <ProgressPrimitive.Indicator className="h-full bg-primary transition-all" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}
