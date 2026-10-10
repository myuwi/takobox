import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError, type AxiosError } from "axios";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { createCollectionOptions } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Field from "./primitives/Field";
import { Input } from "./primitives/Input";

export const CreateCollectionDialog = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<AxiosError>();
  const isError = !!error;

  const { register, handleSubmit, reset, watch } = useForm<{ name: string }>({
    values: { name: "" },
  });

  const { mutateAsync: createCollection } = useMutation(createCollectionOptions);

  const handleCleanup = (open: boolean) => {
    if (!open) {
      reset();
      setError(undefined);
    }
  };

  const onSubmit = async (values: { name: string }) => {
    try {
      await createCollection(values.name);
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
  const disabled = isError || name === "";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={handleCleanup}>
      <Dialog.Trigger
        render={
          <Button variant="ghost" size="icon-sm" className="mr-1">
            <Plus className="glyph-sm" />
            <span className="sr-only">Create collection</span>
          </Button>
        }
      />
      <Dialog.Content>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onChange={() => setError(undefined)}
        >
          <Dialog.Header>
            <Dialog.Title>Create new collection</Dialog.Title>
          </Dialog.Header>

          <Field.Group>
            <Field.Root invalid={isError}>
              <Field.Label>Name</Field.Label>
              <Input
                {...register("name", { required: true })}
                type="text"
                placeholder="Collection name"
                autoComplete="off"
              />
              {isError && <Field.Error match>{formatError(error)}</Field.Error>}
            </Field.Root>
          </Field.Group>

          <Dialog.Footer>
            <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
            <Button type="submit" disabled={disabled}>
              Create
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
