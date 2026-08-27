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

// ---------- Nhân vật ----------

export async function createCharacter(projectId: string, name: string): Promise<StoryCharacter> {
  const order = await db.storyCharacters.filter((c) => c.projectId === projectId && c.deletedAt === null).count();
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
  return rows.sort((a, b) => a.order - b.order);
}

// ---------- Địa danh / Cảnh giới / Thế lực ----------

export async function createLocation(projectId: string, name: string, kind: StoryLocationKind): Promise<StoryLocation> {
  const order = await db.storyLocations.filter((l) => l.projectId === projectId && l.deletedAt === null).count();
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
  return rows.sort((a, b) => a.order - b.order);
}

// ---------- Từ điển thuật ngữ ----------

export async function createLoreEntry(projectId: string, term: string): Promise<StoryLoreEntry> {
  const order = await db.storyLoreEntries.filter((l) => l.projectId === projectId && l.deletedAt === null).count();
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
  return rows.sort((a, b) => a.order - b.order);
}

// ---------- Dòng thời gian ----------

export async function createTimelineEvent(projectId: string, title: string): Promise<StoryTimelineEvent> {
  const order = await db.storyTimelineEvents.filter((e) => e.projectId === projectId && e.deletedAt === null).count();
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
  return rows.sort((a, b) => a.order - b.order);
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

  const kindLabel: Record<StoryLocationKind, string> = { location: "Địa danh", realm: "Cảnh giới", faction: "Thế lực" };
  if (locations.length) {
    md += `## Thế giới (địa danh / cảnh giới / thế lực)\n\n`;
    for (const l of locations) {
      md += `- **${l.name}** (${kindLabel[l.kind]})${l.description ? `: ${l.description}` : ""}\n`;
    }
    md += `\n`;
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
