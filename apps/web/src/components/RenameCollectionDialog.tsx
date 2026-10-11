import type { RefObject } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Collection } from "@takobox/sdk";
import { renameCollectionOptions } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Field from "./primitives/Field";
import { Input } from "./primitives/Input";

interface RenameCollectionPayload {
  collection: Collection;
  returnFocus: RefObject<HTMLElement | null>;
}

export const renameCollectionDialog = Dialog.createHandle<RenameCollectionPayload>();

export const RenameCollectionDialog = () => (
  <Dialog.Root handle={renameCollectionDialog}>
    {({ payload }) =>
      payload && (
        <Dialog.Content finalFocus={payload.returnFocus}>
          <RenameCollectionForm collection={payload.collection} />
        </Dialog.Content>
      )
    }
  </Dialog.Root>
);

const RenameCollectionForm = ({ collection }: { collection: Collection }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm({
    defaultValues: { name: collection.name },
    progressive: true,
  });

  Dialog.useBusy(isSubmitting);

  const { mutateAsync: renameCollection } = useMutation(renameCollectionOptions);

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      await renameCollection({ id: collection.id, name });
      renameCollectionDialog.close();
    } catch (error) {
      setError("name", { type: "server", message: formatError(error) });
    }
  };

  return (
    <form className="contents" onSubmit={handleSubmit(onSubmit)}>
      <Dialog.Header>
        <Dialog.Title>Rename collection</Dialog.Title>
      </Dialog.Header>

      <Field.Group>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Input
            {...register("name", { required: true })}
            aria-invalid={errors.name?.type === "server"}
            type="text"
            placeholder="Collection name"
            autoComplete="off"
          />
          {errors.name?.type === "server" && <Field.Error match>{errors.name.message}</Field.Error>}
        </Field.Root>
      </Field.Group>

      <Dialog.Footer>
        <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
        <Button type="submit" disabled={!isValid || !isDirty} pending={isSubmitting}>
          Rename
        </Button>
      </Dialog.Footer>
    </form>
  );
};
