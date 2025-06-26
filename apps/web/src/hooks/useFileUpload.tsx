import { useState } from "react";
import { useUploadFileMutation } from "@/queries/files";

interface UploadProgress {
  id: string;
  file: File;
  url?: string;
  progress: number;
  abortController: AbortController;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const { mutateAsync: uploadFileMutation } = useUploadFileMutation({
    onUploadProgress: ({ file, event }) => {
      const progress = event.progress ? Math.round(event.progress * 100) : 0;

      setUploads((prevUploads) => {
        return prevUploads?.map((f) =>
          f.file === file ? { ...f, progress: progress ?? 0 } : f,
        );
      });
    },
  });

  const uploadFile = async (file: File) => {
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

    await uploadFileMutation({ file, signal: abortController.signal });

    setUploads((prevUploads) => prevUploads.filter((f) => f.file !== file));

    if (url) {
      URL.revokeObjectURL(url);
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
    uploadFile,
    abortUpload,
  };
};
