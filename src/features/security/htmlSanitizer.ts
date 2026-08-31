const ALLOWED_TAGS = new Set([
  "P", "BR", "DIV", "H1", "H2", "H3", "BLOCKQUOTE", "PRE",
  "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "UL", "OL", "LI",
  "SPAN", "FONT", "A",
]);

const DROP_CONTENT_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE"]);
const SAFE_STYLE_PROPERTIES = new Set(["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "text-decoration", "text-align"]);

function safeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("#")) return trimmed;
  try {
    const url = new URL(trimmed, window.location.origin);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return trimmed;
  } catch { /* invalid URL */ }
  return "";
}

function sanitizeStyle(element: HTMLElement) {
  const source = element.getAttribute("style");
  if (!source) return;
  const probe = document.createElement("span");
  probe.setAttribute("style", source);
  const safe: string[] = [];
  for (const property of SAFE_STYLE_PROPERTIES) {
    const value = probe.style.getPropertyValue(property).trim();
    if (!value) continue;
    // Loại CSS có thể tải/nhúng tài nguyên hoặc thoát khỏi giá trị thông thường.
    if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) continue;
    safe.push(`${property}: ${value}`);
  }
  if (safe.length) element.setAttribute("style", safe.join("; "));
  else element.removeAttribute("style");
}

/**
 * Sanitizer không phụ thuộc package ngoài cho HTML sinh bởi contentEditable/execCommand.
 * Mục tiêu là ngăn event handler, script, iframe/SVG và URL nguy hiểm sống lại khi dữ liệu sync được render.
 */
export function sanitizeRichHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  const elements = Array.from(template.content.querySelectorAll("*"));

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      element.remove();
      continue;
    }

    const tag = element.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tag)) {
      if (DROP_CONTENT_TAGS.has(tag)) element.remove();
      else element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed = name === "style"
        || (tag === "A" && ["href", "title", "target", "rel"].includes(name))
        || (tag === "FONT" && ["face", "size", "color"].includes(name));
      if (!allowed || name.startsWith("on")) element.removeAttribute(attribute.name);
    }

    sanitizeStyle(element);

    if (tag === "A") {
      const href = safeHref(element.getAttribute("href") ?? "");
      if (href) element.setAttribute("href", href);
      else element.removeAttribute("href");
      if (element.getAttribute("target") === "_blank") element.setAttribute("rel", "noopener noreferrer");
      else element.removeAttribute("target");
    }
  }

  return template.innerHTML;
}
