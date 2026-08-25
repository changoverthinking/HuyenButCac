import { create } from "zustand";
import type { Note } from "../types/entities";
import * as notesService from "../features/notes/notesService";

interface NotesState {
  notes: Note[];
  trashedNotes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  searchResults: Note[];
  loading: boolean;

  loadNotes: (folderId?: string | null) => Promise<void>;
  loadTrash: () => Promise<void>;
  selectNote: (id: string | null) => void;
  createNote: (folderId?: string | null) => Promise<string>;
  updateNote: (id: string, patch: Parameters<typeof notesService.updateNote>[1]) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  hardDeleteNote: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  trashedNotes: [],
  selectedNoteId: null,
  searchQuery: "",
  searchResults: [],
  loading: false,

  loadNotes: async (folderId) => {
    set({ loading: true });
    const notes = await notesService.listActiveNotes(folderId);
    set({ notes, loading: false });
  },

  loadTrash: async () => {
    const trashedNotes = await notesService.listTrashedNotes();
    set({ trashedNotes });
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  createNote: async (folderId) => {
    const note = await notesService.createNote({ folderId });
    await get().loadNotes();
    set({ selectedNoteId: note.id });
    return note.id;
  },

  updateNote: async (id, patch) => {
    await notesService.updateNote(id, patch);
    await get().loadNotes();
  },

  deleteNote: async (id) => {
    await notesService.softDeleteNote(id);
    if (get().selectedNoteId === id) set({ selectedNoteId: null });
    await get().loadNotes();
  },

  restoreNote: async (id) => {
    await notesService.restoreNote(id);
    await get().loadTrash();
    await get().loadNotes();
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
}));
