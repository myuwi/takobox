import { atom } from "jotai";

interface ConfirmationDialogConfig {
  title: string;
  description: string;
  confirmText?: string;
  callback: () => void | Promise<void>;
  focusRef?: React.RefObject<HTMLElement | null>;
}

interface ConfirmationDialogState extends ConfirmationDialogConfig {
  open: boolean;
}

export const confirmationDialogAtom = atom<ConfirmationDialogState | null>(null);
export const openConfirmationDialogAtom = atom(
  null,
  (_get, set, config: ConfirmationDialogConfig) => {
    set(confirmationDialogAtom, { ...config, open: true });
  },
);

interface RenameDialogConfig {
  title: string;
  placeholder: string;
  initialValue: string;
  callback: (name: string) => void | Promise<void>;
  focusRef?: React.RefObject<HTMLElement | null>;
}

interface RenameDialogState extends RenameDialogConfig {
  open: boolean;
}

export const renameDialogAtom = atom<RenameDialogState | null>(null);
export const openRenameDialogAtom = atom(null, (_get, set, config: RenameDialogConfig) => {
  set(renameDialogAtom, { ...config, open: true });
});
