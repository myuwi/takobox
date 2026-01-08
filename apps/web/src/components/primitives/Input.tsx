import { cn } from "@/utils/cn";

export interface InputProps extends React.ComponentProps<"input"> {
  containerClassName?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = ({
  containerClassName,
  className,
  leadingIcon,
  trailingIcon,
  ...props
}: InputProps) => {
  return (
    <div
      className={cn(
        "group relative w-full has-[input[disabled]]:cursor-not-allowed has-[input[disabled]]:opacity-50 has-[input[disabled]]:*:pointer-events-none",
        containerClassName,
      )}
    >
      {leadingIcon && (
        <span className="absolute top-1/2 left-3 shrink-0 -translate-y-1/2 text-muted-foreground [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4">
          {leadingIcon}
        </span>
      )}
      <input
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-invalid:border-destructive aria-invalid:bg-destructive/5 aria-invalid:text-destructive",
          leadingIcon && "pl-10",
          trailingIcon && "pr-10",
          className,
        )}
        {...props}
      />
      {trailingIcon && (
        <span className="absolute top-1/2 right-3 shrink-0 -translate-y-1/2 text-muted-foreground [&_svg]:shrink-0 [&_svg:not([class*='pointer-events-'])]:pointer-events-none [&_svg:not([class*='size-'])]:size-4">
          {trailingIcon}
        </span>
      )}
    </div>
  );
};
