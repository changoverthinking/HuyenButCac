import { useEffect, useMemo, useState } from "react";
import { Icon } from "../common/Icons";
import { ImageAdjustDialog } from "../common/ImageAdjustDialog";
import { AdjustedImage } from "../common/AdjustedImage";
import { useThemeStore, THEME_LIST } from "../../stores/themeStore";
import { useAppearanceStore } from "../../stores/appearanceStore";
import type { AppearanceTarget } from "../../features/appearance/appearanceService";
import { DEFAULT_IMAGE_TRANSFORM, type ImageTransform } from "../../features/appearance/imageTypes";

const TARGETS: Array<{ target: AppearanceTarget; label: string; description: string; aspectRatio: string; avatar?: boolean; showOpacity?: boolean }> = [
  { target: "app-background", label: "Nền chung toàn ứng dụng", description: "Hiển thị phía sau các khu vực làm việc.", aspectRatio: "16 / 9" },
  { target: "notes", label: "Tab Ghi chú", description: "Ảnh riêng cho Trúc Giản.", aspectRatio: "16 / 9" },
  { target: "library", label: "Tab Tàng Thư", description: "Ảnh riêng cho Vạn Quyển.", aspectRatio: "16 / 9" },
  { target: "projects", label: "Tab Dự án", description: "Ảnh riêng cho Xưởng bản thảo.", aspectRatio: "16 / 9" },
  { target: "mindmap", label: "Tab Sơ đồ", description: "Ảnh riêng cho Linh Đồ.", aspectRatio: "16 / 9" },
  { target: "whiteboard", label: "Tab Bảng trắng", description: "Ảnh riêng cho Bạch Đài.", aspectRatio: "16 / 9" },
  { target: "calendar", label: "Tab Vạn niên", description: "Ảnh riêng cho Nhật Nguyệt Đồ.", aspectRatio: "16 / 9" },
  { target: "tools", label: "Tab / thanh Công cụ", description: "Áp dụng cho thanh điều hướng và drawer công cụ.", aspectRatio: "3 / 5" },
  { target: "account", label: "Tài khoản · Cài đặt", description: "Ảnh nền riêng cho Tàng Thư Mật Cảnh.", aspectRatio: "4 / 5" },
  { target: "tieu-nhi", label: "Khung Tiểu Nhị", description: "Ảnh nền riêng cho bảng chat Tiểu Nhị.", aspectRatio: "3 / 5" },
  { target: "tieu-nhi-avatar", label: "Icon / avatar Tiểu Nhị", description: "Thay hoàn toàn biểu tượng chữ Nhị.", aspectRatio: "1 / 1", avatar: true, showOpacity: false },
];

type EditorState = {
  target: AppearanceTarget;
  sourceUrl: string;
  file: File | null;
  transform: ImageTransform;
  title: string;
  aspectRatio: string;
  showOpacity: boolean;
};

function fileUrl(file: File) {
  return URL.createObjectURL(file);
}

