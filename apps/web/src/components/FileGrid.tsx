import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useAtom } from "jotai";
import { Check, File } from "lucide-react";
import { selectedFilesAtom } from "@/atoms/selected-files";
import type { FileDto } from "@/types/FileDto";
import { stopPropagation } from "@/utils/event";
import { formatBytes, getThumbnailPath } from "@/utils/files";
import { FileContextMenu } from "./FileContextMenu";

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
