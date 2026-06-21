import { atom } from "jotai";
import type { File } from "@takobox/sdk";

export const selectedFilesAtom = atom<File[]>([]);
