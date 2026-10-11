import { type RefObject, useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import type { File } from "@takobox/sdk";
import { deleteFileOptions } from "@/queries/files";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";

interface DeleteFilePayload {
  file: File;
  returnFocus: RefObject<HTMLElement | null>;
  onDeleted: (fileId: string) => void;
}

export const deleteFileDialog = Dialog.createHandle<DeleteFilePayload>();

export const DeleteFileDialog = () => (
  <Dialog.Root handle={deleteFileDialog}>
    {({ payload }) =>
      payload && (
        <Dialog.Content finalFocus={payload.returnFocus}>
          <DeleteFileConfirmation file={payload.file} onDeleted={payload.onDeleted} />
        </Dialog.Content>
      )
    }
  </Dialog.Root>
);

const DeleteFileConfirmation = ({
  file,
  onDeleted,
}: Pick<DeleteFilePayload, "file" | "onDeleted">) => {
  const deleteFile = useMutation(deleteFileOptions);
  const [isDeleting, startDeleting] = useTransition();

  Dialog.useBusy(isDeleting);

  const handleDelete = async () => {
    try {
      await deleteFile.mutateAsync(file.id);
    } catch {
      // mutation owns error handling
      return;
    }

    onDeleted(file.id);
    deleteFileDialog.close();
  };

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Delete file?</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to delete the file "{file.name}"? This cannot be undone.
        </Dialog.Description>
      </Dialog.Header>

      {deleteFile.isError && (
        <p role="alert" className="text-sm text-destructive">
          {formatError(deleteFile.error)}
        </p>
      )}

      <Dialog.Footer>
        <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
        <Button
          variant="destructive"
          onClick={() => startDeleting(handleDelete)}
          pending={isDeleting}
        >
          Delete File
        </Button>
      </Dialog.Footer>
    </>
  );
};
