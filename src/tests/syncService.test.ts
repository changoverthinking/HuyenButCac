import { describe, expect, it } from "vitest";
import { shouldPullRemote, SYNC_TABLES } from "../features/sync/syncService";

describe("sync conflict resolution", () => {
  it("pulls a missing local record", () => expect(shouldPullRemote(undefined)).toBe(true));
  it("keeps an unsynced local record", () => expect(shouldPullRemote("pending")).toBe(false));
  it("keeps a newly-created local record", () => expect(shouldPullRemote("local")).toBe(false));
  it("refreshes an already-synced record", () => expect(shouldPullRemote("synced")).toBe(true));
});

describe("story codex sync coverage", () => {
  it("đồng bộ đủ bốn bảng Thư Viện Truyện", () => {
    expect(SYNC_TABLES).toEqual(expect.arrayContaining([
      "storyCharacters", "storyLocations", "storyLoreEntries", "storyTimelineEvents",
    ]));
  });
});
