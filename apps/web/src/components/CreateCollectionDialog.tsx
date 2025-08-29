import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateCollectionMutation } from "@/queries/collections";
import { formatError } from "@/utils/error";
import { Alert } from "./primitives/Alert";
import { Button } from "./primitives/Button";
import * as Dialog from "./primitives/Dialog";
import { Input } from "./primitives/Input";
import { Label } from "./primitives/Label";

interface CreateCollectionDialogProps {
  trigger: React.ComponentProps<typeof Dialog.Trigger>["render"];
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={trigger} />
      <Dialog.Content>
        <form
          className="contents"
          onSubmit={handleSubmit(onSubmit)}
          onReset={() => setShowError(false)}
        >
          <Dialog.Header>
            <Dialog.Title>Create new collection</Dialog.Title>
          </Dialog.Header>

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

          <Dialog.Footer>
            <Dialog.Close render={<Button variant="outline" />}>
              Cancel
            </Dialog.Close>
            <Button type="submit">Save changes</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
