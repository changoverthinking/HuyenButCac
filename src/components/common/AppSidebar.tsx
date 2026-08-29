import { APP_CONFIG } from "../../app/appConfig";

export type AppSidebarItem = { id: string; label: string; icon: string; ready: boolean };

/**
 * Sidebar điều hướng cấp ứng dụng, cố định bên trái trên desktop (md+).
 * Thay thế thanh tab ngang cũ, theo đúng cấu trúc bản thiết kế tham chiếu
 * ("Mystic Brush Pavilion"): logo + nhãn ứng dụng, danh sách điều hướng,
 * nút thu gọn. Chỉ hiển thị trên desktop — trên mobile vẫn dùng
 * mobile-topbar + drawer + bottom nav như hiện có (không đổi).
 */
export function AppSidebar<T extends string>({
  items,
  activeId,
  onSelect,
  collapsed,
  onToggleCollapsed,
}: {
  items: AppSidebarItem[];
  activeId: T;
  onSelect: (id: T) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <aside
      className="app-sidebar hidden md:flex h-full shrink-0 flex-col border-r"
      style={{
        width: collapsed ? 62 : 230,
        borderColor: "var(--color-border)",
        background: "linear-gradient(180deg, var(--color-surface), var(--color-bg))",
        transition: "width .3s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        className="flex items-center gap-3 border-b shrink-0"
        style={{ padding: collapsed ? "1.1rem .6rem" : "1.1rem 1.1rem", borderColor: "var(--color-border)" }}
      >
        <span className="brand-sigil small shrink-0">玄</span>
        {!collapsed && (
          <div className="min-w-0">
            <div
              className="truncate text-sm font-bold"
              style={{ color: "var(--color-accent-gold-pale, var(--color-accent))", fontFamily: "var(--font-display)", letterSpacing: ".02em" }}
            >
              {APP_CONFIG.appNameVi}
            </div>
            <div className="text-[10px] truncate" style={{ color: "var(--color-accent)", letterSpacing: ".16em", opacity: 0.85 }}>
              VÂN THƯ ĐÀI
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Điều hướng chính">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id as T)}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className="app-sidebar-item w-full flex items-center gap-3 text-sm"
              style={{
                padding: collapsed ? ".72rem 0" : ".72rem 1.1rem",
                justifyContent: collapsed ? "center" : "flex-start",
                borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                background: active ? "linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent)" : "transparent",
                color: active ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
            >
              <span className="shrink-0" style={{ fontSize: "1.05rem", lineHeight: 1 }}>{item.icon}</span>
              {!collapsed && (
                <span className="truncate" style={{ fontWeight: active ? 600 : 400 }}>
                  {item.label}
                  {!item.ready && <span className="ml-1 text-[10px] opacity-60">(sắp có)</span>}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        className="app-sidebar-collapse-btn shrink-0 text-xs"
        style={{
          margin: "0 .75rem .9rem",
          padding: ".5rem 0",
          borderRadius: "var(--radius-base)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
          background: "transparent",
        }}
      >
        {collapsed ? "▶" : "◀ Thu gọn"}
      </button>
    </aside>
  );
}
