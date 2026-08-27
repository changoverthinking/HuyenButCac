import { describe, expect, it } from "vitest";
import { shouldPullRemote } from "../features/sync/syncService";

describe("sync conflict resolution", () => {
  it("pulls a missing local record", () => expect(shouldPullRemote(undefined, 10)).toBe(true));
  it("keeps a newer local record", () => expect(shouldPullRemote(20, 10)).toBe(false));
  it("pulls a newer remote record", () => expect(shouldPullRemote(10, 20)).toBe(true));
  it("keeps local when timestamps are equal", () => expect(shouldPullRemote(20, 20)).toBe(false));
});
