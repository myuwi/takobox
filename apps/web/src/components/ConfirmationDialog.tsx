import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { confirmationDialogAtom } from "@/atoms/dialogs";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";

export const ConfirmationDialog = () => {
  const [open, setOpen] = useState(false);

  const [confirmationDialog, setConfirmationDialog] = useAtom(confirmationDialogAtom);

  const handleConfirm = async () => {
    await confirmationDialog?.callback();
    setOpen(false);
  };

  const handleOpenChangeComplete = (open: boolean) => {
    if (!open) {
      setConfirmationDialog(null);
    }
  };

  useEffect(() => {
    setOpen(!!confirmationDialog);
  }, [confirmationDialog]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={handleOpenChangeComplete}>
      <Dialog.Content finalFocus={confirmationDialog?.focusRef}>
        <Dialog.Header>
          <Dialog.Title>{confirmationDialog?.title}</Dialog.Title>
          <Dialog.Description>{confirmationDialog?.description}</Dialog.Description>
        </Dialog.Header>

        <Dialog.Footer>
          <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
          <Button variant="destructive" onClick={handleConfirm}>
            {confirmationDialog?.confirmText ?? "Confirm"}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
