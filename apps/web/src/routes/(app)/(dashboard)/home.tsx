import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { CloudUpload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { selectedFilesAtom } from "@/atoms/selected-files";
import { FileGrid } from "@/components/FileGrid";
import { Alert } from "@/components/primitives/Alert";
import { Button } from "@/components/primitives/Button";
import { Progress } from "@/components/primitives/Progress";
import { Spinner } from "@/components/primitives/Spinner";
import { useUploads } from "@/hooks/useUploads";
import {
  collectionFilesOptions,
  collectionsOptions,
} from "@/queries/collections";
import { filesOptions } from "@/queries/files";
import { settingsOptions } from "@/queries/settings";
import { formatBytes } from "@/utils/files";

interface HomeSearchParams {
  collection?: string;
}

export const Route = createFileRoute("/(app)/(dashboard)/home")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): HomeSearchParams => {
    return {
      collection:
        search.collection != null ? String(search.collection) : undefined,
    };
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { collection: collectionId } = Route.useSearch();
  const { data: settings } = useQuery(settingsOptions);
  const {
    data: files,
    isPending,
    error,
  } = useQuery(
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

  const setSelectedFiles = useSetAtom(selectedFilesAtom);

  useEffect(() => {
    if (collectionId && error?.status === 404) {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, collection: undefined }),
      });
    }
  }, [collectionId, error?.status, navigate]);

  useEffect(() => {
    return () => {
      setSelectedFiles([]);
      resetFileRejections();
    };
  }, [collectionId, resetFileRejections, setSelectedFiles]);

  const { open, getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => uploadFiles(files, collectionId),
    noClick: true,
    noKeyboard: true,
  });

  const headerText = (collectionId && collection?.name) || "All files";

  return (
    <main className="flex h-full w-full flex-col gap-4 px-2 pb-4 max-md:px-4 [&_>_*]:mx-2">
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
            {url &&
              (file.type.startsWith("video/") ? (
                <video
                  src={url}
                  autoPlay={false}
                  controls={false}
                  loop
                  muted
                  playsInline
                  className="size-9 rounded-md object-cover"
                />
              ) : (
                <img
                  src={url}
                  alt="File thumbnail"
                  className="size-9 rounded-md object-cover"
                />
              ))}
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

      {isPending ? (
        <div className="p-8">
          <Spinner />
        </div>
      ) : (
        <div
          className="-mx-0! -mt-2 flex w-full grow flex-col items-center justify-center overflow-hidden rounded-md inset-ring inset-ring-transparent data-[dragging=true]:bg-accent data-[dragging=true]:inset-ring-border"
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
      )}
    </main>
  );
}
