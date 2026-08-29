import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { uploadFileOptions } from "@/queries/files";
import { settingsOptions } from "@/queries/settings";

export interface UploadProgress {
  id: string;
  file: File;
  url?: string;
  progress: number;
  abortController: AbortController;
}

export type UploadRejection = {
  reason: "file-too-large";
  files: File[];
  maxFileSize: number;
};

export interface UploadHandlers {
  onError?: (file: File, error: unknown) => void;
  onRejected?: (rejection: UploadRejection) => void;
}

export interface UploadOptions {
  collectionId?: string;
}

const uploadsAtom = atom<UploadProgress[]>([]);

const UploadHandlersContext = createContext<UploadHandlers | undefined>(undefined);

interface UploadsProviderProps extends UploadHandlers {
  children: ReactNode;
}

export function UploadsProvider({ onError, onRejected, children }: UploadsProviderProps) {
  const handlers = useMemo(() => ({ onError, onRejected }), [onError, onRejected]);

  return <UploadHandlersContext value={handlers}>{children}</UploadHandlersContext>;
}

const previewUrl = (file: File) => {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    return URL.createObjectURL(file);
  }
};

export const useUploads = () => {
  const handlers = useContext(UploadHandlersContext);
  if (!handlers) {
    throw new Error("useUploads must be used within an UploadsProvider");
  }

  const { data: settings } = useQuery(settingsOptions);
  const [uploads, setUploads] = useAtom(uploadsAtom);

  const { mutateAsync: uploadFileMutation } = useMutation(uploadFileOptions);

  const handleUpload = useCallback(
    async (upload: UploadProgress, collectionId?: string) => {
      try {
        await uploadFileMutation({
          file: upload.file,
          collectionId,
          signal: upload.abortController.signal,
          onUploadProgress: (event) => {
            const progress = Math.round((event.progress ?? 0) * 100);

            setUploads((prevUploads) => {
              return prevUploads.map((u) => (u.id === upload.id ? { ...u, progress } : u));
            });
          },
        });
      } catch (error) {
        if (!upload.abortController.signal.aborted) {
          handlers.onError?.(upload.file, error);
        }
      } finally {
        if (upload.url) {
          URL.revokeObjectURL(upload.url);
        }

        setUploads((prevUploads) => prevUploads.filter((u) => u.id !== upload.id));
      }
    },
    [uploadFileMutation, setUploads, handlers],
  );

  const uploadFiles = useCallback(
    (files: File[], { collectionId }: UploadOptions = {}) => {
      const maxFileSize = settings?.maxFileSize ?? Infinity;

      const rejectedFiles = files.filter((file) => file.size > maxFileSize);
      if (rejectedFiles.length > 0) {
        return handlers.onRejected?.({
          reason: "file-too-large",
          files: rejectedFiles,
          maxFileSize,
        });
      }

      // TODO: check quota before upload

      const newUploads = files.map<UploadProgress>((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        url: previewUrl(file),
        progress: 0,
        abortController: new AbortController(),
      }));

      setUploads((prevUploads) => [...prevUploads, ...newUploads]);

      for (const upload of newUploads) {
        void handleUpload(upload, collectionId);
      }
    },
    [handlers, settings, setUploads, handleUpload],
  );

  const abortUpload = useCallback(
    (id: string) => {
      const upload = uploads.find((u) => u.id === id);

      if (upload && upload.progress < 100) {
        upload.abortController.abort();
      }
    },
    [uploads],
  );

  return {
    uploads,
    uploadFiles,
    abortUpload,
  };
};
