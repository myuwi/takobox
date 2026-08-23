import { useAtom } from "jotai";
import { confirmationDialogAtom } from "@/atoms/dialogs";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";

export const ConfirmationDialog = () => {
  const [confirmationDialog, setConfirmationDialog] = useAtom(confirmationDialogAtom);

  const handleOpenChange = (open: boolean) => {
    setConfirmationDialog((dialog) => (dialog ? { ...dialog, open } : null));
  };

  const handleConfirm = async () => {
    await confirmationDialog?.callback();
    handleOpenChange(false);
  };

  const handleOpenChangeComplete = (open: boolean) => {
    if (!open) {
      setConfirmationDialog((dialog) => (dialog?.open === false ? null : dialog));
    }
  };

  return (
    <Dialog.Root
      open={confirmationDialog?.open ?? false}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
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
