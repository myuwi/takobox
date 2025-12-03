import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { MoreHorizontal, Pen, Trash } from "lucide-react";
import { confirmationDialogAtom } from "@/atoms/dialogs";
import { deleteCollectionOptions } from "@/queries/collections";
import type { CollectionDto } from "@/types/CollectionDto";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";
import { RenameCollectionDialog } from "./RenameCollectionDialog";

interface CollectionMenuProps {
  collection: CollectionDto;
}

export const CollectionMenu = ({ collection }: CollectionMenuProps) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const confirm = useSetAtom(confirmationDialogAtom);

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

  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted data-popup-open:bg-muted data-popup-open:opacity-100"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="p-0.5" />
            </Button>
          }
          ref={menuTriggerRef}
        />
        {/* FIXME: Even with finalFocus set to false, the Menu.Popup element is focused on close for some reason */}
        <Menu.Content className="w-48" align="start" finalFocus={false}>
          <Menu.Item
            // Use a timeout to get around focus fuckery
            onClick={() => setTimeout(() => setRenameDialogOpen(true), 0)}
          >
            <Pen />
            <span>Rename collection</span>
          </Menu.Item>
          <Menu.Item
            variant="destructive"
            onClick={() =>
              setTimeout(() => {
                confirm({
                  title: "Delete collection?",
                  description: `Are you sure you want to delete the collection "${collection.name}"? Files inside the collection will remain unaffected. This cannot be undone.`,
                  confirmText: "Delete Collection",
                  callback: handleDelete,
                  focusRef: menuTriggerRef,
                });
              }, 0)
            }
          >
            <Trash />
            <span>Delete collection</span>
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <RenameCollectionDialog
        collection={collection}
        open={renameDialogOpen}
        setOpen={setRenameDialogOpen}
        focusRef={menuTriggerRef}
      />
    </>
  );
};
