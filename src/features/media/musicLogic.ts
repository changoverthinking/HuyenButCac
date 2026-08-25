export type RepeatMode = "off" | "all" | "one";

export function normalizeVolume(raw: string | null): number {
  const value = Number(raw ?? 0.75);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.75;
}

export function cycleRepeatMode(value: RepeatMode): RepeatMode {
  return value === "off" ? "all" : value === "all" ? "one" : "off";
}

export function nextTrackIndex(params: {
  length: number;
  currentIndex: number;
  direction: 1 | -1;
  shuffle: boolean;
  repeat: RepeatMode;
  fromEnded?: boolean;
  random?: number;
}): number | null {
  const { length, currentIndex, direction, shuffle, repeat, fromEnded = false, random = Math.random() } = params;
  if (length <= 0) return null;
  if (fromEnded && repeat === "one") return Math.max(0, currentIndex);
  if (shuffle && length > 1) {
    let index = Math.min(length - 1, Math.floor(random * length));
    if (index === currentIndex) index = (index + 1) % length;
    return index;
  }
  const next = currentIndex + direction;
  if (next < 0) return length - 1;
  if (next >= length) return fromEnded && repeat === "off" ? null : 0;
  return next;
}
