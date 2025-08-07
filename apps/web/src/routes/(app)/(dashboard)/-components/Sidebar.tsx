import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Folder, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { sidebarOpenMobileAtom } from "@/atoms/sidebar";
import { Button } from "@/components/primitives/Button";
import { Sheet, SheetContent } from "@/components/primitives/Sheet";
import { useUploads } from "@/hooks/useUploads";
import { twx } from "@/utils/twx";

const SidebarContent = twx.div`flex flex-col gap-4`;
const SidebarGroup = twx.div`flex flex-col gap-1`;
const SidebarGroupLabel = twx.div`flex h-8 items-center justify-between gap-1 pl-3`;
const SidebarGroupContent = twx.div`flex flex-col gap-1`;

export const Sidebar = () => {
  const { uploadFiles } = useUploads();
  const [openMobile, setOpenMobile] = useAtom(sidebarOpenMobileAtom);

  const { open, getInputProps } = useDropzone({ onDrop: uploadFiles });

  const sidebar = (
    <div className="flex w-54 shrink-0 flex-col gap-4">
      <input {...getInputProps()} />
      <Button size="lg" onClick={open}>
        <Plus />
        <span>Upload file</span>
      </Button>

      <SidebarContent>
        <SidebarGroupContent>
          <Button
            className="justify-start data-[status=active]:bg-accent/80 data-[status=active]:hover:bg-accent"
            variant="ghost"
            asChild
          >
            <Link
              to="/home"
              search={(prev) => ({ ...prev, collection: undefined })}
              activeOptions={{ explicitUndefined: true }}
            >
              <Folder className="p-0.5" />
              <span>All files</span>
            </Link>
          </Button>
        </SidebarGroupContent>

        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Collections</span>
            <Button variant="ghost" size="icon-sm">
              <Plus className="p-0.5" />
            </Button>
          </SidebarGroupLabel>

          <SidebarGroupContent>{/* TODO */}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="contents max-md:hidden">{sidebar}</div>

      {/* Mobile Sidebar */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-auto px-4 py-8 md:hidden">
          {sidebar}
        </SheetContent>
      </Sheet>
    </>
  );
};
