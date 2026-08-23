import { useRef, type RefObject } from "react";
import { useMutation, useMutationState, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import {
  Download,
  EllipsisVertical,
  FolderPlus,
  LinkIcon,
  PencilLine,
  RefreshCcw,
  Trash,
} from "lucide-react";
import type { File } from "@takobox/sdk";
import { client } from "@/api/client";
import { openConfirmationDialogAtom, openRenameDialogAtom } from "@/atoms/dialogs";
import {
  addFileToCollectionOptions,
  collectionsOptions,
  removeFileFromCollectionOptions,
} from "@/queries/collections";
import { deleteFileOptions, fileOptions, renameFileOptions } from "@/queries/files";
import { copyToClipboard } from "@/utils/clipboard";
import { stopPropagation } from "@/utils/event";
import { getThumbnailPath } from "@/utils/files";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";

interface FileContextMenuProps {
  file: File;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  triggerTabIndex: number;
  onDeleted: (fileId: string) => void;
}

export const FileContextMenu = ({
  file,
  open,
  onOpenChange,
  returnFocusRef,
  triggerTabIndex,
  onDeleted,
}: FileContextMenuProps) => {
  const { data: collections } = useQuery(collectionsOptions);
  const { mutateAsync: deleteFile } = useMutation(deleteFileOptions);

  const openConfirmDialog = useSetAtom(openConfirmationDialogAtom);
  const openRenameDialog = useSetAtom(openRenameDialogAtom);

  const { data: fileCollections = [] } = useQuery({
    ...fileOptions(file.id),
    select: (file) => file.collections,
    enabled: open,
  });

  const { mutateAsync: renameFile } = useMutation(renameFileOptions);

  const { mutateAsync: addToCollection } = useMutation(addFileToCollectionOptions);
  const { mutateAsync: removeFromCollection } = useMutation(removeFileFromCollectionOptions);

  const pendingMutations = useMutationState<{ id: string; fileId: string }>({
    filters: {
      predicate: (mutation) => {
        const status = mutation.state.status;
        const mutationKey = mutation.options.mutationKey;

        return (
          status === "pending" &&
          mutationKey?.[0] === "collections" &&
          mutationKey[1] === "files" &&
          (mutationKey[2] === "add" || mutationKey[2] === "remove")
        );
      },
    },
    select: (data) => data.state.variables as any,
  });

  const openingDialogRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const downloadUrl = `/api/files/${file.id}/download`;
  const thumbnailPath = getThumbnailPath(file.filename);

  const handleCopyToClipboard = async () => {
    try {
      const url = new URL(file.filename, location.origin);
      await copyToClipboard(url.toString());
    } catch (err) {
      console.warn("Failed to copy link to clipboard", err);
    }
  };

  const handleRegenerateThumbnail = async () => {
    if (!thumbnailPath) return;
    await client.files.regenerateThumbnail({ path: { id: file.id } });
    await fetch(thumbnailPath, { cache: "reload" });
    document.body
      .querySelectorAll<HTMLImageElement>(`img[src="${thumbnailPath}"]`)
      .forEach((img) => {
        img.src = thumbnailPath;
      });
  };

  const handleRename = async (name: string) => {
    await renameFile({ id: file.id, name });
  };

  const handleDelete = async () => {
    await deleteFile(file.id);
    onDeleted(file.id);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) returnFocusRef.current = triggerRef.current;
    onOpenChange(open);
  };

  return (
    <Menu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <Menu.Trigger
        render={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            tabIndex={triggerTabIndex}
            className="invisible absolute right-0 bottom-0 group-focus-within:visible group-hover:visible group-aria-selected:visible hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:visible data-popup-open:bg-muted"
            onClick={stopPropagation}
            onDoubleClick={stopPropagation}
          >
            <EllipsisVertical className="size-4" />
            <span className="sr-only">Actions for {file.name}</span>
          </Button>
        }
      />
      <Menu.Content
        align="start"
        finalFocus={() => {
          if (openingDialogRef.current) {
            openingDialogRef.current = false;
            return false;
          }
          return returnFocusRef.current ?? true;
        }}
      >
        <Menu.Group>
          {/* oxlint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- Base UI renders the "Download" children inside the anchor. */}
          <Menu.Item render={<a href={downloadUrl} />}>
            <Download />
            <span>Download</span>
          </Menu.Item>
          <Menu.Item onClick={handleCopyToClipboard}>
            <LinkIcon />
            <span>Copy link</span>
          </Menu.Item>
          <Menu.Sub>
            <Menu.SubTrigger>
              <FolderPlus />
              <span>Add to Collection</span>
            </Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Group>
                <Menu.GroupLabel>Collections</Menu.GroupLabel>
                {collections?.map((collection) => {
                  const pending = pendingMutations.some(
                    (m) => m.fileId === file.id && m.id === collection.id,
                  );
                  const checked = fileCollections.some((c) => c.id === collection.id);

                  const handleCheckedChange = async (checked: boolean) => {
                    if (pending) return;

                    if (checked) {
                      await addToCollection({
                        id: collection.id,
                        fileId: file.id,
                      });
                    } else {
                      await removeFromCollection({
                        id: collection.id,
                        fileId: file.id,
                      });
                    }
                  };

                  return (
                    <Menu.CheckboxItem
                      key={collection.id}
                      checked={checked}
                      onCheckedChange={handleCheckedChange}
                      disabled={pending}
                    >
                      {collection.name}
                    </Menu.CheckboxItem>
                  );
                })}
              </Menu.Group>
            </Menu.SubContent>
          </Menu.Sub>
          <Menu.Item
            onClick={() => {
              openingDialogRef.current = true;
              openRenameDialog({
                title: "Rename file",
                placeholder: "File name",
                initialValue: file.name,
                callback: handleRename,
                focusRef: returnFocusRef,
              });
            }}
          >
            <PencilLine />
            <span>Rename</span>
          </Menu.Item>
          <Menu.Item onClick={handleRegenerateThumbnail} disabled={!thumbnailPath}>
            <RefreshCcw />
            <span>Regenerate thumbnail</span>
          </Menu.Item>
          <Menu.Item
            variant="destructive"
            onClick={() => {
              openingDialogRef.current = true;
              openConfirmDialog({
                title: "Delete file?",
                description: `Are you sure you want to delete the file "${file.name}"? This cannot be undone.`,
                confirmText: "Delete File",
                callback: handleDelete,
                focusRef: returnFocusRef,
              });
            }}
          >
            <Trash />
            <span>Delete</span>
          </Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  );
};
