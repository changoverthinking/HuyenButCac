import { create } from "zustand";
import {
  listAppearanceAssets,
  removeAppearanceAsset,
  saveAppearanceAsset,
  updateAppearanceTransform,
  type AppearanceAsset,
  type AppearanceTarget,
} from "../features/appearance/appearanceService";
import type { ImageTransform } from "../features/appearance/imageTypes";

type AssetMap = Partial<Record<AppearanceTarget, AppearanceAsset>>;
type UrlMap = Partial<Record<AppearanceTarget, string>>;

interface AppearanceState {
  assets: AssetMap;
  urls: UrlMap;
  loaded: boolean;
  load: () => Promise<void>;
  setImage: (target: AppearanceTarget, file: File, transform: ImageTransform) => Promise<void>;
  setTransform: (target: AppearanceTarget, transform: ImageTransform) => Promise<void>;
  clearImage: (target: AppearanceTarget) => Promise<void>;
}

const objectUrls = new Map<AppearanceTarget, string>();

function replaceObjectUrls(assets: AssetMap) {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
  objectUrls.clear();
  const urls: UrlMap = {};
  for (const [target, asset] of Object.entries(assets) as [AppearanceTarget, AppearanceAsset][]) {
    const url = URL.createObjectURL(asset.imageBlob);
    objectUrls.set(target, url);
    urls[target] = url;
  }
  return urls;
}

function toAssetMap(items: AppearanceAsset[]) {
  const next: AssetMap = {};
  for (const item of items) next[item.target] = item;
  return next;
}

export const useAppearanceStore = create<AppearanceState>((set, get) => ({
  assets: {},
  urls: {},
  loaded: false,

  load: async () => {
    const assets = toAssetMap(await listAppearanceAssets());
    set({ assets, urls: replaceObjectUrls(assets), loaded: true });
  },

  setImage: async (target, file, transform) => {
    const asset = await saveAppearanceAsset(target, file, transform);
    const assets = { ...get().assets, [target]: asset };
    set({ assets, urls: replaceObjectUrls(assets), loaded: true });
  },

  setTransform: async (target, transform) => {
    const asset = await updateAppearanceTransform(target, transform);
    set({ assets: { ...get().assets, [target]: asset } });
  },

  clearImage: async (target) => {
    await removeAppearanceAsset(target);
    const assets = { ...get().assets };
    delete assets[target];
    set({ assets, urls: replaceObjectUrls(assets), loaded: true });
  },
}));
