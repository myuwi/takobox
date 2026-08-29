import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as z from "zod";
import { FileGrid } from "@/components/FileGrid";
import { Button } from "@/components/primitives/Button";
import { Progress } from "@/components/primitives/Progress";
import { Spinner } from "@/components/primitives/Spinner";
import { useUploads } from "@/hooks/useUploads";
import { collectionFilesOptions, collectionsOptions } from "@/queries/collections";
import { filesOptions } from "@/queries/files";

const homeSearchSchema = z.object({
  collection: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/(app)/(dashboard)/home")({
  validateSearch: homeSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { collection: collectionId, q } = Route.useSearch();
  const {
    data: rawFiles,
    isPending,
    error,
  } = useQuery(!collectionId ? filesOptions : collectionFilesOptions(collectionId));
  // TODO: Move filtering to the server when pagination is implemented
  const files = useMemo(() => {
    return q ? rawFiles?.filter((f) => f.name.includes(q)) : rawFiles;
  }, [rawFiles, q]);

  const { data: collection } = useQuery({
    ...collectionsOptions,
    select: (collections) => collections.find((c) => c.id === collectionId),
    enabled: !!collectionId,
  });

  const { uploads, uploadFiles, abortUpload } = useUploads();

  useEffect(() => {
    if (collectionId && error?.status === 404) {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, collection: undefined }),
      });
    }
  }, [collectionId, error?.status, navigate]);

  const { open, getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop: (files) => uploadFiles(files, { collectionId }),
    noClick: true,
    noKeyboard: true,
  });

  const headerText = (collectionId && collection?.name) || "All files";

  return (
    <main className="flex size-full flex-col gap-4 px-2 pb-4 *:mx-2 max-md:px-4">
      <h1 className="text-base font-medium">{headerText}</h1>

      {uploads.map(({ id, file, url, progress }) => {
        const handleAbort = () => abortUpload(id);

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
                <img src={url} alt="File thumbnail" className="size-9 rounded-md object-cover" />
              ))}
            <div className="flex grow flex-col items-center gap-2 rounded-md">
              <div className="flex w-full items-center justify-between gap-4">
                <span>{file.name}</span>
                <span>{progress === 100 ? "Processing..." : `${progress}%`}</span>
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
          className="mx-0! -mt-2 flex w-full grow flex-col items-center justify-center overflow-hidden rounded-md inset-ring inset-ring-transparent data-[dragging=true]:bg-accent data-[dragging=true]:inset-ring-border"
          data-dragging={isDragActive}
          {...getRootProps()}
        >
          <input {...getInputProps({ hidden: true })} />
          {files && files.length > 0 ? (
            <FileGrid key={JSON.stringify([collectionId, q])} files={files} />
          ) : (
            <div className="mt-24 flex w-full grow flex-col items-center gap-3 rounded-md p-4">
              {q ? (
                <p>No files matching "{q}" were found.</p>
              ) : (
                <>
                  <CloudUpload />
                  <p>Drag and drop or browse files to upload</p>
                  <Button variant="outline" onClick={open}>
                    Browse files
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
