import type { RefObject } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { File } from "@takobox/sdk";
import { renameFileOptions } from "@/queries/files";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Field from "./primitives/Field";
import { Input } from "./primitives/Input";

interface RenameFilePayload {
  file: File;
  returnFocus: RefObject<HTMLElement | null>;
}

export const renameFileDialog = Dialog.createHandle<RenameFilePayload>();

export const RenameFileDialog = () => (
  <Dialog.Root handle={renameFileDialog}>
    {({ payload }) =>
      payload && (
        <Dialog.Content finalFocus={payload.returnFocus}>
          <RenameFileForm file={payload.file} />
        </Dialog.Content>
      )
    }
  </Dialog.Root>
);

const RenameFileForm = ({ file }: { file: File }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm({
    defaultValues: { name: file.name },
    progressive: true,
  });

  Dialog.useBusy(isSubmitting);

  const { mutateAsync: renameFile } = useMutation(renameFileOptions);

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      await renameFile({ id: file.id, name });
      renameFileDialog.close();
    } catch (error) {
      setError("name", { type: "server", message: formatError(error) });
    }
  };

  return (
    <form className="contents" onSubmit={handleSubmit(onSubmit)}>
      <Dialog.Header>
        <Dialog.Title>Rename file</Dialog.Title>
      </Dialog.Header>

      <Field.Group>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Input
            {...register("name", { required: true })}
            aria-invalid={errors.name?.type === "server"}
            type="text"
            placeholder="File name"
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
