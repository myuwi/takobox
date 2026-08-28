import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { isAxiosError } from "axios";
import { CircleX, X } from "lucide-react";
import { formatError } from "@/utils/error";
import { Button } from "./Button";

export const toast = ToastPrimitive.createToastManager();

export const toastError = (title: string, error: unknown) => {
  if (!isAxiosError(error)) {
    console.error(error);
  }

  toast.add({
    type: "error",
    title,
    description: isAxiosError(error) ? formatError(error) : undefined,
    priority: "high",
  });
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className="flex gap-3 rounded-md border border-border bg-popover px-4 py-3 shadow-lg transition-all duration-200 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
    >
      {toast.type === "error" && <CircleX size={20} className="h-lh text-destructive" />}

      <div className="flex min-w-0 flex-col gap-1">
        <ToastPrimitive.Title className="font-medium data-[type=error]:text-destructive" />
        <ToastPrimitive.Description className="text-sm" />
      </div>

      <ToastPrimitive.Close
        render={<Button variant="ghost" size="icon-sm" className="ml-auto self-start p-0" />}
        aria-label="Dismiss"
      >
        <X />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ));
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toast}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
