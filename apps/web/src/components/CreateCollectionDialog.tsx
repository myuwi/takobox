import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateCollectionMutation } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Alert } from "./primitives/Alert";
import { Button } from "./primitives/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./primitives/Dialog";
import { Input } from "./primitives/Input";
import { Label } from "./primitives/Label";

interface CreateCollectionDialogProps {
  trigger: React.ReactNode;
}

export const CreateCollectionDialog = ({
  trigger,
}: CreateCollectionDialogProps) => {
  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  const { mutateAsync: createCollection, error } =
    useCreateCollectionMutation();

  const [showError, setShowError] = useState(false);
  const [open, setOpenState] = useState(false);
  const setOpen = (value: boolean) => {
    setOpenState(value);
    if (!value) reset();
  };

  const onSubmit = async (values: { name: string }) => {
    try {
      await createCollection(values.name);
      setOpen(false);
    } catch (_) {
      setShowError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onReset={() => setShowError(false)}
        >
          <DialogHeader>
            <DialogTitle>Create new collection</DialogTitle>
          </DialogHeader>

          <div>
            <Label className="flex flex-col gap-2">
              Name
              <Input
                {...register("name", {
                  required: true,
                  onChange: () => setShowError(false),
                })}
                type="text"
                placeholder="Collection name"
                autoComplete="off"
                aria-invalid={showError && !!error}
              />
              {showError && error && <Alert>{formatError(error)}</Alert>}
            </Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
