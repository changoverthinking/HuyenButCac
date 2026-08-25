import { create } from "zustand";
import type { Folder } from "../types/entities";
import * as foldersService from "../features/folders/foldersService";

interface FoldersState {
  folders: Folder[];
  selectedFolderId: string | null;
  load: () => Promise<void>;
  select: (id: string | null) => void;
  create: (name: string, parentId: string | null) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  move: (id: string, newParentId: string | null) => Promise<{ error?: string }>;
  remove: (id: string) => Promise<void>;
}

export const useFoldersStore = create<FoldersState>((set, get) => ({
  folders: [],
  selectedFolderId: null,

  load: async () => set({ folders: await foldersService.listFolders() }),
  select: (id) => set({ selectedFolderId: id }),

  create: async (name, parentId) => {
    await foldersService.createFolder(name, parentId);
    await get().load();
  },

  rename: async (id, name) => {
    await foldersService.renameFolder(id, name);
    await get().load();
  },

  move: async (id, newParentId) => {
    try {
      await foldersService.moveFolder(id, newParentId);
      await get().load();
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  },

  remove: async (id) => {
    await foldersService.softDeleteFolder(id);
    if (get().selectedFolderId === id) set({ selectedFolderId: null });
    await get().load();
  },
}));
