import { atom, useAtomValue } from "jotai";
import { useDropzone } from "react-dropzone";
import { useUploads } from "./useUploads";

const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files") ?? false;

const windowFileDragAtom = atom(false);

windowFileDragAtom.onMount = (set) => {
  let dragDepth = 0;
  set(false);

  const onDragEnter = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth++;
    set(true);
  };

  const onDragLeave = (e: DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(dragDepth - 1, 0);
    if (dragDepth === 0) set(false);
  };

  const onDrop = () => {
    dragDepth = 0;
    set(false);
  };

  window.addEventListener("dragenter", onDragEnter, true);
  window.addEventListener("dragleave", onDragLeave, true);
  window.addEventListener("drop", onDrop, true);

  return () => {
    window.removeEventListener("dragenter", onDragEnter, true);
    window.removeEventListener("dragleave", onDragLeave, true);
    window.removeEventListener("drop", onDrop, true);
  };
};

type DropState = "available" | "over";

export const useUploadDropzone = (collectionId?: string) => {
  const { uploadFiles } = useUploads();
  const isWindowDragActive = useAtomValue(windowFileDragAtom);

  const dropzone = useDropzone({
    onDrop: (files) => uploadFiles(files, { collectionId }),
    noClick: true,
    noKeyboard: true,
  });

  const dropState: DropState | undefined = dropzone.isDragActive
    ? "over"
    : isWindowDragActive
      ? "available"
      : undefined;

  const { role: _role, ...rootProps } = dropzone.getRootProps();

  return {
    ...dropzone,
    dropTargetProps: { ...rootProps, "data-drop-state": dropState },
  };
};
