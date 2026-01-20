import React from "react";
import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";
import { cn } from "@/utils/cn";
import { stopPropagation } from "@/utils/event";
import { tw } from "@/utils/tw";

export const Root = DialogPrimitive.Root;

export const Trigger = DialogPrimitive.Trigger;

export const Portal = DialogPrimitive.Portal;

export const Close = DialogPrimitive.Close;

export const Backdrop = tw(
  DialogPrimitive.Backdrop,
)`fixed inset-0 z-50 bg-black/50 transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0`;

export function Content({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <Portal>
      <Backdrop forceRender />
      <DialogPrimitive.Popup
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-background p-6 shadow-lg sm:max-w-lg",
          "duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className,
        )}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </Portal>
  );
}

export const Header = tw.div`flex flex-col gap-4 text-center sm:text-left`;

export const Footer = tw.div`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`;

export const Title = tw(DialogPrimitive.Title)`text-lg leading-none font-semibold`;

export const Description = tw(DialogPrimitive.Description)`text-muted-foreground text-sm`;
