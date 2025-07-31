import React from "react";
import { cva } from "class-variance-authority";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cn } from "@/utils/cn";
import { twx } from "@/utils/twx";

export const Sheet = SheetPrimitive.Root;

export const SheetTrigger = SheetPrimitive.Trigger;

export const SheetClose = SheetPrimitive.Close;

export const SheetPortal = SheetPrimitive.Portal;

export const SheetOverlay = twx(
  SheetPrimitive.Overlay,
)`fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0`;
SheetOverlay.displayName = SheetPrimitive.DialogOverlay.displayName;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-background shadow-md transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-200",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        left: "inset-y-0 left-0 h-full w-3/4 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
        bottom:
          "inset-x-0 bottom-0 h-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
    },
    defaultVariants: {
      side: "left",
    },
  },
);

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export const SheetHeader = twx.div`flex flex-col gap-1.5 p-4`;

export const SheetFooter = twx.div`mt-auto flex flex-col gap-2 p-4`;

export const SheetTitle = twx(
  SheetPrimitive.Title,
)`font-semibold text-foreground`;

export const SheetDescription = twx(
  SheetPrimitive.Description,
)`text-muted-foreground text-sm`;
