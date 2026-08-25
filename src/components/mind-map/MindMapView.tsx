import { useEffect, useRef, useState } from "react";
import type { MindMap, MindMapEdge, MindMapNode } from "../../types/entities";
import {
  addMindMapNode,
  createMindMap,
  deleteMindMap,
  deleteMindMapNode,
  getMapGraph,
  listMindMaps,
  renameMindMap,
  updateMindMapNode,
} from "../../features/mind-map/mindMapService";

type DragState = {
  id: string;
  startClientX: number;
  startClientY: number;
  startNodeX: number;
  startNodeY: number;
};

export function MindMapView() {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [edges, setEdges] = useState<MindMapEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const selectedNode = nodes.find((node) => node.id === selected) ?? null;

  const reload = async (id = active) => {
    setMaps(await listMindMaps());
    if (!id) return;
    const graph = await getMapGraph(id);
    setNodes(graph.nodes);
    setEdges(graph.edges);
  };

  useEffect(() => {
    void listMindMaps().then(async (items) => {
      const next = items.length ? items : [(await createMindMap()).map];
      setMaps(next);
      setActive(next[0].id);
      const graph = await getMapGraph(next[0].id);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    });
  }, []);

  const add = async () => {
    if (!active) return;
    const parent = nodes.find((node) => node.id === selected)
      ?? nodes.find((node) => node.parentId === null);
    if (!parent) return;
    await addMindMapNode(
      active,
      parent.id,
      "Nhánh mới",
      parent.x + 180,
      parent.y + (nodes.length % 5 - 2) * 70,
    );
    await reload();
  };

  const removeActiveMap = async () => {
    if (!active || !window.confirm("Xóa sơ đồ này và toàn bộ các nhánh? Hành động này không thể hoàn tác.")) return;
    await deleteMindMap(active);
    let remaining = await listMindMaps();
    if (!remaining.length) remaining = [(await createMindMap()).map];
    setActive(remaining[0].id); setSelected(null); await reload(remaining[0].id);
  };

  const renameActiveMap = async () => {
    if (!active) return;
    const current=maps.find((map)=>map.id===active);
    const title=window.prompt("Tên sơ đồ:",current?.title??"")?.trim();
    if(!title)return; await renameMindMap(active,title); await reload(active);
  };

  const finishDrag = () => {
    const current = drag.current;
    if (!current) return;
    const node = nodes.find((item) => item.id === current.id);
    if (node) void updateMindMapNode(node.id, { x: node.x, y: node.y });
    drag.current = null;
  };

  return (
    <div className="h-full min-h-0 flex flex-col md:flex-row">
      <div className="md:hidden shrink-0 border-b p-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex gap-2 min-w-0">
          <select aria-label="Chọn sơ đồ" className="min-w-0 flex-1 rounded border bg-transparent px-2 py-2" style={{borderColor:"var(--color-border)"}} value={active??""} onChange={(event)=>{setActive(event.target.value);setSelected(null);void reload(event.target.value);}}>
            {maps.map((map)=><option key={map.id} value={map.id}>{map.title}</option>)}
          </select>
          <button aria-label="Tạo sơ đồ" className="mobile-icon-button" style={{background:"var(--color-accent)",color:"var(--color-bg)"}} onClick={async()=>{const created=await createMindMap();setActive(created.map.id);await reload(created.map.id);}}>＋</button>
          <button aria-label="Đổi tên sơ đồ" className="mobile-icon-button" style={{background:"var(--color-surface-alt)"}} onClick={renameActiveMap}>✎</button>
          <button aria-label="Xóa sơ đồ" className="mobile-icon-button" style={{background:"var(--color-surface-alt)",color:"var(--color-error)"}} onClick={removeActiveMap}>⌫</button>
        </div>
      </div>
      <aside className="hidden md:block w-56 shrink-0 border-r p-3 space-y-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <button
          className="w-full rounded p-2"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          onClick={async () => {
            const created = await createMindMap();
            setActive(created.map.id);
            await reload(created.map.id);
          }}
        >
          ＋ Sơ đồ mới
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button disabled={!active} className="rounded p-2 text-sm" style={{ background: "var(--color-surface-alt)" }} onClick={renameActiveMap}>Đổi tên</button>
          <button disabled={!active} className="rounded p-2 text-sm" style={{ color: "var(--color-error)", background: "var(--color-surface-alt)" }} onClick={removeActiveMap}>Xóa sơ đồ</button>
        </div>
        {maps.map((map) => (
          <button
            className="w-full text-left p-2 rounded"
            style={{ background: active === map.id ? "var(--color-surface-alt)" : "transparent" }}
            onClick={() => {
              setActive(map.id);
              void reload(map.id);
            }}
            key={map.id}
          >
            {map.title}
          </button>
        ))}
      </aside>

      <main className="flex-1 min-h-0 min-w-0 relative overflow-hidden" style={{ background: "var(--color-canvas-bg)" }}>
        <div className="absolute z-10 left-2 top-2 md:left-3 md:top-3 flex gap-2">
          <button onClick={add} className="rounded px-3 py-2" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
            ＋ Nhánh
          </button>
          <button
            disabled={!selected || selectedNode?.parentId === null}
            onClick={async () => {
              if (!selected || selectedNode?.parentId === null) return;
              await deleteMindMapNode(selected);
              setSelected(null);
              await reload();
            }}
            className="rounded px-3 py-2"
            style={{ background: "var(--color-surface)" }}
          >
            Xóa
          </button>
        </div>

        <svg
          className="w-full h-full touch-none"
          onPointerMove={(event) => {
            const current = drag.current;
            if (!current) return;
            const x = current.startNodeX + event.clientX - current.startClientX;
            const y = current.startNodeY + event.clientY - current.startClientY;
            setNodes((items) => items.map((node) => (
              node.id === current.id ? { ...node, x, y } : node
            )));
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onPointerLeave={finishDrag}
        >
          {edges.map((edge) => {
            const source = nodes.find((node) => node.id === edge.sourceId);
            const target = nodes.find((node) => node.id === edge.targetId);
            if (!source || !target) return null;
            return (
              <path
                key={edge.id}
                d={`M${source.x + 65},${source.y + 22} C${source.x + 120},${source.y + 22} ${target.x - 55},${target.y + 22} ${target.x},${target.y + 22}`}
                fill="none"
                stroke="var(--color-connector)"
                strokeWidth="2"
              />
            );
          })}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
              onPointerDown={(event) => {
                event.preventDefault();
                setSelected(node.id);
                drag.current = {
                  id: node.id,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  startNodeX: node.x,
                  startNodeY: node.y,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            >
              <rect
                width="130"
                height="44"
                rx="12"
                fill={selected === node.id ? "var(--color-accent)" : "var(--color-node)"}
                stroke="var(--color-border)"
              />
              <foreignObject width="130" height="44">
                <input
                  aria-label="Tên nút"
                  value={node.title}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    setSelected(node.id);
                  }}
                  onChange={(event) => setNodes((items) => items.map((item) => (
                    item.id === node.id ? { ...item, title: event.target.value } : item
                  )))}
                  onBlur={(event) => void updateMindMapNode(node.id, { title: event.target.value })}
                  className="w-full h-full text-center bg-transparent px-2 outline-none"
                />
              </foreignObject>
            </g>
          ))}
        </svg>
      </main>
    </div>
  );
}
