import { useState } from "react";
import { useMutation, useMutationState, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import {
  Download,
  EllipsisVertical,
  LinkIcon,
  RefreshCcw,
  Tag,
  Trash,
} from "lucide-react";
import { regenerateThumbnail } from "@/api/files";
import { selectedFilesAtom } from "@/atoms/selected-files";
import {
  addFileToCollectionOptions,
  collectionsOptions,
  removeFileFromCollectionOptions,
} from "@/queries/collections";
import { deleteFileOptions, fileOptions } from "@/queries/files";
import type { FileDto } from "@/types/FileDto";
import { copyToClipboard } from "@/utils/clipboard";
import { stopPropagation } from "@/utils/event";
import { getThumbnailPath } from "@/utils/files";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";

interface FileContextMenuProps {
  file: FileDto;
  onOpen: () => void;
}

export const FileContextMenu = ({ file, onOpen }: FileContextMenuProps) => {
  const [open, setOpen] = useState(false);
  const { data: collections } = useQuery(collectionsOptions);
  const setSelectedFiles = useSetAtom(selectedFilesAtom);
  const { mutateAsync: deleteFile } = useMutation(deleteFileOptions);

  const { data: fileCollections = [] } = useQuery({
    ...fileOptions(file.id),
    select: (file) => file.collections,
    enabled: open,
  });

  const { mutateAsync: addToCollection } = useMutation(
    addFileToCollectionOptions,
  );
  const { mutateAsync: removeFromCollection } = useMutation(
    removeFileFromCollectionOptions,
  );

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

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen();
    }
    setOpen(open);
  };

  const downloadUrl = `/api/files/${file.id}/download`;
  const thumbnailPath = getThumbnailPath(file.name);

  const handleCopyToClipboard = async () => {
    try {
      const url = new URL(file.name, location.origin);
      await copyToClipboard(url.toString());
    } catch (err) {
      console.warn("Failed to copy link to clipboard", err);
    }
  };

  const handleRegenerateThumbnail = async () => {
    if (!thumbnailPath) return;
    await regenerateThumbnail(file.id);
    await fetch(thumbnailPath, { cache: "reload" });
    document.body
      .querySelectorAll<HTMLImageElement>(`img[src="${thumbnailPath}"]`)
      .forEach((img) => {
        img.src = thumbnailPath;
      });
  };

  const handleDelete = async () => {
    await deleteFile(file.id);
    setSelectedFiles((selectedFiles) =>
      selectedFiles.filter((f) => f !== file),
    );
  };

  return (
    <Menu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <Menu.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="invisible absolute right-0 bottom-0 group-hover:visible group-aria-selected:visible hover:bg-muted data-popup-open:bg-muted"
            onClick={stopPropagation}
            onDoubleClick={stopPropagation}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        }
      />
      <Menu.Content align="end">
        <Menu.Group>
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
              <Tag />
              <span>Add to Collection</span>
            </Menu.SubTrigger>
            <Menu.SubContent>
              <Menu.Group>
                <Menu.GroupLabel>Collections</Menu.GroupLabel>
                {collections?.map((collection) => {
                  const pending = pendingMutations.some(
                    (m) => m.fileId === file.id && m.id === collection.id,
                  );
                  const checked = fileCollections.some(
                    (c) => c.id === collection.id,
                  );

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
            onClick={handleRegenerateThumbnail}
            disabled={!thumbnailPath}
          >
            <RefreshCcw />
            <span>Regenerate thumbnail</span>
          </Menu.Item>
          <Menu.Item variant="destructive" onClick={handleDelete}>
            <Trash />
            <span>Delete</span>
          </Menu.Item>
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  );
};
