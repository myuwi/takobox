import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { createCollectionOptions } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Alert } from "./primitives/Alert";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import { Input } from "./primitives/Input";
import { Label } from "./primitives/Label";

export const CreateCollectionDialog = () => {
  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  const {
    mutateAsync: createCollection,
    isError,
    error,
  } = useMutation(createCollectionOptions);

  const [showError, setShowError] = useState(false);

  const [open, setOpen] = useState(false);

  const handleCleanup = (open: boolean) => {
    if (!open) {
      reset();
      setShowError(false);
    }
  };

  const onSubmit = async (values: { name: string }) => {
    try {
      await createCollection(values.name);
      setOpen(false);
    } catch (_) {
      setShowError(true);
    }
  };

  const disabled = isError && showError;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleCleanup}
    >
      <Dialog.Trigger
        render={
          <Button variant="ghost" size="icon-sm" className="mr-1">
            <Plus className="p-0.5" />
          </Button>
        }
      />
      <Dialog.Content>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setShowError(false)}
        >
          <Dialog.Header>
            <Dialog.Title>Create new collection</Dialog.Title>
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
              Create
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
