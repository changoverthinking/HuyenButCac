import type { CSSProperties, ReactNode } from "react";
import { useAppearanceStore } from "../../stores/appearanceStore";
import type { AppearanceTarget } from "../../features/appearance/appearanceService";
import { normalizeImageTransform, type ImageTransform } from "../../features/appearance/imageTypes";

export function adjustedImageStyle(transform?: Partial<ImageTransform> | null): CSSProperties {
  const value = normalizeImageTransform(transform);
  const manual = value.fitMode === "manual";
  return {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: value.fitMode === "contain" ? "contain" : "cover",
    objectPosition: `${value.offsetX}% ${value.offsetY}%`,
    transform: manual ? `scale(${value.zoom})` : "none",
    // Giữ tâm scale cố định. Trước đây transformOrigin chạy theo offsetX/offsetY,
    // nên khi người dùng vừa kéo ảnh vừa zoom thì điểm neo cũng di chuyển và ảnh bị giật/nhảy.
    transformOrigin: "50% 50%",
    filter: value.blur > 0 ? `blur(${value.blur}px)` : undefined,
    opacity: value.opacity,
    userSelect: "none",
    pointerEvents: "none",
  };
}

export function AdjustedImage({ src, transform, alt = "", className }: { src: string; transform?: Partial<ImageTransform> | null; alt?: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={adjustedImageStyle(transform)}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
    />
  );
}

export function AppearanceLayer({ target, className = "" }: { target: AppearanceTarget; className?: string }) {
  const url = useAppearanceStore((state) => state.urls[target]);
  const asset = useAppearanceStore((state) => state.assets[target]);
  if (!url || !asset) return null;
  return <div className={`appearance-layer ${className}`} aria-hidden="true"><AdjustedImage src={url} transform={asset.transform} /></div>;
}

export function AppearanceIcon({ target, fallback, className = "", alt = "" }: { target: AppearanceTarget; fallback: ReactNode; className?: string; alt?: string }) {
  const url = useAppearanceStore((state) => state.urls[target]);
  const asset = useAppearanceStore((state) => state.assets[target]);
  return (
    <span className={`appearance-icon ${className}`} aria-hidden={alt ? undefined : true}>
      {url && asset ? <AdjustedImage src={url} transform={asset.transform} alt={alt} /> : fallback}
    </span>
  );
}
