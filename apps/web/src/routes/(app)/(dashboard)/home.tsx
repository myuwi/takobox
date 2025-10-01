import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { FileGrid } from "@/components/FileGrid";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Progress } from "@/components/primitives/Progress";
import { useUploads } from "@/hooks/useUploads";
import {
  collectionFilesOptions,
  collectionsOptions,
} from "@/queries/collections";
import { filesOptions } from "@/queries/files";
import { useSettingsQuery } from "@/queries/settings";
import { formatBytes } from "@/utils/files";

export const Route = createFileRoute("/(app)/(dashboard)/home")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      collection: search.collection as string | undefined,
    };
  },
  beforeLoad: async ({ context, search: { collection } }) => {
    await context.queryClient.prefetchQuery(
      !collection ? filesOptions : collectionFilesOptions(collection),
    );
  },
});

function RouteComponent() {
  const { collection: collectionId } = Route.useSearch();
  const { data: settings } = useSettingsQuery();

  const { data: files } = useQuery(
    !collectionId ? filesOptions : collectionFilesOptions(collectionId),
  );

  const { data: collection } = useQuery({
    ...collectionsOptions,
    select: (collections) => collections.find((c) => c.id === collectionId),
    enabled: !!collectionId,
  });

  const {
    uploads,
    uploadFiles,
    abortUpload,
    fileRejections,
    resetFileRejections,
  } = useUploads();

  useEffect(() => {
    return () => resetFileRejections();
  }, [resetFileRejections]);

  const { open, getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    noClick: true,
    noKeyboard: true,
  });

  const headerText = (collectionId && collection?.name) || "All files";

  return (
    <main className="flex w-full flex-col gap-4 [&_>_*]:mx-4">
      <h1 className="text-base font-medium">{headerText}</h1>

      {/* TODO: replace with a list of rejected files. also show failed uploads there */}
      {fileRejections.length > 0 && (
        <Alert onDismiss={() => resetFileRejections()}>
          Some of the selected files exceed the maximum file size limit of{" "}
          {formatBytes(settings!.maxFileSize)}.
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
