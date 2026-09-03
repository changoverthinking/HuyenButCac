import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type {
  StoryCharacter,
  StoryLocation,
  StoryLocationKind,
  StoryLoreEntry,
  StoryTimelineEvent,
} from "../../types/entities";

function now() {
  return Date.now();
}

function base() {
  const t = now();
  return { createdAt: t, updatedAt: t, schemaVersion: 1, deletedAt: null, syncState: "local" as const };
}

function nextOrder<T extends { order: number }>(items: T[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
}

function stableOrder<T extends { order: number; createdAt: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

// ---------- Nhân vật ----------

export async function createCharacter(projectId: string, name: string): Promise<StoryCharacter> {
  const siblings = await db.storyCharacters.filter((c) => c.projectId === projectId && c.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const character: StoryCharacter = {
    id: uuid(),
    projectId,
    name,
    aliasNames: "",
    role: "",
    realm: "",
    appearance: "",
    personality: "",
    relationships: "",
    notes: "",
    order,
    ...base(),
  };
  await db.storyCharacters.add(character);
  return character;
}

export async function updateCharacter(
  id: string,
  patch: Partial<Pick<StoryCharacter, "name" | "aliasNames" | "role" | "realm" | "appearance" | "personality" | "relationships" | "notes">>
): Promise<void> {
  await db.storyCharacters.update(id, { ...patch, updatedAt: now() });
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.storyCharacters.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listCharacters(projectId: string): Promise<StoryCharacter[]> {
  const rows = await db.storyCharacters.filter((c) => c.projectId === projectId && c.deletedAt === null).toArray();
  return stableOrder(rows);
}

// ---------- Bối cảnh / Địa danh / Cảnh giới / Thế lực ----------

export const STORY_LOCATION_KIND_LABEL: Record<StoryLocationKind, string> = {
  era: "Bối cảnh",
  location: "Địa danh",
  realm: "Cảnh giới",
  faction: "Thế lực",
};

/** Thứ tự để AI đọc thế giới theo hướng: thời đại → nơi chốn → tu vi → thế lực. */
export const STORY_LOCATION_KIND_ORDER: StoryLocationKind[] = ["era", "location", "realm", "faction"];

export async function createLocation(projectId: string, name: string, kind: StoryLocationKind): Promise<StoryLocation> {
  const siblings = await db.storyLocations.filter((l) => l.projectId === projectId && l.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const location: StoryLocation = { id: uuid(), projectId, name, kind, description: "", order, ...base() };
  await db.storyLocations.add(location);
  return location;
}

export async function updateLocation(
  id: string,
  patch: Partial<Pick<StoryLocation, "name" | "kind" | "description">>
): Promise<void> {
  await db.storyLocations.update(id, { ...patch, updatedAt: now() });
}

export async function deleteLocation(id: string): Promise<void> {
  await db.storyLocations.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listLocations(projectId: string): Promise<StoryLocation[]> {
  const rows = await db.storyLocations.filter((l) => l.projectId === projectId && l.deletedAt === null).toArray();
  return stableOrder(rows);
}

// ---------- Từ điển thuật ngữ ----------

export async function createLoreEntry(projectId: string, term: string): Promise<StoryLoreEntry> {
  const siblings = await db.storyLoreEntries.filter((l) => l.projectId === projectId && l.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const entry: StoryLoreEntry = { id: uuid(), projectId, term, definition: "", order, ...base() };
  await db.storyLoreEntries.add(entry);
  return entry;
}

export async function updateLoreEntry(id: string, patch: Partial<Pick<StoryLoreEntry, "term" | "definition">>): Promise<void> {
  await db.storyLoreEntries.update(id, { ...patch, updatedAt: now() });
}

export async function deleteLoreEntry(id: string): Promise<void> {
  await db.storyLoreEntries.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listLoreEntries(projectId: string): Promise<StoryLoreEntry[]> {
  const rows = await db.storyLoreEntries.filter((l) => l.projectId === projectId && l.deletedAt === null).toArray();
  return stableOrder(rows);
}

// ---------- Dòng thời gian ----------

export async function createTimelineEvent(projectId: string, title: string): Promise<StoryTimelineEvent> {
  const siblings = await db.storyTimelineEvents.filter((e) => e.projectId === projectId && e.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const event: StoryTimelineEvent = { id: uuid(), projectId, title, summary: "", chapterId: null, order, ...base() };
  await db.storyTimelineEvents.add(event);
  return event;
}

export async function updateTimelineEvent(
  id: string,
  patch: Partial<Pick<StoryTimelineEvent, "title" | "summary" | "chapterId">>
): Promise<void> {
  await db.storyTimelineEvents.update(id, { ...patch, updatedAt: now() });
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  await db.storyTimelineEvents.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listTimelineEvents(projectId: string): Promise<StoryTimelineEvent[]> {
  const rows = await db.storyTimelineEvents.filter((e) => e.projectId === projectId && e.deletedAt === null).toArray();
  return stableOrder(rows);
}

// ---------- Xuất "Thư Viện Truyện" dạng Markdown (để dán vào AI làm ngữ cảnh) ----------

export async function exportStoryBibleMarkdown(projectId: string): Promise<string> {
  const [characters, locations, lore, timeline] = await Promise.all([
    listCharacters(projectId),
    listLocations(projectId),
    listLoreEntries(projectId),
    listTimelineEvents(projectId),
  ]);

  let md = `# Thư Viện Truyện\n\n`;

  if (characters.length) {
    md += `## Nhân vật\n\n`;
    for (const c of characters) {
      md += `### ${c.name}${c.aliasNames ? ` (${c.aliasNames})` : ""}\n`;
      if (c.role) md += `- Vai trò: ${c.role}\n`;
      if (c.realm) md += `- Cảnh giới: ${c.realm}\n`;
      if (c.appearance) md += `- Ngoại hình: ${c.appearance}\n`;
      if (c.personality) md += `- Tính cách: ${c.personality}\n`;
      if (c.relationships) md += `- Quan hệ: ${c.relationships}\n`;
      if (c.notes) md += `- Ghi chú: ${c.notes}\n`;
      md += `\n`;
    }
  }

  if (locations.length) {
    md += `## Thế giới\n\n`;
    for (const kind of STORY_LOCATION_KIND_ORDER) {
      const entries = locations.filter((location) => location.kind === kind);
      if (!entries.length) continue;
      md += `### ${STORY_LOCATION_KIND_LABEL[kind]}\n\n`;
      for (const l of entries) {
        md += `- **${l.name}**${l.description ? `: ${l.description}` : ""}\n`;
      }
      md += `\n`;
    }
  }

  if (lore.length) {
    md += `## Từ điển thuật ngữ\n\n`;
    for (const l of lore) {
      md += `- **${l.term}**: ${l.definition}\n`;
    }
    md += `\n`;
  }

  if (timeline.length) {
    md += `## Dòng thời gian\n\n`;
    for (const e of timeline) {
      md += `- **${e.title}**${e.summary ? `: ${e.summary}` : ""}\n`;
    }
    md += `\n`;
  }

  return md;
}
