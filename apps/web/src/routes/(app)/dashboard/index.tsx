import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { useFileUpload } from "@/hooks/useFileUpload";
import { filesOptions, useFilesQuery } from "@/queries/files";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(filesOptions);
  },
});

function RouteComponent() {
  const { data: _files } = useFilesQuery();
  const { uploadFile, uploads, abortUpload } = useFileUpload();

  const onDrop = (files: File[]) => {
    console.log(files);

    for (const file of files) {
      uploadFile(file);
    }
  };

  const { getInputProps, getRootProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-medium">Uploads</h1>

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
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-border p-24 select-none data-[dragging=true]:bg-accent"
        data-dragging={isDragActive}
        {...getRootProps()}
      >
        <CloudUpload />
        <p>Drag and drop or browse files to upload</p>
        <Button variant="outline">Browse files</Button>
        <input {...getInputProps()} />
      </div>
    </div>
  );
}
