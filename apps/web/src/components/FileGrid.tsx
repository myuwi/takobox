import {
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PropsWithChildren,
  type SyntheticEvent,
} from "react";
import { Ellipsis, File, Trash } from "lucide-react";
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
      className="relative grid w-full grid-flow-row grid-cols-[repeat(auto-fill,10rem)] gap-4"
      onClick={handleGridClick}
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
            <div className="relative flex aspect-4/3 w-full flex-col items-center justify-center rounded-md p-2 group-not-aria-selected:group-hover:bg-accent/50 group-aria-selected:bg-accent">
              <File />
              <ContextMenuDropdown
                file={file}
                onOpenChange={handleMenuOpenChange}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="invisible absolute right-1 bottom-1 size-8 p-1 group-hover:visible group-aria-selected:visible"
                  onClick={stopPropagation}
                  onDoubleClick={stopPropagation}
                >
                  <Ellipsis size={16} />
                </Button>
              </ContextMenuDropdown>
            </div>
            <span className="w-full px-2 break-all">{file.original}</span>
          </div>
        );
      })}
      <SelectedFilesIndicator files={selectedFiles} />
    </div>
  );
};
