import { create } from "zustand";
import { db } from "../database/db";
import type { ThemeId, ThemePreference } from "../types/entities";
import { clearCustomBackground, getCustomBackground, saveCustomBackground } from "../features/media/mediaService";

const THEME_PREF_ID = "singleton";

export const THEME_LIST: { id: ThemeId; label: string; colors: [string,string,string] }[] = [
  { id: "mac-van-tien-canh", label: "Mặc Vân Tiên Cảnh", colors:["#0b1418","#4fd1c5","#d2b071"] },
  { id: "xich-viem-ma-ton", label: "Xích Viêm Ma Tôn", colors:["#150c0c","#c23b2e","#d9a441"] },
  { id: "thanh-truc-co-phong", label: "Thanh Trúc Cổ Phong", colors:["#f7f4ea","#4a7c59","#9a7641"] },
  { id: "tu-van-thien-cung", label: "Tử Vân Thiên Cung", colors:["#120f1e","#9d7fe8","#d4c6ff"] },
  { id: "kim-cac-thien-thu", label: "Kim Các Thiên Thư", colors:["#1a140c","#d4a63c","#a82828"] },
  { id: "thuy-mac-son-ha", label: "Thủy Mặc Sơn Hà", colors:["#f4f4f2","#3a5a6b","#181b1d"] },
  { id: "bach-nguyet-han-cung", label: "Bạch Nguyệt Hàn Cung", colors:["#08131f","#7cc9ed","#dcefff"] },
  { id: "dao-hoa-mong-canh", label: "Đào Hoa Mộng Cảnh", colors:["#21131b","#df789e","#f5c4cf"] },
  { id: "cuu-u-huyen-da", label: "Cửu U Huyền Dạ", colors:["#080a11","#34b5a6","#8468c9"] },
  { id: "thien-thanh-luu-ly", label: "Thiên Thanh Lưu Ly", colors:["#eaf7f8","#218fa5","#72d1c6"] },
  { id: "hoang-hon-co-thanh", label: "Hoàng Hôn Cổ Thành", colors:["#1d120f","#d07b3e","#e5bd70"] },
  { id: "ngoc-son-van-hai", label: "Ngọc Sơn Vân Hải", colors:["#eef5ef","#3e8872","#b89558"] },
  { id: "huyet-nguyet-ma-canh", label: "Huyết Nguyệt Ma Cảnh", colors:["#160a13","#d1465b","#8d4dc2"] },
  { id: "tinh-ha-van-tuong", label: "Tinh Hà Vạn Tượng", colors:["#080d22","#657edb","#e0bb69"] },
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
