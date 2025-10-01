import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Folder, Plus, Tag } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { sidebarOpenMobileAtom } from "@/atoms/sidebar";
import { Button } from "@/components/primitives/Button";
import * as Sheet from "@/components/primitives/Sheet";
import { useUploads } from "@/hooks/useUploads";
import { collectionsOptions } from "@/queries/collections";
import { tw } from "@/utils/tw";
import { CollectionMenu } from "./CollectionMenu";
import { CreateCollectionDialog } from "./CreateCollectionDialog";

const SidebarContent = tw.div`flex flex-col gap-4`;
const SidebarGroup = tw.div`flex flex-col gap-1`;
const SidebarGroupLabel = tw.div`flex h-8 items-center justify-between gap-1 pl-3`;
const SidebarGroupContent = tw.div`flex flex-col gap-1`;

export const Sidebar = () => {
  const { uploadFiles } = useUploads();
  const [openMobile, setOpenMobile] = useAtom(sidebarOpenMobileAtom);
  const { data: collections } = useQuery(collectionsOptions);

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
            render={
              <Link
                to="/home"
                search={(prev) => ({ ...prev, collection: undefined })}
                activeOptions={{ explicitUndefined: true }}
              />
            }
          >
            <Folder className="p-0.5" />
            <span>All files</span>
          </Button>
        </SidebarGroupContent>

        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Collections</span>
            <CreateCollectionDialog />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {collections?.map((collection) => {
              return (
                <Button
                  key={collection.id}
                  className="group justify-start pr-1 focus-within:bg-accent/80 has-data-popup-open:bg-accent data-[status=active]:bg-accent/80 data-[status=active]:hover:bg-accent"
                  variant="ghost"
                  render={
                    <Link
                      to="/home"
                      search={(prev) => ({
                        ...prev,
                        collection: collection.id,
                      })}
                    />
                  }
                >
                  <Tag className="p-0.5" />
                  <span>{collection.name}</span>
                  <CollectionMenu collection={collection} />
                </Button>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="contents max-md:hidden">{sidebar}</div>

      {/* Mobile Sidebar */}
      <Sheet.Root open={openMobile} onOpenChange={setOpenMobile}>
        <Sheet.Content side="left" className="w-auto px-4 py-8 md:hidden">
          {sidebar}
        </Sheet.Content>
      </Sheet.Root>
    </>
  );
};
