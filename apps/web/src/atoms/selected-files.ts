import { atom } from "jotai";
import type { FileDto } from "@/types";

export const selectedFilesAtom = atom<FileDto[]>([]);
