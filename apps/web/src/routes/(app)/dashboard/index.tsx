import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
});

function onDrop(files: File[]) {
  // Do something...
  console.log(files);
}

function RouteComponent() {
  const { getInputProps, getRootProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-medium">Uploads</h1>

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
