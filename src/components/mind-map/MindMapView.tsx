import { useEffect, useRef, useState } from "react";
import type { CanvasStroke, MindMap, MindMapEdge, MindMapNode, Project } from "../../types/entities";
import {
  addMindMapEdge,
  addMindMapNode,
  createMindMap,
  createOrSyncProjectMap,
  deleteMindMap,
  deleteMindMapEdge,
  deleteMindMapNode,
  getMapGraph,
  getMindMapEdgeType,
  listMindMaps,
  renameMindMap,
  resolveNodeLink,
  updateMindMapNode,
} from "../../features/mind-map/mindMapService";
import { listProjects } from "../../features/projects/projectsService";
import { addStroke, deleteStroke, listStrokes, smoothPoints, strokeDash, strokePath, updateStroke } from "../../features/canvas/strokesService";

type DragState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startNodeX: number;
  startNodeY: number;
};
type Point = { x: number; y: number };

const ACTIVE_MAP_STORAGE_KEY = "hbc-active-mindmap-id";
const NODE_HANDLE_WIDTH = 38;
const nodeWidth = (title: string) => Math.min(320, Math.max(110, 40 + Array.from(title).length * 9));
const readStoredActiveMap = () => (typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_MAP_STORAGE_KEY));

function edgePath(edge: MindMapEdge, source: MindMapNode, target: MindMapNode) {
  const tree = getMindMapEdgeType(edge) === "tree";
  const sourceX = tree ? source.x + nodeWidth(source.title) : source.x + nodeWidth(source.title) / 2;
  const targetX = tree ? target.x : target.x + nodeWidth(target.title) / 2;
  const sourceY = source.y + 22;
  const targetY = target.y + 22;
  const direction = targetX >= sourceX ? 1 : -1;
  const bend = Math.max(45, Math.abs(targetX - sourceX) * 0.45);
  return `M${sourceX},${sourceY} C${sourceX + bend * direction},${sourceY} ${targetX - bend * direction},${targetY} ${targetX},${targetY}`;
}

