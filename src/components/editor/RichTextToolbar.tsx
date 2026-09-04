import { useEffect, useState, type RefObject } from "react";
import { Icon } from "../common/Icons";
import { localGet, localSet } from "../../features/app/safeStorage";

type Props = {
  editorRef: RefObject<HTMLElement | null>;
  onFormat: () => void;
  compact?: boolean;
};

const buttonClass = "rich-text-tool-button min-w-8 px-2 py-1.5 rounded border text-sm hover:opacity-80";

export function RichTextToolbar({ editorRef, onFormat, compact = false }: Props) {
  const [collapsed, setCollapsed] = useState(() => localGet("hbc-rich-toolbar-collapsed") === "1");

  useEffect(() => {
    localSet("hbc-rich-toolbar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const run = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onFormat();
  };

  return (
    <div className={`rich-text-toolbar ${collapsed ? "is-collapsed" : ""} flex items-center gap-1.5 ${compact ? "px-1 py-1" : "px-2 py-1"}`}>
      <button
        type="button"
        title={collapsed ? "Mở công cụ soạn thảo" : "Thu gọn công cụ soạn thảo"}
        aria-label={collapsed ? "Mở công cụ soạn thảo" : "Thu gọn công cụ soạn thảo"}
        className={buttonClass}
        onClick={() => setCollapsed((value) => !value)}
      >
        <Icon name={collapsed ? "chevron-right" : "chevron-down"} size={15} />
      </button>
      {!collapsed && (
        <>
          <button type="button" title="Hoàn tác" aria-label="Hoàn tác" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("undo")}><Icon name="undo" size={15} /></button>
          <button type="button" title="Làm lại" aria-label="Làm lại" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("redo")}><Icon name="redo" size={15} /></button>
          <select aria-label="Kiểu đoạn" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="P" onChange={(event) => run("formatBlock", event.target.value)}>
            <option value="P">Đoạn văn</option><option value="H1">Tiêu đề 1</option><option value="H2">Tiêu đề 2</option><option value="H3">Tiêu đề 3</option><option value="BLOCKQUOTE">Trích dẫn</option><option value="PRE">Mã/định dạng sẵn</option>
          </select>
          <select aria-label="Kiểu chữ" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="Georgia" onChange={(event) => run("fontName", event.target.value)}>
            <option value="Georgia">Georgia</option><option value="Palatino Linotype">Palatino cổ điển</option><option value="Segoe Script">Segoe Script thư pháp</option><option value="Brush Script MT">Brush Script</option><option value="KaiTi">Khải thư (KaiTi)</option><option value="Yu Mincho">Mincho cổ phong</option><option value="Noto Serif">Noto Serif</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option><option value="Courier New">Courier New</option>
          </select>
          <select aria-label="Cỡ chữ" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="3" onChange={(event) => run("fontSize", event.target.value)}>
            <option value="1">10</option><option value="2">13</option><option value="3">16</option><option value="4">18</option><option value="5">24</option><option value="6">32</option><option value="7">48</option>
          </select>
          <button type="button" title="In đậm" className={`${buttonClass} font-bold`} onMouseDown={(event) => event.preventDefault()} onClick={() => run("bold")}>B</button>
          <button type="button" title="In nghiêng" className={`${buttonClass} italic`} onMouseDown={(event) => event.preventDefault()} onClick={() => run("italic")}>I</button>
          <button type="button" title="Gạch chân" className={`${buttonClass} underline`} onMouseDown={(event) => event.preventDefault()} onClick={() => run("underline")}>U</button>
          <button type="button" title="Gạch ngang" className={`${buttonClass} line-through`} onMouseDown={(event) => event.preventDefault()} onClick={() => run("strikeThrough")}>S</button>
          <button type="button" title="Căn trái" aria-label="Căn trái" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("justifyLeft")}><Icon name="align-left" size={15} /></button>
          <button type="button" title="Căn giữa" aria-label="Căn giữa" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("justifyCenter")}><Icon name="align-center" size={15} /></button>
          <button type="button" title="Căn phải" aria-label="Căn phải" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("justifyRight")}><Icon name="align-right" size={15} /></button>
          <button type="button" title="Danh sách chấm" aria-label="Danh sách chấm" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("insertUnorderedList")}><Icon name="list-bullet" size={15} /></button>
          <button type="button" title="Danh sách số" aria-label="Danh sách số" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("insertOrderedList")}><Icon name="list-number" size={15} /></button>
          <label title="Màu chữ" className="h-8 px-2 rounded border flex items-center gap-1 text-sm cursor-pointer">A <input aria-label="Màu chữ" type="color" className="w-5 h-5" onChange={(event) => run("foreColor", event.target.value)} /></label>
          <button type="button" title="Xóa định dạng" aria-label="Xóa định dạng" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => run("removeFormat")}><Icon name="clear-format" size={15} /></button>
        </>
      )}
    </div>
  );
}
