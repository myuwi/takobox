import React from "react";
import { Dialog as SheetPrimitive } from "@base-ui-components/react/dialog";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { tw } from "@/utils/tw";

export const Root = SheetPrimitive.Root;

export const Trigger = SheetPrimitive.Trigger;

export const Portal = SheetPrimitive.Portal;

export const Close = SheetPrimitive.Close;

export const Backdrop = tw(
  SheetPrimitive.Backdrop,
)`fixed inset-0 z-50 bg-black/50 transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0`;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-background shadow-sm transition duration-200 ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto origin-top rounded-b-lg data-ending-style:-translate-y-full data-starting-style:-translate-y-full",
        left: "inset-y-0 left-0 h-full w-3/4 origin-left rounded-r-lg data-ending-style:-translate-x-full data-starting-style:-translate-x-full sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 origin-right rounded-l-lg data-ending-style:translate-x-full data-starting-style:translate-x-full sm:max-w-sm",
        bottom:
          "inset-x-0 bottom-0 h-auto origin-bottom rounded-t-lg data-ending-style:translate-y-full data-starting-style:translate-y-full",
      },
    },
    defaultVariants: {
      side: "left",
    },
  },
);

export function Content({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Portal>
      <Backdrop forceRender />
      <SheetPrimitive.Popup className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
      </SheetPrimitive.Popup>
    </Portal>
  );
}

export const Header = tw.div`flex flex-col gap-1.5 p-4`;

export const Footer = tw.div`mt-auto flex flex-col gap-2 p-4`;

export const Title = tw(SheetPrimitive.Title)`font-semibold text-foreground`;

export const Description = tw(SheetPrimitive.Description)`text-muted-foreground text-sm`;