export function MindMapView({ onOpenProject }: { onOpenProject: (target: { projectId: string; sectionId: string | null; chapterId: string | null }) => void }) {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [active, setActive] = useState<string | null>(() => readStoredActiveMap());
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [edges, setEdges] = useState<MindMapEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectChoice, setProjectChoice] = useState("");
  const [strokes, setStrokes] = useState<CanvasStroke[]>([]);
  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeDashStyle, setStrokeDashStyle] = useState<CanvasStroke["dash"]>("solid");
  const [strokeArrow, setStrokeArrow] = useState<CanvasStroke["arrow"]>("none");
  const [smooth, setSmooth] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const activeRef = useRef<string | null>(readStoredActiveMap());
  const reloadToken = useRef(0);
  const drag = useRef<DragState | null>(null);
  const canvasPan = useRef<{ pointerId: number; start: Point; pan: Point } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number; pan: Point; center: Point } | null>(null);
  const drawing = useRef<{ pointerId: number; points: Point[] } | null>(null);
  const strokeDrag = useRef<{ id: string; pointerId: number; start: Point; points: Point[] } | null>(null);
  const selectedNode = nodes.find((node) => node.id === selected) ?? null;
  const selectedEdgeItem = edges.find((edge) => edge.id === selectedEdge) ?? null;
  const connectSource = nodes.find((node) => node.id === connectSourceId) ?? null;

  const clampZoom = (value: number) => Math.min(2.5, Math.max(0.35, value));
  const setActiveMap = (id: string | null) => {
    activeRef.current = id;
    setActive(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(ACTIVE_MAP_STORAGE_KEY, id);
      else window.localStorage.removeItem(ACTIVE_MAP_STORAGE_KEY);
    }
  };

  const updatePinch = (element: SVGSVGElement) => {
    const points = [...pointers.current.values()];
    if (points.length < 2) {
      pinch.current = null;
      return;
    }
    const rect = element.getBoundingClientRect();
    const center = { x: (points[0].x + points[1].x) / 2 - rect.left, y: (points[0].y + points[1].y) / 2 - rect.top };
    const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    if (!pinch.current) {
      pinch.current = { distance, zoom, pan: { ...pan }, center };
      return;
    }
    const nextZoom = clampZoom(pinch.current.zoom * distance / Math.max(1, pinch.current.distance));
    const worldX = (pinch.current.center.x - pinch.current.pan.x) / pinch.current.zoom;
    const worldY = (pinch.current.center.y - pinch.current.pan.y) / pinch.current.zoom;
    setZoom(nextZoom);
    setPan({ x: center.x - worldX * nextZoom, y: center.y - worldY * nextZoom });
  };

  const zoomAt = (next: number, center: Point) => {
    const value = clampZoom(next);
    setPan((current) => ({ x: center.x - (center.x - current.x) * value / zoom, y: center.y - (center.y - current.y) * value / zoom }));
    setZoom(value);
  };
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const reload = async (requestedId?: string | null) => {
    const token = ++reloadToken.current;
    let items = await listMindMaps();
    if (!items.length) items = [(await createMindMap()).map];
    const preferred = requestedId ?? activeRef.current ?? readStoredActiveMap();
    const nextId = preferred && items.some((item) => item.id === preferred) ? preferred : items[0]?.id ?? null;
    if (token !== reloadToken.current) return;
    setMaps(items);
    if (!nextId) {
      setActiveMap(null);
      setNodes([]);
      setEdges([]);
      setStrokes([]);
      return;
    }
    setActiveMap(nextId);
    setProjectChoice(items.find((item) => item.id === nextId)?.projectId ?? "");
    const [graph, mapStrokes] = await Promise.all([getMapGraph(nextId), listStrokes("mindmap", nextId)]);
    if (token !== reloadToken.current || activeRef.current !== nextId) return;
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setStrokes(mapStrokes);
    setSelected((current) => (current && graph.nodes.some((node) => node.id === current) ? current : null));
    setSelectedEdge((current) => (current && graph.edges.some((edge) => edge.id === current) ? current : null));
    setConnectSourceId((current) => (current && graph.nodes.some((node) => node.id === current) ? current : null));
  };

  useEffect(() => {
    let disposed = false;
    const initialise = async () => {
      const items = await listProjects();
      if (!disposed) setProjects(items);
      await reload(readStoredActiveMap());
    };
    void initialise();

    const refreshAfterSync = () => {
      void listProjects().then((items) => {
        if (!disposed) setProjects(items);
      });
      // Giữ đúng sơ đồ đang mở thay vì lấy phần tử đầu tiên sau khi App đồng bộ/remount.
      void reload(readStoredActiveMap());
    };
    window.addEventListener("hbc-sync-complete", refreshAfterSync);
    return () => {
      disposed = true;
      window.removeEventListener("hbc-sync-complete", refreshAfterSync);
    };
  }, []);

  const selectMap = (id: string) => {
    setActiveMap(id);
    setSelected(null);
    setSelectedEdge(null);
    setConnectSourceId(null);
    void reload(id);
  };

  const addBranch = async () => {
    const mapId = activeRef.current;
    if (!mapId) return;
    const parent = nodes.find((node) => node.id === selected) ?? nodes.find((node) => node.parentId === null) ?? nodes[0];
    if (!parent) return;
    const created = await addMindMapNode(mapId, parent.id, "Nhánh mới", parent.x + 180, parent.y + (nodes.length % 5 - 2) * 70);
    await reload(mapId);
    setSelected(created.id);
  };

  const addFreeNode = async () => {
    const mapId = activeRef.current;
    if (!mapId) return;
    const index = nodes.length;
    const created = await addMindMapNode(mapId, null, "Ô tự do", 220 + (index % 4) * 160, 100 + (Math.floor(index / 4) % 5) * 100);
    await reload(mapId);
    setSelected(created.id);
  };

  const removeActiveMap = async () => {
    const mapId = activeRef.current;
    if (!mapId || !window.confirm("Xóa sơ đồ này và toàn bộ các nhánh? Hành động này không thể hoàn tác.")) return;
    await deleteMindMap(mapId);
    let remaining = await listMindMaps();
    if (!remaining.length) remaining = [(await createMindMap()).map];
    setSelected(null);
    setSelectedEdge(null);
    selectMap(remaining[0].id);
  };

  const renameActiveMap = async () => {
    const mapId = activeRef.current;
    if (!mapId) return;
    const current = maps.find((map) => map.id === mapId);
    const title = window.prompt("Tên sơ đồ:", current?.title ?? "")?.trim();
    if (!title) return;
    await renameMindMap(mapId, title);
    await reload(mapId);
  };

  const deleteSelectedNode = async () => {
    const mapId = activeRef.current;
    if (!selected || !mapId) return;
    try {
      await deleteMindMapNode(selected);
      setSelected(null);
      await reload(mapId);
    } catch (error) {
      window.alert((error as Error).message);
    }
  };

  const deleteSelectedEdge = async () => {
    const mapId = activeRef.current;
    if (!selectedEdge || !mapId) return;
    await deleteMindMapEdge(selectedEdge);
    setSelectedEdge(null);
    await reload(mapId);
  };

  const connectNodes = async (nodeId: string) => {
    const mapId = activeRef.current;
    if (!mapId) return;
    setSelected(nodeId);
    setSelectedEdge(null);
    const sourceId = connectSourceId;
    if (!sourceId) {
      setConnectSourceId(nodeId);
      return;
    }
    if (sourceId === nodeId) {
      setConnectSourceId(null);
      return;
    }
    try {
      const edge = await addMindMapEdge(mapId, sourceId, nodeId);
      setConnectSourceId(null);
      await reload(mapId);
      setSelectedEdge(edge.id);
    } catch (error) {
      setConnectSourceId(null);
      window.alert((error as Error).message);
    }
  };

  const finishDrag = () => {
    const current = drag.current;
    if (!current) return;
    const node = nodes.find((item) => item.id === current.id);
    if (node) void updateMindMapNode(node.id, { x: node.x, y: node.y });
    drag.current = null;
  };

  const worldPoint = (event: { clientX: number; clientY: number }, element: SVGSVGElement) => {
    const rect = element.getBoundingClientRect();
    return { x: (event.clientX - rect.left - pan.x) / zoom, y: (event.clientY - rect.top - pan.y) / zoom };
  };
  const finishDrawing = async () => {
    const current = drawing.current;
    drawing.current = null;
    const mapId = activeRef.current;
    if (!mapId || !current || current.points.length < 2) return;
    const points = smooth ? smoothPoints(current.points) : current.points;
    const created = await addStroke("mindmap", { ownerId: mapId, points, color: "#4fd1c5", width: strokeWidth, dash: strokeDashStyle, arrow: strokeArrow, smoothed: smooth, locked: false });
    setStrokes((items) => [...items, created]);
  };
  const openLinked = async () => {
    if (!selectedNode) return;
    const target = await resolveNodeLink(selectedNode);
    if (!target) {
      window.alert("Ô này chưa liên kết hoặc nội dung dự án đã bị xóa.");
      return;
    }
    onOpenProject(target);
  };

  const toggleConnectMode = () => {
    setConnectMode((value) => {
      const next = !value;
      if (next) setDrawMode(false);
      else setConnectSourceId(null);
      return next;
    });
    setSelectedEdge(null);
  };

  return (
    <div className="h-full min-h-0 flex flex-col md:flex-row">
      <div className="md:hidden shrink-0 border-b p-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex gap-2 min-w-0">
          <select aria-label="Chọn sơ đồ" className="min-w-0 flex-1 rounded border bg-transparent px-2 py-2" style={{ borderColor: "var(--color-border)" }} value={active ?? ""} onChange={(event) => selectMap(event.target.value)}>
            {maps.map((map) => <option key={map.id} value={map.id}>{map.title}</option>)}
          </select>
          <button aria-label="Tạo sơ đồ" className="mobile-icon-button" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} onClick={async () => { const created = await createMindMap(); selectMap(created.map.id); }}>＋</button>
          <button aria-label="Đổi tên sơ đồ" className="mobile-icon-button" style={{ background: "var(--color-surface-alt)" }} onClick={renameActiveMap}>✎</button>
          <button aria-label="Xóa sơ đồ" className="mobile-icon-button" style={{ background: "var(--color-surface-alt)", color: "var(--color-error)" }} onClick={removeActiveMap}>⌫</button>
        </div>
      </div>

      <aside className="hidden md:block w-56 shrink-0 border-r p-3 space-y-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <button className="w-full rounded p-2" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} onClick={async () => { const created = await createMindMap(); selectMap(created.map.id); }}>＋ Sơ đồ mới</button>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={!active} className="rounded p-2 text-sm" style={{ background: "var(--color-surface-alt)" }} onClick={renameActiveMap}>Đổi tên</button>
          <button disabled={!active} className="rounded p-2 text-sm" style={{ color: "var(--color-error)", background: "var(--color-surface-alt)" }} onClick={removeActiveMap}>Xóa sơ đồ</button>
        </div>
        {maps.map((map) => (
          <button className="w-full text-left p-2 rounded" style={{ background: active === map.id ? "var(--color-surface-alt)" : "transparent" }} onClick={() => selectMap(map.id)} key={map.id}>{map.title}</button>
        ))}
      </aside>

      <main className="flex-1 min-h-0 min-w-0 relative overflow-hidden" style={{ background: "var(--color-canvas-bg)" }}>
        <div className="canvas-toolbars absolute z-10 left-2 right-2 top-2 md:left-3 md:right-3 md:top-3 flex flex-col gap-2 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto pointer-events-auto">
            <button disabled={!selected} onClick={() => void deleteSelectedNode()} className="rounded px-3 py-2" style={{ background: "var(--color-surface)" }}>Xóa ô</button>
            <button disabled={!selectedNode?.linkId} onClick={() => void openLinked()} className="shrink-0 rounded px-3 py-2" style={{ background: "var(--color-surface-alt)", color: "var(--color-accent)" }}>Đọc chi tiết</button>
            <button className="shrink-0 rounded px-3 py-2" style={{ background: connectMode ? "var(--color-accent)" : "var(--color-surface-alt)", color: connectMode ? "var(--color-bg)" : "var(--color-text)" }} onClick={toggleConnectMode}>🔗 Nối tự do</button>
            <button className="shrink-0 rounded px-3 py-2" style={{ background: "var(--color-surface-alt)" }} onClick={() => void addFreeNode()}>＋ Ô tự do</button>
            <button className="shrink-0 rounded px-3 py-2" style={{ background: "var(--color-surface-alt)" }} onClick={() => void addBranch()}>＋ Nhánh con</button>
            <button aria-label="Thu nhỏ" className="rounded px-2 py-2" style={{ background: "var(--color-surface)" }} onClick={() => zoomAt(zoom - 0.15, { x: 200, y: 160 })}>−</button>
            <button title="Đặt lại góc nhìn" className="rounded px-2 py-2 text-xs" style={{ background: "var(--color-surface)" }} onClick={resetView}>{Math.round(zoom * 100)}%</button>
            <button aria-label="Phóng to" className="rounded px-2 py-2" style={{ background: "var(--color-surface)" }} onClick={() => zoomAt(zoom + 0.15, { x: 200, y: 160 })}>＋</button>
            <span className="hidden lg:inline rounded px-2 py-2 text-xs" style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}>{connectMode ? (connectSource ? `Đã chọn “${connectSource.title}”, chạm ô thứ hai` : "Chạm ô đầu tiên để bắt đầu nối") : "Kéo ô để đặt vị trí"}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pointer-events-auto">
            <select aria-label="Chọn dự án liên kết" value={projectChoice} onChange={(event) => setProjectChoice(event.target.value)} className="min-w-40 max-w-64 rounded px-2 py-2" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}><option value="">Liên kết dự án…</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>
            <button disabled={!projectChoice} className="shrink-0 rounded px-3 py-2" style={{ background: "var(--color-surface-alt)" }} onClick={async () => { if (!projectChoice) return; const map = await createOrSyncProjectMap(projectChoice); selectMap(map.id); }}>↻ Tạo/đồng bộ cây</button>
            <button className="shrink-0 rounded px-3 py-2" style={{ background: drawMode ? "var(--color-accent)" : "var(--color-surface-alt)", color: drawMode ? "var(--color-bg)" : "var(--color-text)" }} onClick={() => { setDrawMode((value) => !value); setConnectMode(false); setConnectSourceId(null); setSelectedStroke(null); }}>✎ Bút chì</button>
            {drawMode && <><select aria-label="Kiểu nét" value={strokeDashStyle} onChange={(event) => setStrokeDashStyle(event.target.value as CanvasStroke["dash"])} className="rounded px-2" style={{ background: "var(--color-surface)" }}><option value="solid">Liền</option><option value="dashed">Đứt</option><option value="dotted">Chấm</option></select><select aria-label="Mũi tên" value={strokeArrow} onChange={(event) => setStrokeArrow(event.target.value as CanvasStroke["arrow"])} className="rounded px-2" style={{ background: "var(--color-surface)" }}><option value="none">Không mũi tên</option><option value="end">Mũi tên cuối</option><option value="both">Hai đầu</option></select><label className="shrink-0 rounded px-2 py-2" style={{ background: "var(--color-surface)" }}>Nét {strokeWidth}<input aria-label="Độ dày nét" type="range" min="1" max="12" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} /></label><label className="shrink-0 rounded px-2 py-2" style={{ background: "var(--color-surface)" }}><input type="checkbox" checked={smooth} onChange={(event) => setSmooth(event.target.checked)} /> Làm mượt</label></>}
            {selectedEdgeItem && <><button className="shrink-0 rounded px-3" style={{ background: "var(--color-surface-alt)" }} onClick={() => void deleteSelectedEdge()}>Xóa liên kết</button><span className="shrink-0 rounded px-2 py-2 text-xs" style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}>{getMindMapEdgeType(selectedEdgeItem) === "free" ? "Liên kết tự do" : "Nhánh cây"}</span></>}
            {selectedStroke && <><button className="shrink-0 rounded px-3" style={{ background: "var(--color-surface-alt)" }} onClick={async () => { const item = strokes.find((stroke) => stroke.id === selectedStroke); if (!item) return; await updateStroke("mindmap", item.id, { locked: !item.locked }); setStrokes((items) => items.map((stroke) => stroke.id === item.id ? { ...stroke, locked: !stroke.locked } : stroke)); }}>{strokes.find((item) => item.id === selectedStroke)?.locked ? "🔓 Mở khóa" : "🔒 Khóa"}</button><button disabled={strokes.find((item) => item.id === selectedStroke)?.locked} className="shrink-0 rounded px-3" style={{ color: "var(--color-error)", background: "var(--color-surface-alt)" }} onClick={async () => { await deleteStroke("mindmap", selectedStroke); setStrokes((items) => items.filter((item) => item.id !== selectedStroke)); setSelectedStroke(null); }}>Xóa nét</button></>}
          </div>
        </div>

        <button aria-label="Tạo ô tự do" title="Tạo ô tự do" onClick={() => void addFreeNode()} className="canvas-add-fab absolute z-20 right-4 bottom-4 w-14 h-14 rounded-full text-3xl shadow-xl" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>＋</button>

        <svg
          className="w-full h-full touch-none"
          onWheel={(event) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); zoomAt(zoom * (event.deltaY > 0 ? 0.9 : 1.1), { x: event.clientX - rect.left, y: event.clientY - rect.top }); }}
          onPointerDownCapture={(event) => { pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); event.currentTarget.setPointerCapture(event.pointerId); if (pointers.current.size >= 2) { drag.current = null; drawing.current = null; canvasPan.current = null; updatePinch(event.currentTarget); } else if (drawMode && event.target === event.currentTarget) { drawing.current = { pointerId: event.pointerId, points: [worldPoint(event, event.currentTarget)] }; setSelectedStroke(null); } else if (event.target === event.currentTarget) { canvasPan.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, pan: { ...pan } }; } }}
          onPointerMove={(event) => {
            if (pointers.current.has(event.pointerId)) { pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); if (pointers.current.size >= 2) { updatePinch(event.currentTarget); return; } }
            if (drawing.current?.pointerId === event.pointerId) { const point = worldPoint(event, event.currentTarget); drawing.current.points.push(point); setStrokes((items) => { const preview: CanvasStroke = { id: "__preview", ownerId: activeRef.current ?? "", points: [...drawing.current!.points], color: "#4fd1c5", width: strokeWidth, dash: strokeDashStyle, arrow: strokeArrow, smoothed: smooth, locked: false, createdAt: 0, updatedAt: 0, schemaVersion: 1, deletedAt: null, syncState: "local" }; return [...items.filter((item) => item.id !== "__preview"), preview]; }); return; }
            if (strokeDrag.current?.pointerId === event.pointerId) { const current = strokeDrag.current; const point = worldPoint(event, event.currentTarget); const dx = point.x - current.start.x; const dy = point.y - current.start.y; setStrokes((items) => items.map((item) => item.id === current.id ? { ...item, points: current.points.map((entry) => ({ x: entry.x + dx, y: entry.y + dy })) } : item)); return; }
            const current = drag.current;
            if (!current && canvasPan.current?.pointerId === event.pointerId) { const start = canvasPan.current; setPan({ x: start.pan.x + event.clientX - start.start.x, y: start.pan.y + event.clientY - start.start.y }); return; }
            if (!current) return;
            const x = current.startNodeX + (event.clientX - current.startClientX) / zoom;
            const y = current.startNodeY + (event.clientY - current.startClientY) / zoom;
            setNodes((items) => items.map((node) => node.id === current.id ? { ...node, x, y } : node));
          }}
          onPointerUp={(event) => {
            pointers.current.delete(event.pointerId);
            if (pointers.current.size < 2) pinch.current = null;
            if (canvasPan.current?.pointerId === event.pointerId) canvasPan.current = null;
            if (drawing.current?.pointerId === event.pointerId) { setStrokes((items) => items.filter((item) => item.id !== "__preview")); void finishDrawing(); }
            if (strokeDrag.current?.pointerId === event.pointerId) { const current = strokeDrag.current; const point = worldPoint(event, event.currentTarget); const dx = point.x - current.start.x; const dy = point.y - current.start.y; const points = current.points.map((entry) => ({ x: entry.x + dx, y: entry.y + dy })); void updateStroke("mindmap", current.id, { points }); setStrokes((items) => items.map((item) => item.id === current.id ? { ...item, points } : item)); strokeDrag.current = null; }
            finishDrag();
          }}
          onPointerCancel={() => { pointers.current.clear(); pinch.current = null; drawing.current = null; strokeDrag.current = null; setStrokes((items) => items.filter((item) => item.id !== "__preview")); canvasPan.current = null; finishDrag(); }}
        >
          <defs><marker id="mindmap-arrow-end" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-accent)" /></marker><marker id="mindmap-arrow-start" markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto"><path d="M8,0 L0,4 L8,8 z" fill="var(--color-accent)" /></marker></defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {strokes.map((stroke) => <path key={stroke.id} d={strokePath(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeDasharray={strokeDash(stroke.dash)} strokeLinecap="round" strokeLinejoin="round" markerEnd={stroke.arrow !== "none" ? "url(#mindmap-arrow-end)" : undefined} markerStart={stroke.arrow === "both" ? "url(#mindmap-arrow-start)" : undefined} opacity={selectedStroke === stroke.id ? 0.9 : 1} style={{ pointerEvents: "stroke", cursor: stroke.locked ? "not-allowed" : "move" }} onPointerDown={(event) => { if (drawMode || connectMode || stroke.id === "__preview") return; event.preventDefault(); event.stopPropagation(); setSelectedStroke(stroke.id); setSelected(null); setSelectedEdge(null); if (!stroke.locked) strokeDrag.current = { id: stroke.id, pointerId: event.pointerId, start: worldPoint(event, event.currentTarget.ownerSVGElement!), points: stroke.points.map((point) => ({ ...point })) }; }}><title>{stroke.locked ? "Nét đã khóa" : "Kéo để di chuyển nét"}</title></path>)}
            {edges.map((edge) => {
              const source = nodes.find((node) => node.id === edge.sourceId);
              const target = nodes.find((node) => node.id === edge.targetId);
              if (!source || !target) return null;
              const path = edgePath(edge, source, target);
              const free = getMindMapEdgeType(edge) === "free";
              return <g key={edge.id} onPointerDown={(event) => { if (drawMode || connectMode) return; event.preventDefault(); event.stopPropagation(); setSelectedEdge(edge.id); setSelected(null); setSelectedStroke(null); }} style={{ cursor: "pointer" }}><path d={path} fill="none" stroke="transparent" strokeWidth="12" style={{ pointerEvents: "stroke" }} /><path d={path} fill="none" stroke={selectedEdge === edge.id ? "var(--color-accent)" : "var(--color-connector)"} strokeWidth={selectedEdge === edge.id ? "3.5" : "2"} strokeDasharray={free ? "8 6" : undefined} style={{ pointerEvents: "none" }} /><title>{free ? "Liên kết tự do — chạm để chọn" : "Nhánh cây — chạm để chọn"}</title></g>;
            })}
            {nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x} ${node.y})`} onPointerDown={(event) => { if (drawMode) return; if (connectMode) { event.preventDefault(); event.stopPropagation(); void connectNodes(node.id); return; } if (pointers.current.size > 1) return; event.preventDefault(); event.stopPropagation(); setSelected(node.id); setSelectedEdge(null); setSelectedStroke(null); drag.current = { id: node.id, startClientX: event.clientX, startClientY: event.clientY, startNodeX: node.x, startNodeY: node.y }; event.currentTarget.setPointerCapture(event.pointerId); }}>
                <rect width={nodeWidth(node.title)} height="44" rx="12" fill={selected === node.id || connectSourceId === node.id ? "var(--color-accent)" : "var(--color-node)"} stroke={connectSourceId === node.id ? "var(--color-text)" : "var(--color-border)"} strokeWidth={connectSourceId === node.id ? "3" : "1"} />
                <rect width={NODE_HANDLE_WIDTH} height="44" rx="12" fill="transparent" className="mindmap-node-grip" />
                <line x1={NODE_HANDLE_WIDTH} y1="7" x2={NODE_HANDLE_WIDTH} y2="37" stroke="var(--color-border)" opacity=".75" />
                <text x="19" y="28" textAnchor="middle" fill={selected === node.id || connectSourceId === node.id ? "var(--color-bg)" : "var(--color-text-muted)"} fontSize="18" className="pointer-events-none select-none">⠿</text>
                <title>{connectMode ? "Chạm để nối ô này" : "Giữ dấu ⠿ rồi kéo để di chuyển ô"}</title>
                <foreignObject x={NODE_HANDLE_WIDTH} width={nodeWidth(node.title) - NODE_HANDLE_WIDTH} height="44">
                  <input aria-label="Tên nút" value={node.title} onPointerDown={(event) => { event.stopPropagation(); if (connectMode) { event.preventDefault(); void connectNodes(node.id); } else { setSelected(node.id); setSelectedEdge(null); setSelectedStroke(null); } }} onChange={(event) => setNodes((items) => items.map((item) => item.id === node.id ? { ...item, title: event.target.value } : item))} onBlur={(event) => void updateMindMapNode(node.id, { title: event.target.value })} className="w-full h-full text-center bg-transparent px-2 outline-none" />
                </foreignObject>
              </g>
            ))}
          </g>
        </svg>
      </main>
    </div>
  );
}
