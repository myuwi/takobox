import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { atomWithReset, useResetAtom } from "jotai/utils";
import { useUploadFileMutation } from "@/queries/files";
import { settingsOptions } from "@/queries/settings";

export interface UploadProgress {
  id: string;
  file: File;
  url?: string;
  progress: number;
  abortController: AbortController;
}

export const uploadsAtom = atom<UploadProgress[]>([]);
export const fileRejectionsAtom = atomWithReset<File[]>([]);

export const useUploads = () => {
  const { data: settings } = useQuery(settingsOptions);
  const [uploads, setUploads] = useAtom(uploadsAtom);
  const [fileRejections, setFileRejections] = useAtom(fileRejectionsAtom);
  const resetFileRejections = useResetAtom(fileRejectionsAtom);

  const { mutateAsync: uploadFileMutation } = useUploadFileMutation();

  const handleUpload = async (file: File) => {
    const url = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    const abortController = new AbortController();

    setUploads((prevUploads) => {
      return [
        ...prevUploads,
        {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: file,
          url,
          progress: 0,
          abortController,
        },
      ];
    });

    await uploadFileMutation({
      file,
      signal: abortController.signal,
      onUploadProgress: ({ file, event }) => {
        const progress = event.progress ? Math.round(event.progress * 100) : 0;

        setUploads((prevUploads) => {
          return prevUploads?.map((f) =>
            f.file === file ? { ...f, progress: progress ?? 0 } : f,
          );
        });
      },
    });

    setUploads((prevUploads) => prevUploads.filter((f) => f.file !== file));

    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const rejectedFiles = files.filter(
      (file) => file.size > settings!.maxFileSize,
    );
    if (rejectedFiles.length > 0) {
      return setFileRejections(rejectedFiles);
    }
    resetFileRejections();

    // TODO: check quota before upload

    for (const file of files) {
      handleUpload(file);
    }
  };

  const abortUpload = (file: File) => {
    const upload = uploads.find((u) => u.file === file);

    if (upload && upload.progress < 100) {
      upload?.abortController.abort();
      // TODO: probably show aborted status on the UI instead
      setUploads((prevUploads) => prevUploads.filter((f) => f.file !== file));
    }
  };

  return {
    uploads,
    uploadFiles,
    fileRejections,
    resetFileRejections,
    abortUpload,
  };
};
