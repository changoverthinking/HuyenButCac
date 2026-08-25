import { useEffect, useRef, useState } from "react";
import type { Whiteboard, WhiteboardObject, WhiteboardObjectKind } from "../../types/entities";
import {
  addBoardObject, createWhiteboard, deleteBoardObject, deleteWhiteboard, getBoardObjects,
  listWhiteboards, renameWhiteboard, updateBoardObject,
} from "../../features/whiteboard/whiteboardService";

export function WhiteboardView() {
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);

  const reload = async (id = active) => {
    setBoards(await listWhiteboards());
    if (id) setObjects(await getBoardObjects(id));
  };

  useEffect(() => {
    void listWhiteboards().then(async (items) => {
      const next = items.length ? items : [await createWhiteboard()];
      setBoards(next);
      setActive(next[0].id);
      setObjects(await getBoardObjects(next[0].id));
    });
  }, []);

  const add = async (kind: WhiteboardObjectKind) => {
    if (!active) return;
    await addBoardObject(active, kind, 150 + objects.length * 25, 120 + objects.length * 20);
    await reload();
  };

  const removeActiveBoard = async () => {
    if (!active || !window.confirm("Xóa bảng trắng này và toàn bộ nội dung? Hành động này không thể hoàn tác.")) return;
    await deleteWhiteboard(active);
    let remaining=await listWhiteboards();
    if(!remaining.length) remaining=[await createWhiteboard()];
    setActive(remaining[0].id); setSelected(null); await reload(remaining[0].id);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="whiteboard-toolbar shrink-0 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex gap-2 p-2 min-w-0">
        <button className="shrink-0" onClick={async () => { const board = await createWhiteboard(); setActive(board.id); await reload(board.id); }}>＋ Bảng <span className="hidden sm:inline">({boards.length})</span></button>
        <select
          aria-label="Chọn bảng trắng"
          value={active ?? ""}
          onChange={(event) => { setActive(event.target.value); void reload(event.target.value); }}
          className="min-w-0 flex-1 rounded px-2 bg-transparent border"
          style={{ borderColor: "var(--color-border)" }}
        >
          {boards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}
        </select>
        <button className="shrink-0" aria-label="Đổi tên bảng" onClick={async()=>{if(!active)return;const current=boards.find((board)=>board.id===active);const title=window.prompt("Tên bảng trắng:",current?.title??"")?.trim();if(!title)return;await renameWhiteboard(active,title);await reload(active);}}>✎<span className="hidden md:inline"> Đổi tên</span></button>
        <button className="shrink-0" aria-label="Xóa bảng" style={{ color: "var(--color-error)" }} onClick={removeActiveBoard}>⌫<span className="hidden md:inline"> Xóa bảng</span></button>
        </div>
        <div className="flex items-center gap-2 px-2 pb-2 overflow-x-auto">
        {([{"kind":"note","label":"Ghi chú"},{"kind":"text","label":"Chữ"},{"kind":"rectangle","label":"Chữ nhật"},{"kind":"ellipse","label":"Elip"}] as {kind:WhiteboardObjectKind;label:string}[]).map(({kind,label}) => (
          <button key={kind} className="shrink-0 px-3 py-1.5 rounded" style={{ background: "var(--color-surface-alt)" }} onClick={() => void add(kind)}>＋ {label}</button>
        ))}
        <button disabled={!selected} onClick={async () => {
          if (!selected) return;
          await deleteBoardObject(selected); setSelected(null); await reload();
        }}>Xóa</button>
        <span className="ml-auto shrink-0 text-sm">{Math.round(zoom * 100)}%</span>
        </div>
      </header>
      <div
        className="flex-1 relative overflow-hidden touch-none"
        style={{ backgroundColor: "var(--color-canvas-bg)", backgroundImage: "radial-gradient(var(--color-border) 1px,transparent 1px)", backgroundSize: `${24 * zoom}px ${24 * zoom}px` }}
        onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.min(2.5, Math.max(0.35, value * (event.deltaY > 0 ? 0.9 : 1.1)))); }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) return;
          setObjects((items) => items.map((item) => item.id === current.id ? {
            ...item,
            x: current.startX + (event.clientX - current.startClientX) / zoom,
            y: current.startY + (event.clientY - current.startClientY) / zoom,
          } : item));
        }}
        onPointerUp={() => {
          const current = drag.current;
          const item = objects.find((entry) => entry.id === current?.id);
          if (item) void updateBoardObject(item.id, { x: item.x, y: item.y });
          drag.current = null;
        }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          {objects.map((item) => (
            <div
              key={item.id}
              onPointerDown={(event) => {
                setSelected(item.id);
                drag.current = { id: item.id, startClientX: event.clientX, startClientY: event.clientY, startX: item.x, startY: item.y };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              className="absolute shadow-md"
              style={{
                left: item.x, top: item.y, width: item.width, height: item.height,
                background: item.kind === "text" ? "transparent" : item.color,
                border: item.kind === "rectangle" || item.kind === "ellipse" ? "2px solid var(--color-text)" : "1px solid var(--color-border)",
                borderRadius: item.kind === "ellipse" ? "50%" : "10px",
                outline: selected === item.id ? "3px solid var(--color-focus)" : "none",
                color: item.kind === "note" ? "#241b10" : "var(--color-text)",
              }}
            >
              <div
                aria-label="Kéo đối tượng"
                className="h-7 px-2 flex items-center cursor-move select-none text-xs opacity-70"
              >
                ⋮⋮ Kéo
              </div>
              <textarea
                aria-label="Nội dung đối tượng"
                value={item.text}
                onPointerDown={(event) => { event.stopPropagation(); setSelected(item.id); }}
                onChange={(event) => setObjects((items) => items.map((entry) => entry.id === item.id ? { ...entry, text: event.target.value } : entry))}
                onBlur={(event) => void updateBoardObject(item.id, { text: event.target.value })}
                className="w-full resize-none bg-transparent outline-none px-3 pb-3"
                style={{ height: Math.max(20, item.height - 28) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
