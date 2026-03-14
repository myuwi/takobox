import { Checkbox as CheckboxPrimitive } from "@base-ui-components/react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export const Checkbox = ({ className, ...props }: CheckboxPrimitive.Root.Props) => {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-sm bg-accent inset-ring inset-ring-primary-foreground transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary-foreground data-checked:text-white",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current transition-none [&>svg]:size-3.5">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
