import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icons";
import { DEFAULT_IMAGE_TRANSFORM, normalizeImageTransform, type ImageTransform } from "../../features/appearance/imageTypes";
import { AdjustedImage } from "./AdjustedImage";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function ImageAdjustDialog({
  open,
  sourceUrl,
  title,
  aspectRatio = "16 / 9",
  initialTransform,
  showOpacity = true,
  onCancel,
  onSave,
}: {
  open: boolean;
  sourceUrl: string | null;
  title: string;
  aspectRatio?: string;
  initialTransform?: Partial<ImageTransform> | null;
  showOpacity?: boolean;
  onCancel: () => void;
  onSave: (transform: ImageTransform) => void | Promise<void>;
}) {
  const [value, setValue] = useState<ImageTransform>(() => normalizeImageTransform(initialTransform));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (open) {
      setValue(normalizeImageTransform(initialTransform));
      setSaveError("");
    }
  }, [initialTransform, open, sourceUrl]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const helper = useMemo(() => value.fitMode === "manual" ? "Kéo trực tiếp trên ảnh để căn vị trí." : value.fitMode === "contain" ? "Hiện toàn bộ ảnh; có thể còn khoảng trống trong khung." : "Ảnh tự phủ kín khung và không bị méo.", [value.fitMode]);
  if (!open || !sourceUrl || typeof document === "undefined") return null;

  const update = (patch: Partial<ImageTransform>) => setValue((current) => normalizeImageTransform({ ...current, ...patch }));

  const flushPendingDrag = () => {
    frameRef.current = null;
    const next = pendingDragRef.current;
    if (!next) return;
    pendingDragRef.current = null;
    update(next);
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (value.fitMode !== "manual") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: value.offsetX, offsetY: value.offsetY };
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const box = previewRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !box) return;
    event.preventDefault();
    const dx = ((event.clientX - drag.x) / Math.max(box.width, 1)) * 100;
    const dy = ((event.clientY - drag.y) / Math.max(box.height, 1)) * 100;
    pendingDragRef.current = {
      offsetX: clamp(drag.offsetX - dx, 0, 100),
      offsetY: clamp(drag.offsetY - dy, 0, 100),
    };
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(flushPendingDrag);
  };

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const pending = pendingDragRef.current;
    pendingDragRef.current = null;
    if (pending) update(pending);
  };

  const dialog = (
    <div className="image-adjust-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="image-adjust-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="image-adjust-heading"><div><small>CHỈNH ẢNH</small><h2>{title}</h2></div><button type="button" onClick={onCancel} aria-label="Đóng"><Icon name="close" /></button></header>
        <div
          ref={previewRef}
          className={`image-adjust-preview ${value.fitMode === "manual" ? "is-draggable" : ""}`}
          style={{ aspectRatio }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        >
          <AdjustedImage src={sourceUrl} transform={value} alt="Xem trước ảnh" />
          <span className="image-adjust-frame" aria-hidden="true" />
        </div>
        <p className="image-adjust-help">{helper}</p>

        <div className="image-adjust-fit" role="group" aria-label="Cách khớp ảnh">
          {([["cover", "Phủ kín"], ["contain", "Toàn ảnh"], ["manual", "Tự căn"]] as const).map(([id, label]) => <button type="button" key={id} className={value.fitMode === id ? "is-active" : ""} onClick={() => update({ fitMode: id, zoom: id === "manual" ? Math.max(1, value.zoom) : 1 })}>{label}</button>)}
        </div>

        <div className="image-adjust-controls">
          <label><span>Phóng to <b>{value.zoom.toFixed(2)}×</b></span><input type="range" min="1" max="4" step="0.01" value={Math.max(1, value.zoom)} disabled={value.fitMode !== "manual"} onChange={(event) => update({ zoom: Number(event.target.value) })} /></label>
          <label><span>Ngang <b>{Math.round(value.offsetX)}%</b></span><input type="range" min="0" max="100" step="1" value={value.offsetX} onChange={(event) => update({ offsetX: Number(event.target.value) })} /></label>
          <label><span>Dọc <b>{Math.round(value.offsetY)}%</b></span><input type="range" min="0" max="100" step="1" value={value.offsetY} onChange={(event) => update({ offsetY: Number(event.target.value) })} /></label>
          <label><span>Nét / mờ <b>{value.blur.toFixed(1)} px</b></span><input type="range" min="0" max="18" step="0.5" value={value.blur} onChange={(event) => update({ blur: Number(event.target.value) })} /></label>
          {showOpacity && <label><span>Độ hiện <b>{Math.round(value.opacity * 100)}%</b></span><input type="range" min="0.15" max="1" step="0.05" value={value.opacity} onChange={(event) => update({ opacity: Number(event.target.value) })} /></label>}
        </div>

        <div className="image-adjust-quick"><button type="button" onClick={() => update({ blur: 0 })}>Ảnh nét</button><button type="button" onClick={() => update({ blur: 6 })}>Ảnh mờ</button><button type="button" onClick={() => setValue({ ...DEFAULT_IMAGE_TRANSFORM, opacity: showOpacity ? 1 : value.opacity })}><Icon name="refresh" size={15} /> Đặt lại</button></div>
        {saveError && <p className="image-adjust-save-error" role="alert">{saveError}</p>}
        <footer className="image-adjust-actions"><button type="button" onClick={onCancel}>Hủy</button><button type="button" className="primary" disabled={saving} onClick={() => {
          setSaving(true);
          setSaveError("");
          void Promise.resolve().then(() => onSave(value)).catch((error) => {
            setSaveError(error instanceof Error ? error.message : "Không thể lưu ảnh.");
          }).finally(() => setSaving(false));
        }}>{saving ? "Đang lưu…" : "Lưu căn chỉnh"}</button></footer>
      </section>
    </div>
  );

  // Portal tách trình chỉnh ảnh khỏi modal Tàng Thư/Cài đặt phía dưới,
  // tránh việc chọn ảnh làm thay đổi scroll/focus của khung cha trên iOS.
  return createPortal(dialog, document.body);
}
