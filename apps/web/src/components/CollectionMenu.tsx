import { useRef, useState } from "react";
import { MoreHorizontal, Pen, Trash } from "lucide-react";
import type { CollectionDto } from "@/types/CollectionDto";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";
import { RenameCollectionDialog } from "./RenameCollectionDialog";

interface CollectionMenuProps {
  collection: CollectionDto;
}

export const CollectionMenu = ({ collection }: CollectionMenuProps) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="invisible ml-auto group-hover:visible hover:bg-muted data-popup-open:visible data-popup-open:bg-muted"
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="p-0.5" />
            </Button>
          }
          ref={menuTriggerRef}
        />
        {/* FIXME: Fix focus issue when new version of base-ui is out */}
        <Menu.Content className="w-48" align="start">
          <Menu.Item onClick={() => setRenameDialogOpen(true)}>
            <Pen />
            <span>Rename collection</span>
          </Menu.Item>
          <Menu.Item
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
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

      <DeleteCollectionDialog
        collection={collection}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        focusRef={menuTriggerRef}
      />
    </>
  );
};
