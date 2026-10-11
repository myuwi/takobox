import { CreateCollectionDialog } from "./CreateCollectionDialog";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";
import { DeleteFileDialog } from "./DeleteFileDialog";
import { RenameCollectionDialog } from "./RenameCollectionDialog";
import { RenameFileDialog } from "./RenameFileDialog";

export const Dialogs = () => {
  return (
    <>
      <CreateCollectionDialog />
      <RenameCollectionDialog />
      <DeleteCollectionDialog />
      <RenameFileDialog />
      <DeleteFileDialog />
    </>
  );
};
