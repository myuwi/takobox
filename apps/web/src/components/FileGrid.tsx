import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { File } from "lucide-react";
import type { File as FileModel } from "@takobox/sdk";
import { cn } from "@/utils/cn";
import { stopPropagation } from "@/utils/event";
import { formatBytes, getThumbnailPath } from "@/utils/files";
import { FileContextMenu } from "./FileContextMenu";
import { Checkbox } from "./primitives/Checkbox";

const chunk = <T,>(items: T[], size: number): T[][] => {
  if (size < 1) return [items];

  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }

  return rows;
};

const useColumnCount = (ref: RefObject<HTMLElement | null>) => {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const template = getComputedStyle(element).gridTemplateColumns;
      setColumns(template === "none" ? 1 : template.split(" ").length);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return columns;
};

interface SelectedFilesIndicatorProps {
  className?: string;
  files: FileModel[];
}

const SelectedFilesIndicator = ({ className, files }: SelectedFilesIndicatorProps) => {
  if (!files[0]) return null;

  const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
  const identifier = files.length > 1 ? `${files.length} files` : `"${files[0].name}"`;

  const text = `${identifier} selected (${formatBytes(totalBytes)})`;

  return <div className={cn("rounded-md bg-accent px-2 py-1", className)}>{text}</div>;
};

interface FileThumbnailProps {
  file: FileModel;
}

const FileThumbnail = ({ file }: FileThumbnailProps) => {
  const src = getThumbnailPath(file.filename);
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
  files: FileModel[];
}