export function AppearanceSettings() {
  const themeId = useThemeStore((state) => state.themeId);
  const setTheme = useThemeStore((state) => state.setTheme);
  const reduceMotion = useThemeStore((state) => state.reduceMotion);
  const highContrast = useThemeStore((state) => state.highContrast);
  const fontScale = useThemeStore((state) => state.fontScale);
  const toggleThemeOption = useThemeStore((state) => state.toggle);
  const setFontScale = useThemeStore((state) => state.setFontScale);
  const legacyBackgroundUrl = useThemeStore((state) => state.backgroundUrl);
  const clearLegacyBackground = useThemeStore((state) => state.clearCustomBackground);

  const assets = useAppearanceStore((state) => state.assets);
  const urls = useAppearanceStore((state) => state.urls);
  const loadAppearance = useAppearanceStore((state) => state.load);
  const setImage = useAppearanceStore((state) => state.setImage);
  const setTransform = useAppearanceStore((state) => state.setTransform);
  const clearImage = useAppearanceStore((state) => state.clearImage);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => { void loadAppearance(); }, [loadAppearance]);
  useEffect(() => () => { if (editor?.file) URL.revokeObjectURL(editor.sourceUrl); }, [editor]);

  const selectedTheme = useMemo(() => THEME_LIST.find((item) => item.id === themeId), [themeId]);

  const openFile = (target: AppearanceTarget, file: File, meta: typeof TARGETS[number]) => {
    const previous = assets[target]?.transform ?? DEFAULT_IMAGE_TRANSFORM;
    setEditor({ target, file, sourceUrl: fileUrl(file), transform: previous, title: `Căn ảnh — ${meta.label}`, aspectRatio: meta.aspectRatio, showOpacity: meta.showOpacity !== false });
  };

  const openExisting = (target: AppearanceTarget, meta: typeof TARGETS[number]) => {
    const sourceUrl = urls[target];
    const asset = assets[target];
    if (!sourceUrl || !asset) return;
    setEditor({ target, file: null, sourceUrl, transform: asset.transform, title: `Căn ảnh — ${meta.label}`, aspectRatio: meta.aspectRatio, showOpacity: meta.showOpacity !== false });
  };

  const saveEditor = async (transform: ImageTransform) => {
    if (!editor) return;
    try {
      if (editor.file) {
        if (editor.target === "app-background" && legacyBackgroundUrl) await clearLegacyBackground();
        await setImage(editor.target, editor.file, transform);
      } else {
        await setTransform(editor.target, transform);
      }
      setMessage("Đã lưu ảnh và căn chỉnh.");
      setEditor(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu ảnh.");
    }
  };

  return (
    <div className="appearance-settings">
      <section className="appearance-settings-section">
        <h3>Giao diện</h3>
        <p>Toàn bộ chọn theme và ảnh nền được chuyển vào Cài đặt. Theme hiện tại: <b>{selectedTheme?.label ?? themeId}</b>.</p>
        <div className="appearance-theme-grid">
          {THEME_LIST.map((theme) => (
            <button type="button" key={theme.id} className={theme.id === themeId ? "is-active" : ""} onClick={() => void setTheme(theme.id)}>
              <span className="appearance-theme-swatches">{theme.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
              <span>{theme.label}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 text-sm"><span>Giảm chuyển động</span><input type="checkbox" checked={reduceMotion} onChange={() => void toggleThemeOption("reduceMotion")} /></label>
        <label className="flex items-center justify-between gap-3 text-sm"><span>Tương phản cao</span><input type="checkbox" checked={highContrast} onChange={() => void toggleThemeOption("highContrast")} /></label>
        <label className="grid gap-1 text-sm"><span>Cỡ chữ: {Math.round(fontScale * 100)}%</span><input type="range" min="0.85" max="1.35" step="0.05" value={fontScale} onChange={(event) => void setFontScale(Number(event.target.value))} /></label>
        {legacyBackgroundUrl && <div className="appearance-global-note">Ứng dụng còn một ảnh nền kiểu cũ. Khi chọn “Nền chung toàn ứng dụng” mới, nền cũ sẽ tự được xóa. <button type="button" className="underline" onClick={() => void clearLegacyBackground()}>Xóa nền cũ ngay</button>.</div>}
      </section>

      <section className="appearance-settings-section">
        <h3>Ảnh giao diện từng tab</h3>
        <p>Mỗi ảnh có thể để phủ kín, hiện toàn ảnh hoặc tự căn. Chế độ Tự căn cho phép kéo, phóng to, chỉnh vị trí và độ mờ.</p>
        <div className="appearance-target-list">
          {TARGETS.map((meta) => {
            const asset = assets[meta.target];
            const url = urls[meta.target];
            return (
              <div key={meta.target} className={`appearance-target-row ${meta.avatar ? "avatar" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="appearance-target-preview">{url && asset ? <AdjustedImage src={url} transform={asset.transform} alt="" /> : <span className="grid h-full place-items-center opacity-45"><Icon name={meta.avatar ? "spark" : "image"} size={18} /></span>}</div>
                  <div className="appearance-target-copy"><strong>{meta.label}</strong><small>{asset ? `${asset.fileName} · ${asset.transform.fitMode} · mờ ${asset.transform.blur}px` : meta.description}</small></div>
                </div>
                <div className="appearance-target-actions">
                  <label title="Chọn ảnh"><Icon name="image" size={16} /><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) openFile(meta.target, file, meta); event.currentTarget.value = ""; }} /></label>
                  <button type="button" title="Căn chỉnh" disabled={!asset} onClick={() => openExisting(meta.target, meta)}><Icon name="move" size={16} /></button>
                  <button type="button" title="Xóa ảnh" className="danger" disabled={!asset} onClick={() => void clearImage(meta.target)}><Icon name="trash" size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {message && <p className="rounded-lg border p-2 text-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>{message}</p>}
      {editor && <ImageAdjustDialog open sourceUrl={editor.sourceUrl} title={editor.title} aspectRatio={editor.aspectRatio} initialTransform={editor.transform} showOpacity={editor.showOpacity} onCancel={() => setEditor(null)} onSave={saveEditor} />}
    </div>
  );
}
