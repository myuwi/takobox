import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/Button";
import {
  filesOptions,
  useFilesQuery,
  useUploadFileMutation,
} from "@/queries/files";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(filesOptions);
  },
});

function RouteComponent() {
  const { data: _files } = useFilesQuery();
  const { mutateAsync: uploadFile, isPending: uploadInProgress } =
    useUploadFileMutation({
      onUploadProgress: (progress) => console.log(progress),
    });

  const onDrop = async (files: File[]) => {
    const [file] = files;
    if (!file) {
      return;
    }

    console.log(file);
    const res = await uploadFile(file);
    console.log(res);
  };

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-medium">Uploads</h1>

      {uploadInProgress && "Uploading file..."}

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
