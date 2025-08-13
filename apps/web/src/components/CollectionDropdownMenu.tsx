import { Trash } from "lucide-react";
import { useDeleteCollectionMutation } from "@/queries/collections";
import type { CollectionDto } from "@/types/CollectionDto";
import { Button } from "./primitives/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./primitives/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./primitives/DropdownMenu";

interface DeleteCollectionDialogProps {
  collection: CollectionDto;
  trigger: React.ReactNode;
}

export const CollectionDropdownMenu = ({
  collection,
  trigger,
}: DeleteCollectionDialogProps) => {
  const { mutateAsync: createCollection } = useDeleteCollectionMutation();

  const handleDelete = async () => {
    try {
      await createCollection(collection.id);
    } catch (_) {}
  };

  return (
    <Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="start">
          <DialogTrigger asChild>
            <DropdownMenuItem variant="destructive">
              <Trash />
              <span>Delete collection</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the collection "{collection.name}"?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
