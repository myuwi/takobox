import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useMutation, useMutationState, useQuery } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import {
  Check,
  Download,
  EllipsisVertical,
  File,
  LinkIcon,
  RefreshCcw,
  Tag,
  Trash,
} from "lucide-react";
import { regenerateThumbnail } from "@/api/files";
import { selectedFilesAtom } from "@/atoms/selected-files";
import { thumbnailExtensions } from "@/constants/extensions";
import {
  addFileToCollectionOptions,
  collectionsOptions,
  removeFileFromCollectionOptions,
} from "@/queries/collections";
import { deleteFileOptions, fileOptions } from "@/queries/files";
import type { FileDto } from "@/types/FileDto";
import { copyToClipboard } from "@/utils/clipboard";
import { stopPropagation } from "@/utils/event";
import { formatBytes } from "@/utils/files";
import { Button } from "./primitives/Button";
import * as Menu from "./primitives/Menu";

interface FileContextMenuProps {
  file: FileDto;
  onOpen: () => void;
}

const getThumbnailPath = (fileName: string) => {
  const supportsThumbnail = thumbnailExtensions.some((ext) =>
    fileName.endsWith(`.${ext}`),
  );

  if (!supportsThumbnail) return undefined;

  return `/thumbs/${fileName.replace(/\.\w*$/, ".avif")}`;
};

const FileContextMenu = ({ file, onOpen }: FileContextMenuProps) => {
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

interface SelectedFilesIndicatorProps {
  files: FileDto[];
}

const SelectedFilesIndicator = ({ files }: SelectedFilesIndicatorProps) => {
  if (!files[0]) return null;

  const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
  const identifier =
    files.length > 1 ? `${files.length} files` : `"${files[0].original}"`;

  const text = `${identifier} selected (${formatBytes(totalBytes)})`;

  return (
    <div className="absolute right-1 bottom-1 rounded-md bg-accent px-2 py-1">
      {text}
    </div>
  );
};

interface FileThumbnailProps {
  file: FileDto;
}

const FileThumbnail = ({ file }: FileThumbnailProps) => {
  const src = getThumbnailPath(file.name);
  const [loaded, setLoaded] = useState(!!src);

  const imgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const img = imgRef.current;

    if (src && img?.complete) {
      const loaded = img.naturalWidth > 0;
      setLoaded(loaded);
    }
  }, [src]);

  return (
    <div className="group flex aspect-4/3 w-full items-center justify-center overflow-hidden px-4 py-1">
      <File style={{ display: loaded ? "none" : undefined }} />
      <img
        alt=""
        ref={imgRef}
        src={src}
        className="pointer-events-none max-h-full max-w-full rounded-sm object-contain"
        style={{ display: loaded ? undefined : "none" }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </div>
  );
};

interface FileGridProps {
  files: FileDto[];
}

export const FileGrid = ({ files }: FileGridProps) => {
  const [selectedFiles, setSelectedFiles] = useAtom(selectedFilesAtom);

  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.shiftKey) {
      setSelectedFiles([]);
    }
  };

  return (
    <div className="relative h-full w-full" onClick={handleGridClick}>
      <div
        className="group/grid grid h-full w-full grid-cols-[repeat(auto-fill,10rem)] content-start justify-around gap-2 overflow-auto p-2"
        data-selecting={selectedFiles.length > 0}
      >
        {files.map((file) => {
          const selected = selectedFiles.includes(file);

          const handleOpen = () => window.open(`/${file.name}`);

          const handleSelect = (ctrlKey: boolean) => {
            if (ctrlKey) {
              if (selected) {
                setSelectedFiles(selectedFiles.filter((f) => f !== file));
              } else {
                setSelectedFiles([...selectedFiles, file]);
              }
            } else {
              setSelectedFiles([file]);
            }
          };

          const handleClick = (e: MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            handleSelect(e.ctrlKey);
          };

          const handleDoubleClick = () => handleOpen();

          const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
            e.stopPropagation();
            switch (e.key) {
              case " ":
                handleSelect(e.ctrlKey);
                break;
              case "Enter":
                handleOpen();
                break;
              case "Escape":
                setSelectedFiles([]);
                break;
            }
          };

          const handleCheckboxClick = (e: MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation();
            handleSelect(true);
          };

          const handleMenuOpen = () => setSelectedFiles([file]);

          return (
            <div
              key={file.id}
              className="group flex h-min w-40 cursor-pointer flex-col items-center rounded-md p-2 select-none hover:bg-accent/50 aria-selected:bg-accent"
              role="gridcell"
              tabIndex={0}
              aria-selected={selected}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              onKeyDown={handleKeyDown}
            >
              <div className="relative w-full">
                <FileThumbnail file={file} />
                <span
                  className="invisible absolute top-0.5 left-0.5 rounded-sm bg-accent p-0.5 inset-ring inset-ring-primary-foreground group-hover:visible group-aria-selected:visible group-aria-selected:bg-primary-foreground group-aria-selected:text-white group-data-[selecting=true]/grid:visible"
                  onClick={handleCheckboxClick}
                  onDoubleClick={stopPropagation}
                >
                  <Check className="size-4 group-not-aria-selected:invisible" />
                </span>
                <FileContextMenu file={file} onOpen={handleMenuOpen} />
              </div>
              <span
                className="line-clamp-1 px-1 text-center break-all"
                title={file.original}
              >
                {file.original}
              </span>
            </div>
          );
        })}
      </div>
      <SelectedFilesIndicator files={selectedFiles} />
    </div>
  );
};
