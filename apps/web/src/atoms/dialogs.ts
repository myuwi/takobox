import { atom } from "jotai";

interface ConfirmationDialogAtom {
  title: string;
  description: string;
  confirmText?: string;
  callback: () => void | Promise<void>;
  focusRef?: React.RefObject<HTMLElement | null>;
}

export const confirmationDialogAtom = atom<ConfirmationDialogAtom | null>(null);

interface RenameDialogAtom {
  title: string;
  placeholder: string;
  initialValue: string;
  callback: (name: string) => void | Promise<void>;
  focusRef?: React.RefObject<HTMLElement | null>;
}

export const renameDialogAtom = atom<RenameDialogAtom | null>(null);
