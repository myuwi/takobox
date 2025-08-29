import { useState } from "react";
import { Trash } from "lucide-react";
import { useDeleteCollectionMutation } from "@/queries/collections";
import type { CollectionDto } from "@/types/CollectionDto";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import * as Menu from "./primitives/Menu";

interface DeleteCollectionDialogProps {
  collection: CollectionDto;
  trigger: React.ComponentProps<typeof Menu.Trigger>["render"];
}

export const CollectionMenu = ({
  collection,
  trigger,
}: DeleteCollectionDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutateAsync: deleteCollection } = useDeleteCollectionMutation();

  const handleDelete = async () => {
    try {
      await deleteCollection(collection.id);
    } catch (_) {}
  };

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger render={trigger} />
        <Menu.Content className="w-48" align="start">
          <Menu.Item variant="destructive" onClick={() => setDialogOpen(true)}>
            <Trash />
            <span>Delete collection</span>
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content>
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
    </>
  );
};
