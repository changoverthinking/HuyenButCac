import { create } from "zustand";
import type { Project, ProjectChapter, ProjectSection, ProjectTask, ProjectMilestone, ProjectKind } from "../types/entities";
import * as svc from "../features/projects/projectsService";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  sections: ProjectSection[];
  chapters: ProjectChapter[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
  selectedChapterId: string | null;

  loadProjects: () => Promise<void>;
  selectProject: (id: string | null) => Promise<void>;
  createProject: (title: string, kind: ProjectKind) => Promise<string>;
  updateProject: typeof svc.updateProject;

  createSection: (title: string) => Promise<void>;
  createChapter: (title: string, sectionId: string | null) => Promise<void>;
  selectChapter: (id: string | null) => void;
  updateChapter: (id: string, patch: Parameters<typeof svc.updateChapter>[1]) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;

  createTask: (title: string) => Promise<void>;
  updateTaskStatus: (id: string, status: ProjectTask["status"]) => Promise<void>;

  createMilestone: (title: string, dueDate: number | null) => Promise<void>;
  toggleMilestone: (id: string, done: boolean) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  sections: [],
  chapters: [],
  tasks: [],
  milestones: [],
  selectedChapterId: null,

  loadProjects: async () => set({ projects: await svc.listProjects() }),

  selectProject: async (id) => {
    set({ selectedProjectId: id, selectedChapterId: null });
    if (!id) {
      set({ sections: [], chapters: [], tasks: [], milestones: [] });
      return;
    }
    const [sections, chapters, tasks, milestones] = await Promise.all([
      svc.listSections(id),
      svc.listChapters(id),
      svc.listTasks(id),
      svc.listMilestones(id),
    ]);
    set({ sections, chapters, tasks, milestones });
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
}));
