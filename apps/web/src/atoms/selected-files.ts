import { atom } from "jotai";
import type { FileDto } from "@/types/FileDto";

export const selectedFilesAtom = atom<FileDto[]>([]);
