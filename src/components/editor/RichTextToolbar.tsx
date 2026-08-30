import type { RefObject } from "react";

type Props = {
  editorRef: RefObject<HTMLElement | null>;
  onFormat: () => void;
  compact?: boolean;
};

const buttonClass = "min-w-8 px-2 py-1.5 rounded border text-sm hover:opacity-80";

export function RichTextToolbar({ editorRef, onFormat, compact = false }: Props) {
  const run = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onFormat();
  };

  return (
    <div className={`rich-text-toolbar flex items-center gap-1.5 ${compact ? "px-3 py-2" : "px-4 py-2"}`}>
      <button type="button" title="Hoàn tác" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("undo")}>↶</button>
      <button type="button" title="Làm lại" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("redo")}>↷</button>
      <select aria-label="Kiểu đoạn" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="P" onChange={(e) => run("formatBlock", e.target.value)}>
        <option value="P">Đoạn văn</option><option value="H1">Tiêu đề 1</option><option value="H2">Tiêu đề 2</option><option value="H3">Tiêu đề 3</option><option value="BLOCKQUOTE">Trích dẫn</option><option value="PRE">Mã/định dạng sẵn</option>
      </select>
      <select aria-label="Kiểu chữ" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="Georgia" onChange={(e) => run("fontName", e.target.value)}>
        <option value="Georgia">Georgia</option><option value="Palatino Linotype">Palatino cổ điển</option><option value="Segoe Script">Segoe Script thư pháp</option><option value="Brush Script MT">Brush Script</option><option value="KaiTi">Khải thư (KaiTi)</option><option value="Yu Mincho">Mincho cổ phong</option><option value="Noto Serif">Noto Serif</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option><option value="Courier New">Courier New</option>
      </select>
      <select aria-label="Cỡ chữ" className="px-2 py-1.5 rounded border bg-transparent text-sm" defaultValue="3" onChange={(e) => run("fontSize", e.target.value)}>
        <option value="1">10</option><option value="2">13</option><option value="3">16</option><option value="4">18</option><option value="5">24</option><option value="6">32</option><option value="7">48</option>
      </select>
      <button type="button" title="In đậm" className={`${buttonClass} font-bold`} onMouseDown={(e) => e.preventDefault()} onClick={() => run("bold")}>B</button>
      <button type="button" title="In nghiêng" className={`${buttonClass} italic`} onMouseDown={(e) => e.preventDefault()} onClick={() => run("italic")}>I</button>
      <button type="button" title="Gạch chân" className={`${buttonClass} underline`} onMouseDown={(e) => e.preventDefault()} onClick={() => run("underline")}>U</button>
      <button type="button" title="Gạch ngang" className={`${buttonClass} line-through`} onMouseDown={(e) => e.preventDefault()} onClick={() => run("strikeThrough")}>S</button>
      <button type="button" title="Căn trái" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("justifyLeft")}>≡</button>
      <button type="button" title="Căn giữa" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("justifyCenter")}>≡</button>
      <button type="button" title="Căn phải" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("justifyRight")}>≡</button>
      <button type="button" title="Danh sách chấm" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertUnorderedList")}>• List</button>
      <button type="button" title="Danh sách số" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("insertOrderedList")}>1. List</button>
      <label title="Màu chữ" className="h-8 px-2 rounded border flex items-center gap-1 text-sm cursor-pointer">A <input aria-label="Màu chữ" type="color" className="w-5 h-5" onChange={(e) => run("foreColor", e.target.value)} /></label>
      <button type="button" title="Xóa định dạng" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => run("removeFormat")}>Xóa kiểu</button>
    </div>
  );
}
