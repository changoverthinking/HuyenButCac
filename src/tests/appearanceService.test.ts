import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { switchWorkspace } from "../database/db";
import {
  getAppearanceAsset,
  saveAppearanceAsset,
} from "../features/appearance/appearanceService";
import { DEFAULT_IMAGE_TRANSFORM } from "../features/appearance/imageTypes";

const databasesToDelete: string[] = [];

function appearanceDbName(userId: string) {
  return `huyen-but-cac-appearance-v1-${encodeURIComponent(userId)}`;
}

afterEach(async () => {
  await switchWorkspace(null);
  for (const name of databasesToDelete.splice(0)) await Dexie.delete(name);
  localStorage.removeItem("hbc-legacy-workspace-migrated-to");
});

describe("Ảnh giao diện theo workspace", () => {
  it("không làm lộ avatar/nền của tài khoản A sang tài khoản B", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const suffix = `${Date.now()}-${Math.random()}`;
    const userA = `appearance-A-${suffix}`;
    const userB = `appearance-B-${suffix}`;
    databasesToDelete.push(
      `huyen-but-cac-workspace-${userA}`,
      `huyen-but-cac-workspace-${userB}`,
      appearanceDbName(userA),
      appearanceDbName(userB),
    );

    await switchWorkspace(userA);
    const avatar = new File(["avatar-a"], "avatar-a.png", { type: "image/png" });
    await saveAppearanceAsset("tieu-nhi-avatar", avatar, DEFAULT_IMAGE_TRANSFORM);
    expect((await getAppearanceAsset("tieu-nhi-avatar"))?.fileName).toBe("avatar-a.png");

    await switchWorkspace(userB);
    expect(await getAppearanceAsset("tieu-nhi-avatar")).toBeUndefined();

    await switchWorkspace(userA);
    expect((await getAppearanceAsset("tieu-nhi-avatar"))?.fileName).toBe("avatar-a.png");
  });
});
