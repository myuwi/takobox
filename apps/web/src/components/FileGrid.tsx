import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { File } from "lucide-react";
import type { FileDto } from "@/types/FileDto";
import { formatBytes } from "@/utils/files";

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
    <div className="absolute right-1 bottom-1 rounded-md border border-border bg-accent px-2 py-1">
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
      className="relative grid w-full grid-flow-row grid-cols-[repeat(auto-fill,8rem)] justify-around gap-2"
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

        return (
          <div
            key={file.id}
            className="flex h-min w-32 flex-col items-center gap-2 rounded-md p-2 select-none not-aria-selected:hover:bg-accent/50 aria-selected:bg-accent aria-selected:inset-ring aria-selected:inset-ring-border"
            role="gridcell"
            tabIndex={0}
            aria-selected={selected}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
          >
            <div className="flex aspect-[4/3] w-full place-content-center">
              <File />
            </div>
            <span className="text-center wrap-anywhere">{file.original}</span>
          </div>
        );
      })}
      <SelectedFilesIndicator files={selectedFiles} />
    </div>
  );
};
