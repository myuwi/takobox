import { Field as FieldPrimitive } from "@base-ui/react/field";
import { tw } from "@/utils/tw";

export const Group = tw.div`flex flex-col gap-4`;

export const Root = tw(FieldPrimitive.Root)`flex flex-col gap-2`;

export const Label = FieldPrimitive.Label;

export const Error = tw(FieldPrimitive.Error)`text-sm text-destructive`;