export const FileGrid = ({ files }: FileGridProps) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(() => files[0]?.id ?? null);
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<string, HTMLDivElement>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const activeFileIdRef = useRef(activeFileId);
  const anchorFileIdRef = useRef<string | null>(null);
  const focusedFileIdRef = useRef<string | null>(null);

  const columns = useColumnCount(gridRef);
  const rows = chunk(files, columns);
  const activeIndex = Math.max(
    files.findIndex((file) => file.id === activeFileId),
    0,
  );
  const selectedFileIdSet = new Set(selectedFileIds);
  const selectedFiles = files.filter((file) => selectedFileIdSet.has(file.id));

  useLayoutEffect(() => {
    if (gridRef.current?.contains(document.activeElement)) return;
    if (!focusedFileIdRef.current) return;

    const focusedCell = cellRefs.current.get(focusedFileIdRef.current);
    if (!focusedCell) {
      focusedFileIdRef.current = null;
      return;
    }

    focusedCell.focus();
  }, [columns, files]);

  const activateFile = (fileId: string | null) => {
    activeFileIdRef.current = fileId;
    setActiveFileId(fileId);
  };

  const openFile = (file: FileModel) => window.open(`/${file.filename}`);

  const selectSingle = (index: number) => {
    const file = files[index];
    if (!file) return;
    setSelectedFileIds([file.id]);
    anchorFileIdRef.current = file.id;
  };

  const toggle = (index: number) => {
    const file = files[index];
    if (!file) return;
    setSelectedFileIds((selectedFileIds) =>
      selectedFileIds.includes(file.id)
        ? selectedFileIds.filter((id) => id !== file.id)
        : [...selectedFileIds, file.id],
    );
    anchorFileIdRef.current = file.id;
  };

  const selectRange = (index: number) => {
    let anchorIndex = files.findIndex((file) => file.id === anchorFileIdRef.current);
    if (anchorIndex < 0) {
      anchorIndex = activeIndex;
      anchorFileIdRef.current = files[activeIndex]?.id ?? null;
    }

    const start = Math.min(anchorIndex, index);
    const end = Math.max(anchorIndex, index);
    setSelectedFileIds(files.slice(start, end + 1).map((file) => file.id));
  };

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      setSelectedFileIds([]);
    }
  };

  const handleCellClick = (e: MouseEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    activateFile(files[index]?.id ?? null);
    if (e.shiftKey) selectRange(index);
    else if (e.ctrlKey || e.metaKey) toggle(index);
    else selectSingle(index);
  };

  const handleMenuOpenChange = (index: number, open: boolean) => {
    const file = files[index];
    if (!file) return;

    if (open) {
      activateFile(file.id);
      selectSingle(index);
      setOpenMenuFileId(file.id);
    } else {
      setOpenMenuFileId((openFileId) => (openFileId === file.id ? null : openFileId));
    }
  };

  const handleFileDelete = (index: number) => {
    const file = files[index];
    if (!file) return;

    setSelectedFileIds((selectedFileIds) => selectedFileIds.filter((fileId) => fileId !== file.id));
    const nextFileId = files[index + 1]?.id ?? files[index - 1]?.id ?? null;
    activateFile(nextFileId);
    returnFocusRef.current =
      (nextFileId ? cellRefs.current.get(nextFileId) : undefined) ?? gridRef.current;
  };

  const handleKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!gridRef.current?.contains(e.target as Node)) return;

    const target = e.target as HTMLElement;
    const gridCell = target.closest<HTMLElement>("[role=gridcell]");
    if (!gridCell) return;

    const last = files.length - 1;
    if (last < 0) return;

    const isNestedControl = target !== gridCell;
    let next: number | null = null;

    switch (e.key) {
      case "ArrowRight":
        next = Math.min(activeIndex + 1, last);
        break;
      case "ArrowLeft":
        next = Math.max(activeIndex - 1, 0);
        break;
      case "ArrowDown":
        next = Math.min(activeIndex + columns, last);
        break;
      case "ArrowUp":
        next = Math.max(activeIndex - columns, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
    }

    if (next !== null) {
      e.preventDefault();
      if (isNestedControl) e.stopPropagation();

      const nextFileId = files[next]?.id;
      if (!nextFileId) return;

      activateFile(nextFileId);
      cellRefs.current.get(nextFileId)?.focus();
      if (e.shiftKey) selectRange(next);
      return;
    }

    if (isNestedControl) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) toggle(activeIndex);
        else selectSingle(activeIndex);
        return;
      case "Enter": {
        const file = files[activeIndex];
        if (file) openFile(file);
        return;
      }
      case "Escape":
        setSelectedFileIds([]);
        return;
      default:
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
          e.preventDefault();
          setSelectedFileIds(files.map((file) => file.id));
        }
        return;
    }
  };

  return (
    <div className="relative w-full grow" onClick={handleBackgroundClick} role="presentation">
      <div
        ref={gridRef}
        role="grid"
        tabIndex={-1}
        aria-multiselectable
        aria-label="Files"
        className="group/grid absolute inset-0 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] content-start justify-around gap-2 overflow-auto p-2"
        data-selecting={selectedFiles.length > 0}
        onKeyDownCapture={handleKeyDownCapture}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            focusedFileIdRef.current = null;
          }
        }}
      >
        {rows.map((row, r) => (
          <div role="row" className="contents" key={r}>
            {row.map((file, c) => {
              const index = r * columns + c;
              const selected = selectedFileIdSet.has(file.id);

              return (
                <div
                  key={file.id}
                  ref={(el) => {
                    if (el) {
                      cellRefs.current.set(file.id, el);
                    } else {
                      cellRefs.current.delete(file.id);
                    }
                  }}
                  className="group flex h-min cursor-pointer flex-col items-center rounded-md p-2 select-none hover:bg-accent/50 aria-selected:bg-accent"
                  role="gridcell"
                  tabIndex={index === activeIndex ? 0 : -1}
                  aria-label={file.name}
                  aria-selected={selected}
                  onFocus={() => {
                    focusedFileIdRef.current = file.id;
                    activateFile(file.id);
                  }}
                  onClick={(e) => handleCellClick(e, index)}
                  onDoubleClick={() => openFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const focusedElement = document.activeElement;
                    returnFocusRef.current =
                      focusedElement instanceof HTMLElement &&
                      e.currentTarget.contains(focusedElement)
                        ? focusedElement
                        : e.currentTarget;
                    handleMenuOpenChange(index, true);
                  }}
                >
                  <div className="relative w-full">
                    <FileThumbnail file={file} />
                    <span
                      role="presentation"
                      className="invisible absolute top-0.5 left-0.5 group-focus-within:visible group-hover:visible group-aria-selected:visible group-data-[selecting=true]/grid:visible"
                      onClick={stopPropagation}
                      onDoubleClick={stopPropagation}
                    >
                      <Checkbox
                        aria-label={`Select ${file.name}`}
                        tabIndex={index === activeIndex ? 0 : -1}
                        checked={selected}
                        onCheckedChange={() => toggle(index)}
                        className="cursor-pointer"
                      />
                    </span>
                    <FileContextMenu
                      file={file}
                      open={openMenuFileId === file.id}
                      onOpenChange={(open) => handleMenuOpenChange(index, open)}
                      returnFocusRef={returnFocusRef}
                      triggerTabIndex={index === activeIndex ? 0 : -1}
                      onDeleted={() => handleFileDelete(index)}
                    />
                  </div>
                  <span className="line-clamp-1 px-1 text-center break-all" title={file.name}>
                    {file.name}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <SelectedFilesIndicator className="absolute right-1 bottom-1" files={selectedFiles} />
    </div>
  );
};
