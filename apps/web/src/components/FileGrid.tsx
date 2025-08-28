import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PropsWithChildren,
  type SyntheticEvent,
} from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  Check,
  Download,
  Ellipsis,
  File,
  LinkIcon,
  RefreshCcw,
  Trash,
} from "lucide-react";
import { regenerateThumbnail } from "@/api/files";
import { selectedFilesAtom } from "@/atoms/selected-files";
import { thumbnailExtensions } from "@/constants/extensions";
import { useDeleteFileMutation } from "@/queries/files";
import type { FileDto } from "@/types/FileDto";
import { copyToClipboard } from "@/utils/clipboard";
import { formatBytes } from "@/utils/files";
import { Button } from "./primitives/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./primitives/DropdownMenu";

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation();

interface ContextMenuDropdownProps extends PropsWithChildren {
  file: FileDto;
  onOpen: () => void;
}

const ContextMenuDropdown = ({
  children,
  file,
  onOpen,
}: ContextMenuDropdownProps) => {
  const setSelectedFiles = useSetAtom(selectedFilesAtom);
  const { mutateAsync: deleteFile } = useDeleteFileMutation();

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen();
    }
  };

  const downloadUrl = `/api/files/${file.id}/download`;

  const handleCopyToClipboard = async () => {
    try {
      const url = new URL(file.name, location.origin);
      await copyToClipboard(url.toString());
    } catch (err) {
      console.warn("Failed to copy link to clipboard", err);
    }
  };

  const handleRegenerateThumbnail = async () => {
    const src = `/thumbs/${file.name.replace(/\.\w*$/, ".webp")}`;
    await regenerateThumbnail(file.id);
    await fetch(src, { cache: "reload" });
    document.body
      .querySelectorAll<HTMLImageElement>(`img[src="${src}"]`)
      .forEach((img) => {
        img.src = src;
      });
  };

  const handleDelete = async () => {
    await deleteFile(file.id);
    setSelectedFiles((selectedFiles) =>
      selectedFiles.filter((f) => f !== file),
    );
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href={downloadUrl}>
              <Download />
              <span>Download</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyToClipboard}>
            <LinkIcon />
            <span>Copy link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRegenerateThumbnail}>
            <RefreshCcw />
            <span>Regenerate thumbnail</span>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            <Trash />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const src = `/thumbs/${file.name.replace(/\.\w*$/, ".webp")}`;
  const canHaveThumbnail = thumbnailExtensions.some((ext) =>
    file.name.endsWith(`.${ext}`),
  );

  const [loaded, setLoaded] = useState(canHaveThumbnail);

  const imgRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const img = imgRef.current;

    if (canHaveThumbnail && img?.complete) {
      const loaded = img.naturalWidth > 0;
      setLoaded(loaded);
    }
  }, [canHaveThumbnail]);

  return (
    <div className="group flex aspect-4/3 w-full items-center justify-center overflow-hidden p-2">
      <File style={{ display: loaded ? "none" : undefined }} />
      <img
        alt=""
        ref={imgRef}
        src={canHaveThumbnail ? src : undefined}
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

  // Clean up selected files when file grid unmounts
  useEffect(() => {
    return () => setSelectedFiles([]);
  }, [setSelectedFiles]);

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
                  className="invisible absolute top-0 left-0 rounded-sm bg-accent p-0.5 inset-ring inset-ring-primary-foreground group-hover:visible group-aria-selected:visible group-aria-selected:bg-primary-foreground group-aria-selected:text-white group-data-[selecting=true]/grid:visible"
                  onClick={handleCheckboxClick}
                  onDoubleClick={stopPropagation}
                >
                  <Check className="size-4 group-not-aria-selected:invisible" />
                </span>
                <ContextMenuDropdown file={file} onOpen={handleMenuOpen}>
                  <Button
                    variant="accent"
                    size="icon-sm"
                    className="invisible absolute right-0 bottom-0 group-hover:visible group-aria-selected:visible"
                    onClick={stopPropagation}
                    onDoubleClick={stopPropagation}
                  >
                    <Ellipsis />
                  </Button>
                </ContextMenuDropdown>
              </div>
              <span className="line-clamp-1 px-2 text-center break-all">
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
