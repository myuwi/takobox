import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { renameCollectionOptions } from "@/queries/collections";
import type { CollectionDto } from "@/types/CollectionDto";
import { formatError } from "@/utils/error";
import { Alert } from "./primitives/Alert";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import { Input } from "./primitives/Input";
import { Label } from "./primitives/Label";

interface RenameCollectionDialogProps {
  collection: CollectionDto;
  open: boolean;
  setOpen: (open: boolean) => void;
  focusRef: React.RefObject<HTMLElement | null>;
}

export const RenameCollectionDialog = ({
  collection,
  open,
  setOpen,
  focusRef,
}: RenameCollectionDialogProps) => {
  const { register, handleSubmit, reset, watch } = useForm<{
    name: string;
  }>({
    values: {
      name: collection.name,
    },
  });

  const {
    mutateAsync: renameCollection,
    isError,
    error,
  } = useMutation(renameCollectionOptions);

  const [showError, setShowError] = useState(false);

  const handleCleanup = (open: boolean) => {
    if (!open) {
      reset();
      setShowError(false);
    }
  };

  const onSubmit = async (values: { name: string }) => {
    try {
      await renameCollection({ id: collection.id, name: values.name });
      setOpen(false);
    } catch (_) {
      setShowError(true);
    }
  };

  const name = watch("name", collection.name);
  const disabled =
    (isError && showError) || name === collection.name || name === "";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleCleanup}
    >
      <Dialog.Content finalFocus={focusRef}>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setShowError(false)}
        >
          <Dialog.Header>
            <Dialog.Title>Rename collection</Dialog.Title>
          </Dialog.Header>

          <div>
            <Label className="flex flex-col gap-2">
              Name
              <Input
                {...register("name", { required: true })}
                type="text"
                placeholder="Collection name"
                autoComplete="off"
                aria-invalid={showError && isError}
              />
              {isError && showError && <Alert>{formatError(error)}</Alert>}
            </Label>
          </div>

          <Dialog.Footer>
            <Dialog.Close render={<Button variant="outline" />}>
              Cancel
            </Dialog.Close>
            <Button type="submit" disabled={disabled}>
              Rename
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
