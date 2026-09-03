import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { createProject } from "../features/projects/projectsService";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
  listCharacters,
  createLocation,
  listLocations,
  createLoreEntry,
  listLoreEntries,
  createTimelineEvent,
  updateTimelineEvent,
  listTimelineEvents,
  exportStoryBibleMarkdown,
} from "../features/projects/storyBibleService";

beforeEach(async () => {
  await db.projects.clear();
  await db.storyCharacters.clear();
  await db.storyLocations.clear();
  await db.storyLoreEntries.clear();
  await db.storyTimelineEvents.clear();
});

describe("storyBibleService — Thư Viện Truyện", () => {
  it("tạo nhân vật, cập nhật cảnh giới và đọc lại đúng thứ tự", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    const a = await createCharacter(project.id, "Vân Thanh");
    await createCharacter(project.id, "Bạch Vũ");
    await updateCharacter(a.id, { realm: "Trúc Cơ kỳ" });

    const characters = await listCharacters(project.id);
    expect(characters.map((c) => c.name)).toEqual(["Vân Thanh", "Bạch Vũ"]);
    expect(characters[0].realm).toBe("Trúc Cơ kỳ");
  });

  it("xóa nhân vật (soft delete) không còn xuất hiện trong danh sách", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    const a = await createCharacter(project.id, "Sẽ xóa");
    await deleteCharacter(a.id);
    expect(await listCharacters(project.id)).toHaveLength(0);
  });

  it("tạo nhân vật mới sau khi xóa không trùng order", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    await createCharacter(project.id, "A");
    const b = await createCharacter(project.id, "B");
    await createCharacter(project.id, "C");
    await deleteCharacter(b.id);
    await createCharacter(project.id, "D");
    const rows = await listCharacters(project.id);
    expect(rows.map((item) => item.order)).toEqual([0, 2, 3]);
    expect(new Set(rows.map((item) => item.order)).size).toBe(rows.length);
  });

  it("tạo địa danh/cảnh giới/thế lực với đúng loại", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    await createLocation(project.id, "Thanh Vân Tông", "faction");
    await createLocation(project.id, "Kim Đan kỳ", "realm");
    const locations = await listLocations(project.id);
    expect(locations.map((l) => l.kind)).toEqual(["faction", "realm"]);
  });

  it("tạo và liệt kê từ điển thuật ngữ", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    await createLoreEntry(project.id, "Kim Đan");
    const entries = await listLoreEntries(project.id);
    expect(entries[0].term).toBe("Kim Đan");
  });

  it("tạo sự kiện dòng thời gian và liên kết chương", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    const ev = await createTimelineEvent(project.id, "Nhập môn");
    await updateTimelineEvent(ev.id, { chapterId: "chapter-1", summary: "Nhân vật chính bái sư." });
    const events = await listTimelineEvents(project.id);
    expect(events[0].chapterId).toBe("chapter-1");
    expect(events[0].summary).toBe("Nhân vật chính bái sư.");
  });

  it("xuất Markdown Thư Viện Truyện gồm đủ nhân vật, thế giới, từ điển, dòng thời gian", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    await createCharacter(project.id, "Vân Thanh");
    await createLocation(project.id, "Thanh Vân Tông", "faction");
    await createLoreEntry(project.id, "Kim Đan");
    await createTimelineEvent(project.id, "Nhập môn");

    const md = await exportStoryBibleMarkdown(project.id);
    expect(md).toContain("Vân Thanh");
    expect(md).toContain("Thanh Vân Tông");
    expect(md).toContain("Kim Đan");
    expect(md).toContain("Nhập môn");
  });
});
