import { LoaderCircle } from "lucide-react";

export interface SpinnerProps {
  tip?: string;
}

export const Spinner = ({ tip }: SpinnerProps) => {
  return (
    <span className="flex flex-col items-center justify-center gap-3">
      <LoaderCircle className="size-6 animate-spin" />
      {tip}
    </span>
  );
};
