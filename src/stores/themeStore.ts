import { create } from "zustand";
import { db } from "../database/db";
import type { ThemeId, ThemePreference } from "../types/entities";
import { clearCustomBackground, getCustomBackground, saveCustomBackground } from "../features/media/mediaService";

const THEME_PREF_ID = "singleton";

export const THEME_LIST: { id: ThemeId; label: string }[] = [
  { id: "mac-van-tien-canh", label: "Mặc Vân Tiên Cảnh" },
  { id: "xich-viem-ma-ton", label: "Xích Viêm Ma Tôn" },
  { id: "thanh-truc-co-phong", label: "Thanh Trúc Cổ Phong" },
  { id: "tu-van-thien-cung", label: "Tử Vân Thiên Cung" },
  { id: "kim-cac-thien-thu", label: "Kim Các Thiên Thư" },
  { id: "thuy-mac-son-ha", label: "Thủy Mặc Sơn Hà" },
];

interface ThemeState {
  themeId: ThemeId;
  followSystem: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  fontScale: number;
  backgroundUrl: string | null;
  load: () => Promise<void>;
  setTheme: (id: ThemeId) => Promise<void>;
  toggle: (key: "followSystem" | "reduceMotion" | "highContrast") => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
  setCustomBackground: (file: File) => Promise<void>;
  clearCustomBackground: () => Promise<void>;
}

let activeBackgroundUrl: string | null = null;
function applyBackground(blob?: Blob) {
  if (activeBackgroundUrl) URL.revokeObjectURL(activeBackgroundUrl);
  activeBackgroundUrl = blob ? URL.createObjectURL(blob) : null;
  document.documentElement.style.setProperty("--custom-background", activeBackgroundUrl ? `url("${activeBackgroundUrl}")` : "none");
  return activeBackgroundUrl;
}

function applyToDom(state: Pick<ThemeState, "themeId" | "reduceMotion" | "highContrast" | "fontScale">) {
  const root = document.documentElement;
  root.setAttribute("data-theme", state.themeId);
  root.setAttribute("data-reduce-motion", String(state.reduceMotion));
  root.setAttribute("data-high-contrast", String(state.highContrast));
  root.style.setProperty("--font-scale", String(state.fontScale));
}

async function persist(patch: Partial<ThemePreference>) {
  const now = Date.now();
  const existing = await db.themePreferences.get(THEME_PREF_ID);
  const next: ThemePreference = {
    id: THEME_PREF_ID,
    themeId: "mac-van-tien-canh",
    followSystem: false,
    reduceMotion: false,
    highContrast: false,
    fontScale: 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
    syncState: "local",
    ...existing,
    ...patch,
  };
  await db.themePreferences.put(next);
  return next;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: "mac-van-tien-canh",
  followSystem: false,
  reduceMotion: false,
  highContrast: false,
  fontScale: 1,
  backgroundUrl: null,

  load: async () => {
    const pref = await db.themePreferences.get(THEME_PREF_ID);
    const state = pref ?? (await persist({}));
    const background = await getCustomBackground();
    const backgroundUrl = applyBackground(background?.imageBlob);
    set({ ...state, backgroundUrl });
    applyToDom(state);
  },

  setTheme: async (id) => {
    const state = await persist({ themeId: id });
    set(state);
    applyToDom(state);
  },

  toggle: async (key) => {
    set((prev) => {
      persist({ [key]: !prev[key] }).then(applyToDom);
      return { [key]: !prev[key] } as Partial<ThemeState>;
    });
  },

  setFontScale: async (scale) => {
    const state = await persist({ fontScale: scale });
    set(state);
    applyToDom(state);
  },

  setCustomBackground: async (file) => {
    const item = await saveCustomBackground(file);
    const backgroundUrl = applyBackground(item.imageBlob);
    set({ backgroundUrl });
  },

  clearCustomBackground: async () => {
    await clearCustomBackground();
    const backgroundUrl = applyBackground();
    set({ backgroundUrl });
  },
}));
