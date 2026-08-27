import { create } from "zustand";
import type {
  Project, ProjectChapter, ProjectSection, ProjectTask, ProjectMilestone, ProjectKind,
  StoryCharacter, StoryLocation, StoryLocationKind, StoryLoreEntry, StoryTimelineEvent,
} from "../types/entities";
import * as svc from "../features/projects/projectsService";
import * as bible from "../features/projects/storyBibleService";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  sections: ProjectSection[];
  chapters: ProjectChapter[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  selectedChapterId: string | null;
  characters: StoryCharacter[];
  locations: StoryLocation[];
  loreEntries: StoryLoreEntry[];
  timelineEvents: StoryTimelineEvent[];

  loadProjects: () => Promise<void>;
  selectProject: (id: string | null) => Promise<void>;
  createProject: (title: string, kind: ProjectKind) => Promise<string>;
  updateProject: typeof svc.updateProject;
  deleteProject: (id: string) => Promise<void>;

  createSection: (title: string) => Promise<void>;
  createChapter: (title: string, sectionId: string | null) => Promise<void>;
  selectChapter: (id: string | null) => void;
  updateChapter: (id: string, patch: Parameters<typeof svc.updateChapter>[1]) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;

  createTask: (title: string) => Promise<void>;
  updateTaskStatus: (id: string, status: ProjectTask["status"]) => Promise<void>;

  createMilestone: (title: string, dueDate: number | null) => Promise<void>;
  toggleMilestone: (id: string, done: boolean) => Promise<void>;

  createCharacter: (name: string) => Promise<void>;
  updateCharacter: (id: string, patch: Parameters<typeof bible.updateCharacter>[1]) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;

  createLocation: (name: string, kind: StoryLocationKind) => Promise<void>;
  updateLocation: (id: string, patch: Parameters<typeof bible.updateLocation>[1]) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  createLoreEntry: (term: string) => Promise<void>;
  updateLoreEntry: (id: string, patch: Parameters<typeof bible.updateLoreEntry>[1]) => Promise<void>;
  deleteLoreEntry: (id: string) => Promise<void>;

  createTimelineEvent: (title: string) => Promise<void>;
  updateTimelineEvent: (id: string, patch: Parameters<typeof bible.updateTimelineEvent>[1]) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  sections: [],
  chapters: [],
  tasks: [],
  milestones: [],
  selectedChapterId: null,
  characters: [],
  locations: [],
  loreEntries: [],
  timelineEvents: [],

  loadProjects: async () => set({ projects: await svc.listProjects() }),

  selectProject: async (id) => {
    set({ selectedProjectId: id, selectedChapterId: null });
    if (!id) {
      set({ sections: [], chapters: [], tasks: [], milestones: [], characters: [], locations: [], loreEntries: [], timelineEvents: [] });
      return;
    }
    const [sections, chapters, tasks, milestones, characters, locations, loreEntries, timelineEvents] = await Promise.all([
      svc.listSections(id),
      svc.listChapters(id),
      svc.listTasks(id),
      svc.listMilestones(id),
      bible.listCharacters(id),
      bible.listLocations(id),
      bible.listLoreEntries(id),
      bible.listTimelineEvents(id),
    ]);
    set({ sections, chapters, tasks, milestones, characters, locations, loreEntries, timelineEvents });
  },

  createProject: async (title, kind) => {
    const project = await svc.createProject({ title, kind });
    await get().loadProjects();
    await get().selectProject(project.id);
    return project.id;
  },

  updateProject: async (id, patch) => {
    await svc.updateProject(id, patch);
    await get().loadProjects();
  },

  deleteProject: async (id) => {
    await svc.softDeleteProject(id);
    if(get().selectedProjectId===id) await get().selectProject(null);
    await get().loadProjects();
  },

  createSection: async (title) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await svc.createSection(pid, title);
    set({ sections: await svc.listSections(pid) });
  },

  createChapter: async (title, sectionId) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    const chapter = await svc.createChapter({ projectId: pid, sectionId, title });
    set({ chapters: await svc.listChapters(pid), selectedChapterId: chapter.id });
  },

  selectChapter: (id) => set({ selectedChapterId: id }),

  updateChapter: async (id, patch) => {
    await svc.updateChapter(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ chapters: await svc.listChapters(pid) });
  },

  deleteChapter: async (id) => {
    await svc.softDeleteChapter(id);
    const pid = get().selectedProjectId;
    if (pid) set({ chapters: await svc.listChapters(pid) });
    if (get().selectedChapterId === id) set({ selectedChapterId: null });
  },

  createTask: async (title) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await svc.createTask(pid, title);
    set({ tasks: await svc.listTasks(pid) });
  },

  updateTaskStatus: async (id, status) => {
    await svc.updateTaskStatus(id, status);
    const pid = get().selectedProjectId;
    if (pid) set({ tasks: await svc.listTasks(pid) });
  },

  createMilestone: async (title, dueDate) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await svc.createMilestone(pid, title, dueDate);
    set({ milestones: await svc.listMilestones(pid) });
  },

  toggleMilestone: async (id, done) => {
    await svc.toggleMilestone(id, done);
    const pid = get().selectedProjectId;
    if (pid) set({ milestones: await svc.listMilestones(pid) });
  },

  createCharacter: async (name) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await bible.createCharacter(pid, name);
    set({ characters: await bible.listCharacters(pid) });
  },
  updateCharacter: async (id, patch) => {
    await bible.updateCharacter(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ characters: await bible.listCharacters(pid) });
  },
  deleteCharacter: async (id) => {
    await bible.deleteCharacter(id);
    const pid = get().selectedProjectId;
    if (pid) set({ characters: await bible.listCharacters(pid) });
  },

  createLocation: async (name, kind) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await bible.createLocation(pid, name, kind);
    set({ locations: await bible.listLocations(pid) });
  },
  updateLocation: async (id, patch) => {
    await bible.updateLocation(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ locations: await bible.listLocations(pid) });
  },
  deleteLocation: async (id) => {
    await bible.deleteLocation(id);
    const pid = get().selectedProjectId;
    if (pid) set({ locations: await bible.listLocations(pid) });
  },

  createLoreEntry: async (term) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await bible.createLoreEntry(pid, term);
    set({ loreEntries: await bible.listLoreEntries(pid) });
  },
  updateLoreEntry: async (id, patch) => {
    await bible.updateLoreEntry(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ loreEntries: await bible.listLoreEntries(pid) });
  },
  deleteLoreEntry: async (id) => {
    await bible.deleteLoreEntry(id);
    const pid = get().selectedProjectId;
    if (pid) set({ loreEntries: await bible.listLoreEntries(pid) });
  },

  createTimelineEvent: async (title) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await bible.createTimelineEvent(pid, title);
    set({ timelineEvents: await bible.listTimelineEvents(pid) });
  },
  updateTimelineEvent: async (id, patch) => {
    await bible.updateTimelineEvent(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ timelineEvents: await bible.listTimelineEvents(pid) });
  },
  deleteTimelineEvent: async (id) => {
    await bible.deleteTimelineEvent(id);
    const pid = get().selectedProjectId;
    if (pid) set({ timelineEvents: await bible.listTimelineEvents(pid) });
  },
}));
