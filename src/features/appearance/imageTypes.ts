export type ImageFitMode = "cover" | "contain" | "manual";

export interface ImageTransform {
  fitMode: ImageFitMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
}

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  fitMode: "cover",
  zoom: 1,
  offsetX: 50,
  offsetY: 50,
  blur: 0,
  opacity: 1,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function normalizeImageTransform(value?: Partial<ImageTransform> | null): ImageTransform {
  const fitMode: ImageFitMode = value?.fitMode === "contain" || value?.fitMode === "manual" ? value.fitMode : "cover";
  return {
    fitMode,
    zoom: clamp(value?.zoom ?? 1, fitMode === "manual" ? 1 : 0.5, 4),
    offsetX: clamp(value?.offsetX ?? 50, 0, 100),
    offsetY: clamp(value?.offsetY ?? 50, 0, 100),
    blur: clamp(value?.blur ?? 0, 0, 18),
    opacity: clamp(value?.opacity ?? 1, 0.15, 1),
  };
}
