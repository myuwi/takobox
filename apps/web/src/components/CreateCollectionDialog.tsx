import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { createCollectionOptions } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Field from "./primitives/Field";
import { Input } from "./primitives/Input";

export const createCollectionDialog = Dialog.createHandle();

export const CreateCollectionDialog = () => (
  <Dialog.Root handle={createCollectionDialog}>
    <Dialog.Content>
      <CreateCollectionForm />
    </Dialog.Content>
  </Dialog.Root>
);

const CreateCollectionForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<{ name: string }>();

  Dialog.useBusy(isSubmitting);

  const { mutateAsync: createCollection } = useMutation(createCollectionOptions);

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      await createCollection(name);
      createCollectionDialog.close();
    } catch (error) {
      setError("name", { type: "server", message: formatError(error) });
    }
  };

  return (
    <form className="contents" onSubmit={handleSubmit(onSubmit)}>
      <Dialog.Header>
        <Dialog.Title>Create new collection</Dialog.Title>
      </Dialog.Header>

      <Field.Group>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Input
            {...register("name")}
            aria-invalid={errors.name?.type === "server"}
            required
            type="text"
            placeholder="Collection name"
            autoComplete="off"
          />
          {errors.name?.type === "server" && <Field.Error match>{errors.name.message}</Field.Error>}
        </Field.Root>
      </Field.Group>

      <Dialog.Footer>
        <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
        <Button type="submit" disabled={!isValid} pending={isSubmitting}>
          Create
        </Button>
      </Dialog.Footer>
    </form>
  );
};
