import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { deleteCollectionOptions } from "@/queries/collections";
import type { CollectionDto } from "@/types/CollectionDto";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";

interface DeleteCollectionDialogProps {
  collection: CollectionDto;
  open: boolean;
  setOpen: (open: boolean) => void;
  focusRef: React.RefObject<HTMLElement | null>;
}

export const DeleteCollectionDialog = ({
  collection,
  open,
  setOpen,
  focusRef,
}: DeleteCollectionDialogProps) => {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const { mutateAsync: deleteCollection } = useMutation(
    deleteCollectionOptions,
  );

  const handleDelete = async () => {
    try {
      await deleteCollection(collection.id);

      if (search.collection === collection.id) {
        await navigate({
          to: ".",
          search: (prev) => ({ ...prev, collection: undefined }),
        });
      }
    } catch (_) {}
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content finalFocus={focusRef}>
        <Dialog.Header>
          <Dialog.Title>Delete collection</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete the collection "{collection.name}
            "?
          </Dialog.Description>
        </Dialog.Header>

        <Dialog.Footer>
          <Dialog.Close render={<Button variant="outline" />}>
            Cancel
          </Dialog.Close>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};
