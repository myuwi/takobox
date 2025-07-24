import { Link } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/primitives/Button";
import { useUploads } from "@/hooks/useUploads";

export const Sidebar = () => {
  const { uploadFiles } = useUploads();

  const { open, getInputProps } = useDropzone({ onDrop: uploadFiles });

  return (
    <div className="flex w-54 shrink-0 flex-col gap-4">
      <input {...getInputProps()} />
      <Button size="lg" onClick={open}>
        <Plus />
        <span>Upload file</span>
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          className="justify-start data-[status=active]:bg-accent/80 data-[status=active]:hover:bg-accent"
          variant="ghost"
          asChild
        >
          <Link to="/dashboard">
            <Folder size={16} />
            <span>Uploads</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};
