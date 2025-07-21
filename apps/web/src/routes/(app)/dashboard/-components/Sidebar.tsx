import { Link } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/primitives/Button";

export const Sidebar = () => {
  return (
    <div className="flex w-54 shrink-0 flex-col gap-4">
      {/* TODO: Actually hook this up */}
      <Button size="lg">
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
