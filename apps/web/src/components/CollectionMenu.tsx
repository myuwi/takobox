import { useRef } from "react";
import { MoreHorizontal, PencilLine, Trash } from "lucide-react";
import type { Collection } from "@takobox/sdk";
import { deleteCollectionDialog } from "./DeleteCollectionDialog";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";
import { renameCollectionDialog } from "./RenameCollectionDialog";

interface CollectionMenuProps {
  collection: Collection;
}

export const CollectionMenu = ({ collection }: CollectionMenuProps) => {
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted data-popup-open:bg-muted data-popup-open:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="glyph-sm" />
            <span className="sr-only">Actions for {collection.name}</span>
          </Button>
        }
        ref={menuTriggerRef}
      />
      {/* FIXME: Even with finalFocus set to false, the Menu.Popup element is focused on close for some reason */}
      <Menu.Content className="w-48" align="start" finalFocus={false}>
        <Menu.Item
          onClick={() =>
            renameCollectionDialog.openWithPayload({ collection, returnFocus: menuTriggerRef })
          }
        >
          <PencilLine />
          <span>Rename</span>
        </Menu.Item>
        <Menu.Item
          variant="destructive"
          onClick={() =>
            deleteCollectionDialog.openWithPayload({ collection, returnFocus: menuTriggerRef })
          }
        >
          <Trash />
          <span>Delete</span>
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
};
