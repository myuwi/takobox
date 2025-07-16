import {
  useEffect,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PropsWithChildren,
  type SyntheticEvent,
} from "react";
import { Check, Ellipsis, File, Trash } from "lucide-react";
import { useDeleteFileMutation } from "@/queries/files";
import type { FileDto } from "@/types/FileDto";
import { formatBytes } from "@/utils/files";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation();

interface ContextMenuDropdownProps extends PropsWithChildren {
  file: FileDto;
  onOpenChange: (open: boolean) => void;
}

const ContextMenuDropdown = ({
  children,
  file,
  onOpenChange,
}: ContextMenuDropdownProps) => {
  const { mutateAsync: deleteFile } = useDeleteFileMutation();

  const handleDelete = () => deleteFile(file.id);

  return (
    <DropdownMenu onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        align="end"
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem danger onClick={handleDelete}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => setLoading(false);
    img.onerror = () => setError(true);
  }, [src]);

  return loading || error ? (
    <File className="absolute" />
  ) : (
    <img
      alt=""
      src={src}
      className="absolute h-full w-full rounded-md object-cover"
    />
  );
};

interface FileGridProps {
  files: FileDto[];
}

export const FileGrid = ({ files }: FileGridProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileDto[]>([]);

  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.shiftKey) {
      setSelectedFiles([]);
    }
  };

  return (
    <div
      className="group/grid relative grid h-full w-full grid-cols-[repeat(auto-fill,10rem)] content-start gap-4"
      onClick={handleGridClick}
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

        const handleMenuOpenChange = (open: boolean) => {
          if (open) {
            setSelectedFiles([file]);
          }
        };

        return (
          <div
            key={file.id}
            className="group flex h-min w-40 flex-col items-center gap-1 select-none"
            role="gridcell"
            tabIndex={0}
            aria-selected={selected}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
          >
            <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center overflow-hidden rounded-md bg-accent/50 p-2 group-hover:bg-accent group-aria-selected:bg-accent">
              <FileThumbnail file={file} />
              <span
                className="invisible absolute top-2 left-2 rounded-sm bg-accent p-0.5 inset-ring inset-ring-primary-foreground group-hover:visible group-aria-selected:visible group-aria-selected:bg-primary-foreground group-aria-selected:text-white group-data-[selecting=true]/grid:visible"
                onClick={handleCheckboxClick}
                onDoubleClick={stopPropagation}
              >
                <Check
                  size={16}
                  className="group-not-aria-selected:invisible"
                />
              </span>
              <ContextMenuDropdown
                file={file}
                onOpenChange={handleMenuOpenChange}
              >
                <Button
                  variant="accent"
                  size="icon"
                  className="invisible absolute right-1 bottom-1 size-6 p-1 group-hover:visible group-aria-selected:visible"
                  onClick={stopPropagation}
                  onDoubleClick={stopPropagation}
                >
                  <Ellipsis size={16} />
                </Button>
              </ContextMenuDropdown>
            </div>
            <span className="w-full px-2 text-center break-all">
              {file.original}
            </span>
          </div>
        );
      })}
      <SelectedFilesIndicator files={selectedFiles} />
    </div>
  );
};
