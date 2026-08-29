import { create } from "zustand";
import type { Note } from "../types/entities";
import * as notesService from "../features/notes/notesService";

let notesLoadVersion = 0;

interface NotesState {
  notes: Note[];
  trashedNotes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  searchResults: Note[];
  loading: boolean;
  activeFolderId: string | null | undefined;
  view: "active" | "trash";

  loadNotes: (folderId?: string | null) => Promise<void>;
  loadTrash: () => Promise<void>;
  selectNote: (id: string | null) => void;
  createNote: (folderId?: string | null) => Promise<string>;
  updateNote: (id: string, patch: Parameters<typeof notesService.updateNote>[1]) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  hardDeleteNote: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => Promise<void>;
  showActive: (folderId?: string | null) => Promise<void>;
  showTrash: () => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  trashedNotes: [],
  selectedNoteId: null,
  searchQuery: "",
  searchResults: [],
  loading: false,
  activeFolderId: undefined,
  view: "active",

  loadNotes: async (folderId) => {
    const version = ++notesLoadVersion;
    set({ loading: true });
    const notes = await notesService.listActiveNotes(folderId);
    if (version !== notesLoadVersion) return;
    set({ notes, loading: false, activeFolderId: folderId });
  },

  loadTrash: async () => {
    const version = ++notesLoadVersion;
    const trashedNotes = await notesService.listTrashedNotes();
    if (version !== notesLoadVersion) return;
    set({ trashedNotes, loading: false });
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  createNote: async (folderId) => {
    const note = await notesService.createNote({ folderId });
    await get().loadNotes(get().activeFolderId);
    set({ selectedNoteId: note.id, view: "active" });
    return note.id;
  },

  updateNote: async (id, patch) => {
    await notesService.updateNote(id, patch);
    await get().loadNotes(get().activeFolderId);
    const query = get().searchQuery;
    if (query.trim()) set({ searchResults: await notesService.searchNotes(query) });
  },

  deleteNote: async (id) => {
    await notesService.softDeleteNote(id);
    if (get().selectedNoteId === id) set({ selectedNoteId: null });
    await get().loadNotes(get().activeFolderId);
    const query = get().searchQuery;
    if (query.trim()) set({ searchResults: await notesService.searchNotes(query) });
  },

  restoreNote: async (id) => {
    await notesService.restoreNote(id);
    await get().loadTrash();
    await get().loadNotes(get().activeFolderId);
  },

  hardDeleteNote: async (id) => {
    await notesService.hardDeleteNote(id);
    await get().loadTrash();
  },

  setSearchQuery: async (q) => {
    set({ searchQuery: q });
    const searchResults = q.trim() ? await notesService.searchNotes(q) : [];
    set({ searchResults });
  },

  showActive: async (folderId) => {
    set({ view: "active", selectedNoteId: null, searchQuery: "", searchResults: [] });
    await get().loadNotes(folderId);
  },

  showTrash: async () => {
    notesLoadVersion += 1;
    set({ view: "trash", selectedNoteId: null, searchQuery: "", searchResults: [] });
    await get().loadTrash();
  },
}));
