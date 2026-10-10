import { useState } from "react";
import { isAxiosError, type AxiosError } from "axios";
import { useAtom } from "jotai";
import { useForm } from "react-hook-form";
import { renameDialogAtom } from "@/atoms/dialogs";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Field from "./primitives/Field";
import { Input } from "./primitives/Input";

export const RenameDialog = () => {
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
      setRenameDialog((dialog) => (dialog?.open === false ? null : dialog));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setRenameDialog((dialog) => (dialog ? { ...dialog, open } : null));
  };

  const onSubmit = async (values: { name: string }) => {
    try {
      await renameDialog?.callback(values.name);
      handleOpenChange(false);
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
    <Dialog.Root
      open={renameDialog?.open ?? false}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Dialog.Content finalFocus={renameDialog?.focusRef}>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setError(undefined)}
        >
          <Dialog.Header>
            <Dialog.Title>{renameDialog?.title}</Dialog.Title>
          </Dialog.Header>

          <Field.Group>
            <Field.Root invalid={isError}>
              <Field.Label>Name</Field.Label>
              <Input
                {...register("name", { required: true })}
                type="text"
                placeholder={renameDialog?.placeholder ?? "Name"}
                autoComplete="off"
              />
              {isError && <Field.Error match>{formatError(error)}</Field.Error>}
            </Field.Root>
          </Field.Group>

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
