import { File } from "lucide-react";
import type { FileDto } from "@/types/FileDto";

interface FileGridProps {
  files: FileDto[];
}

export const FileGrid = ({ files }: FileGridProps) => {
  return (
    <div className="grid w-full grid-flow-row grid-cols-[repeat(auto-fill,8rem)] justify-between gap-4 pb-4">
      {files.map((file) => {
        return (
          <div
            key={file.id}
            className="flex h-min w-32 flex-col items-center gap-2 rounded-md p-2 select-none hover:bg-accent/50"
          >
            <div className="flex aspect-[4/3] w-full place-content-center">
              <File />
            </div>
            <span className="text-center wrap-anywhere">{file.original}</span>
          </div>
        );
      })}
    </div>
  );
};
