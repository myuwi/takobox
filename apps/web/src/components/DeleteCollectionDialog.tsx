import { type RefObject, useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Collection } from "@takobox/sdk";
import { deleteCollectionOptions } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";

interface DeleteCollectionPayload {
  collection: Collection;
  returnFocus: RefObject<HTMLElement | null>;
}

export const deleteCollectionDialog = Dialog.createHandle<DeleteCollectionPayload>();

export const DeleteCollectionDialog = () => (
  <Dialog.Root handle={deleteCollectionDialog}>
    {({ payload }) =>
      payload && (
        <Dialog.Content finalFocus={payload.returnFocus}>
          <DeleteCollectionConfirmation collection={payload.collection} />
        </Dialog.Content>
      )
    }
  </Dialog.Root>
);

const DeleteCollectionConfirmation = ({ collection }: { collection: Collection }) => {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const deleteCollection = useMutation(deleteCollectionOptions);
  const [isDeleting, startDeleting] = useTransition();

  Dialog.useBusy(isDeleting);

  const handleDelete = async () => {
    try {
      await deleteCollection.mutateAsync(collection.id);
    } catch {
      // mutation owns error handling
      return;
    }

    deleteCollectionDialog.close();

    if (search.collection === collection.id) {
      await navigate({
        to: ".",
        search: (prev) => ({ ...prev, collection: undefined }),
      });
    }
  };

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Delete collection?</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to delete the collection "{collection.name}"? Files inside the
          collection will remain unaffected. This cannot be undone.
        </Dialog.Description>
      </Dialog.Header>

      {deleteCollection.isError && (
        <p role="alert" className="text-sm text-destructive">
          {formatError(deleteCollection.error)}
        </p>
      )}

      <Dialog.Footer>
        <Dialog.Close render={<Button variant="outline" />}>Cancel</Dialog.Close>
        <Button
          variant="destructive"
          onClick={() => startDeleting(handleDelete)}
          pending={isDeleting}
        >
          Delete Collection
        </Button>
      </Dialog.Footer>
    </>
  );
};
