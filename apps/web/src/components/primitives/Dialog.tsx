import React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/utils/cn";
import { stopPropagation } from "@/utils/event";
import { tw } from "@/utils/tw";

interface BusyContextValue {
  busy: boolean;
  setBusy: (busy: boolean) => void;
}

const BusyContext = React.createContext<BusyContextValue | undefined>(undefined);

const useBusyContext = () => {
  const context = React.useContext(BusyContext);
  if (!context) {
    throw new Error("Dialog parts must be used within a Dialog.Root");
  }

  return context;
};

export function Root<Payload>({ onOpenChange, ...props }: DialogPrimitive.Root.Props<Payload>) {
  const [busy, setBusy] = React.useState(false);

  return (
    <BusyContext value={{ busy, setBusy }}>
      <DialogPrimitive.Root
        onOpenChange={(open, eventDetails) => {
          if (!open && busy && eventDetails.reason !== "imperative-action") {
            eventDetails.cancel();
            return;
          }

          onOpenChange?.(open, eventDetails);
        }}
        {...props}
      />
    </BusyContext>
  );
}

export const useBusy = (busy: boolean) => {
  const { setBusy } = useBusyContext();

  React.useLayoutEffect(() => {
    setBusy(busy);
    return () => setBusy(false);
  }, [setBusy, busy]);
};

export const Trigger = DialogPrimitive.Trigger;

export const Portal = DialogPrimitive.Portal;

export function Close(props: DialogPrimitive.Close.Props) {
  const { busy } = useBusyContext();

  return <DialogPrimitive.Close disabled={busy} {...props} />;
}

export const createHandle = DialogPrimitive.createHandle;

export const Backdrop = tw(
  DialogPrimitive.Backdrop,
)`fixed inset-0 z-50 bg-black/50 transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0`;

export function Content({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  const { busy } = useBusyContext();

  return (
    <Portal>
      <Backdrop forceRender />
      <DialogPrimitive.Popup
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-[-50%] gap-4 rounded-lg border border-border bg-background p-4 shadow-lg sm:max-w-md",
          "duration-200 data-ending-style:pointer-events-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className,
        )}
        aria-busy={busy || undefined}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </Portal>
  );
}

export const Header = tw.div`flex flex-col gap-2 text-center sm:text-left`;

export const Footer = tw.div`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`;

export const Title = tw(DialogPrimitive.Title)`text-lg font-medium`;

export const Description = tw(DialogPrimitive.Description)`text-sm text-muted-foreground`;
