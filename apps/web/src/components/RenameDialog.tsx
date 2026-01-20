import { useEffect, useState } from "react";
import { isAxiosError, type AxiosError } from "axios";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import { renameDialogAtom } from "@/atoms/dialogs";
import { formatError } from "@/utils/error";
import { Alert } from "./primitives/Alert";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import { Input } from "./primitives/Input";
import { Label } from "./primitives/Label";

export const RenameDialog = () => {
  const [open, setOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useAtom(renameDialogAtom);
  const [error, setError] = useState<AxiosError>();
  const isError = !!error;

  const { register, handleSubmit, reset, watch } = useForm<{
    name: string;
  }>({
    values: {
      name: renameDialog?.initialValue ?? "",
    },
  });

  const handleOpenChangeComplete = (open: boolean) => {
    if (!open) {
      reset();
      setError(undefined);
      setRenameDialog(null);
    }
  };

  useEffect(() => {
    setOpen(!!renameDialog);
  }, [renameDialog]);

  const onSubmit = async (values: { name: string }) => {
    try {
      await renameDialog?.callback(values.name);
      setOpen(false);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err);
      } else {
        console.error(err);
      }
    }
  };

  const name = watch("name");
  const disabled = isError || name === renameDialog?.initialValue || name === "";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={handleOpenChangeComplete}>
      <Dialog.Content finalFocus={renameDialog?.focusRef}>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setError(undefined)}
        >
          <Dialog.Header>
            <Dialog.Title>{renameDialog?.title}</Dialog.Title>
          </Dialog.Header>

          <div>
            <Label className="flex flex-col gap-2">
              Name
              <Input
                {...register("name", { required: true })}
                type="text"
                placeholder={renameDialog?.placeholder ?? "Name"}
                autoComplete="off"
                aria-invalid={isError}
              />
              {isError && <Alert>{formatError(error)}</Alert>}
            </Label>
          </div>

          <Dialog.Footer>
            <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
            <Button type="submit" disabled={disabled}>
              Rename
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
