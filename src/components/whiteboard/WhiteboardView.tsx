import { useEffect, useRef, useState } from "react";
import type { Whiteboard, WhiteboardObject, WhiteboardObjectKind } from "../../types/entities";
import {
  addBoardObject, connectBoardObjects, createWhiteboard, deleteBoardObject, deleteWhiteboard, getBoardObjects,
  listWhiteboards, removeBoardObjectConnections, renameWhiteboard, updateBoardObject,
} from "../../features/whiteboard/whiteboardService";

type Point={x:number;y:number};

export function WhiteboardView() {
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan,setPan] = useState<Point>({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [linkSource,setLinkSource]=useState<string|null>(null);
  const drag = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);
  const canvasPan=useRef<{pointerId:number;start:Point;pan:Point}|null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{distance:number;zoom:number;pan:Point;center:Point}|null>(null);

  const clampZoom = (value: number) => Math.min(2.5, Math.max(0.35, value));
  const updatePinch = (element:HTMLDivElement) => {
    const points = [...pointers.current.values()];
    if (points.length < 2) { pinch.current = null; return; }
    const rect=element.getBoundingClientRect();
    const center={x:(points[0].x+points[1].x)/2-rect.left,y:(points[0].y+points[1].y)/2-rect.top};
    const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    if (!pinch.current) { pinch.current = {distance,zoom,pan:{...pan},center}; return; }
    const nextZoom=clampZoom(pinch.current.zoom*distance/Math.max(1,pinch.current.distance));
    const worldX=(pinch.current.center.x-pinch.current.pan.x)/pinch.current.zoom;
    const worldY=(pinch.current.center.y-pinch.current.pan.y)/pinch.current.zoom;
    setZoom(nextZoom);setPan({x:center.x-worldX*nextZoom,y:center.y-worldY*nextZoom});
  };
  const zoomAt=(next:number,center:Point)=>{const value=clampZoom(next);setPan(current=>({x:center.x-(center.x-current.x)*value/zoom,y:center.y-(center.y-current.y)*value/zoom}));setZoom(value);};
  const resetView=()=>{setZoom(1);setPan({x:0,y:0});};

  const selectObject=async(id:string)=>{
    if(linkSource&&linkSource!==id){await connectBoardObjects(linkSource,id);setLinkSource(null);setSelected(id);await reload();return true;}
    setSelected(id);return false;
  };

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
        <button disabled={!selected} className="shrink-0 rounded px-3 py-1.5" style={{background:linkSource?"var(--color-accent)":"var(--color-surface-alt)",color:linkSource?"var(--color-bg)":"var(--color-text)"}} onClick={()=>setLinkSource(current=>current?null:selected)}>⇢ {linkSource?"Chạm hình đích":"Nối"}</button>
        <button disabled={!selected} className="shrink-0" onClick={async()=>{if(!selected)return;await removeBoardObjectConnections(selected);setLinkSource(null);await reload();}}>Bỏ nối</button>
        <div className="ml-auto flex shrink-0 items-center gap-1"><button onClick={()=>zoomAt(zoom-.15,{x:200,y:160})}>−</button><button title="Đặt lại góc nhìn" onClick={resetView}>{Math.round(zoom * 100)}%</button><button onClick={()=>zoomAt(zoom+.15,{x:200,y:160})}>＋</button></div>
        </div>
      </header>
      <div
        className="flex-1 relative overflow-hidden touch-none"
        style={{ backgroundColor: "var(--color-canvas-bg)", backgroundImage: "radial-gradient(var(--color-border) 1px,transparent 1px)", backgroundSize: `${24 * zoom}px ${24 * zoom}px` }}
        onWheel={(event) => { event.preventDefault(); const rect=event.currentTarget.getBoundingClientRect();zoomAt(zoom*(event.deltaY>0?.9:1.1),{x:event.clientX-rect.left,y:event.clientY-rect.top}); }}
        onPointerDown={(event) => {
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
          if (pointers.current.size >= 2) { drag.current = null;canvasPan.current=null;updatePinch(event.currentTarget); }
          else if(event.target===event.currentTarget){canvasPan.current={pointerId:event.pointerId,start:{x:event.clientX,y:event.clientY},pan:{...pan}};}
        }}
        onPointerMove={(event) => {
          if (pointers.current.has(event.pointerId)) {
            pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (pointers.current.size >= 2) { updatePinch(event.currentTarget); return; }
          }
          const current = drag.current;
          if(!current&&canvasPan.current?.pointerId===event.pointerId){const start=canvasPan.current;setPan({x:start.pan.x+event.clientX-start.start.x,y:start.pan.y+event.clientY-start.start.y});return;}
          if (!current) return;
          setObjects((items) => items.map((item) => item.id === current.id ? {
            ...item,
            x: current.startX + (event.clientX - current.startClientX) / zoom,
            y: current.startY + (event.clientY - current.startClientY) / zoom,
          } : item));
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId);if(pointers.current.size<2)pinch.current=null;if(canvasPan.current?.pointerId===event.pointerId)canvasPan.current=null;
          const current = drag.current;
          const item = objects.find((entry) => entry.id === current?.id);
          if (item) void updateBoardObject(item.id, { x: item.x, y: item.y });
          drag.current = null;
        }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId);pinch.current=null;canvasPan.current=null;drag.current = null; }}
      >
        <div className="absolute origin-top-left" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          <svg className="absolute overflow-visible pointer-events-none" width="4000" height="3000" aria-hidden="true">
            <defs><marker id="whiteboard-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-connector)" /></marker></defs>
            {objects.flatMap(source=>(source.connectedToIds??[]).map(targetId=>{const target=objects.find(item=>item.id===targetId);if(!target)return null;const sx=source.x+source.width/2,sy=source.y+source.height/2,tx=target.x+target.width/2,ty=target.y+target.height/2;return <path key={`${source.id}-${targetId}`} d={`M${sx},${sy} C${sx+(tx-sx)/2},${sy} ${sx+(tx-sx)/2},${ty} ${tx},${ty}`} fill="none" stroke="var(--color-connector)" strokeWidth="3" markerEnd="url(#whiteboard-arrow)"/>;}))}
          </svg>
          {objects.map((item) => (
            <div
              key={item.id}
              onPointerDown={(event) => {
                if (pointers.current.size > 0) return;
                if(linkSource){event.preventDefault();event.stopPropagation();void selectObject(item.id);return;}
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
                className="h-9 px-2 flex items-center cursor-move select-none text-xs font-semibold"
                style={{background:"color-mix(in srgb, var(--color-bg) 18%, transparent)",borderRadius:item.kind==="ellipse"?"50% 50% 0 0":"9px 9px 0 0"}}
              >
                ⠿ Kéo <span className="ml-auto opacity-60">{(item.connectedToIds??[]).length?"⇢":""}</span>
              </div>
              <textarea
                aria-label="Nội dung đối tượng"
                value={item.text}
                onPointerDown={(event) => { event.stopPropagation();void selectObject(item.id); }}
                onChange={(event) => setObjects((items) => items.map((entry) => entry.id === item.id ? { ...entry, text: event.target.value } : entry))}
                onBlur={(event) => void updateBoardObject(item.id, { text: event.target.value })}
                className="w-full resize-none bg-transparent outline-none px-3 pb-3"
                style={{ height: Math.max(20, item.height - 36) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
