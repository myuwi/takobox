import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, X } from "lucide-react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { FileGrid } from "@/components/FileGrid";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Progress } from "@/components/primitives/Progress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { filesOptions, useFilesQuery } from "@/queries/files";
import { settingsOptions, useSettingsQuery } from "@/queries/settings";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(filesOptions),
      context.queryClient.prefetchQuery(settingsOptions),
    ]);
  },
});

function RouteComponent() {
  const { data: files } = useFilesQuery();
  const { data: settings } = useSettingsQuery();
  const { uploadFile, uploads, abortUpload } = useFileUpload();

  const onDrop: DropzoneOptions["onDrop"] = (files, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      return;
    }

    // TODO: check quota before upload

    for (const file of files) {
      uploadFile(file);
    }
  };

  const { open, getInputProps, getRootProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      noClick: true,
      noKeyboard: true,
      maxSize: settings?.maxFileSize,
    });

  return (
    <main className="flex w-full flex-col gap-4 [&_>_*]:mx-4">
      <h1 className="text-base font-medium">Uploads</h1>

      {/* TODO: replace with a list of rejected files. also show failed uploads there */}
      {fileRejections.length > 0 && (
        <Alert>
          Some of the selected files exceed the maximum file size limit.
        </Alert>
      )}

      {uploads.map(({ id, file, url, progress }) => {
        const handleAbort = () => abortUpload(file);

        return (
          <div key={id} className="flex gap-4">
            {url && (
              <img
                src={url}
                alt="File thumbnail"
                className="size-9 rounded-md object-cover"
              />
            )}
            <div className="flex grow flex-col items-center gap-2 rounded-md">
              <div className="flex w-full items-center justify-between gap-4">
                <span>{file.name}</span>
                <span>
                  {progress === 100 ? "Processing..." : `${progress}%`}
                </span>
              </div>
              <Progress value={progress} />
            </div>
            {progress < 100 && (
              <Button variant="ghost" size="icon" onClick={handleAbort}>
                <X />
              </Button>
            )}
          </div>
        );
      })}

      <div
        className="mx-0! -mt-2 flex w-full grow flex-col items-center justify-center gap-3 overflow-hidden rounded-md inset-ring inset-ring-transparent data-[dragging=true]:bg-accent data-[dragging=true]:inset-ring-border"
        data-dragging={isDragActive}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {files && files.length > 0 ? (
          <FileGrid files={files} />
        ) : (
          <div className="mt-24 flex w-full grow flex-col items-center gap-3 rounded-md p-4">
            <CloudUpload />
            <p>Drag and drop or browse files to upload</p>
            <Button variant="outline" onClick={open}>
              Browse files
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
