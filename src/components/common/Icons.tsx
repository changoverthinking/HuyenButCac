import type { SVGProps } from "react";

export type IconName =
  | "seal"
  | "notes"
  | "projects"
  | "mindmap"
  | "whiteboard"
  | "search"
  | "user"
  | "menu"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "folder"
  | "folder-plus"
  | "trash"
  | "image"
  | "music"
  | "palette"
  | "pencil"
  | "lock"
  | "unlock"
  | "plus"
  | "export"
  | "check"
  | "spark"
  | "pin"
  | "book"
  | "scroll"
  | "play"
  | "pause"
  | "previous"
  | "next"
  | "shuffle"
  | "repeat"
  | "volume"
  | "zoom-in"
  | "zoom-out"
  | "link"
  | "unlink"
  | "close"
  | "refresh"
  | "clock"
  | "eye"
  | "focus"
  | "undo"
  | "redo"
  | "align-left"
  | "align-center"
  | "align-right"
  | "list-bullet"
  | "list-number"
  | "clear-format"
  | "target"
  | "move";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  title?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Icon({ name, size = 20, title, strokeWidth = 1.8, ...props }: IconProps) {
  const common = { ...base, strokeWidth };

  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      focusable="false"
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {name === "seal" && <><circle {...common} cx="12" cy="12" r="9.25" /><path {...common} d="M7.5 15.5c2.6-2 4.3-4.5 5.2-7.4 1.1 2.2 2.4 4.1 4 5.6" /><path {...common} d="M8.2 8.7h7.6M8.5 17.8h7" /></>}
      {name === "notes" && <><path {...common} d="M6 3.75h8.2L18 7.55v12.7H6z" /><path {...common} d="M14 3.75v4h4M8.8 11h6.5M8.8 14.4h6.5M8.8 17.8h4.2" /></>}
      {name === "projects" && <><path {...common} d="M5.4 4.2h7.5a2.6 2.6 0 0 1 2.6 2.6v13H8a2.6 2.6 0 0 0-2.6 2.6z" /><path {...common} d="M18.6 4.2h-2.3M8 20.4h10.6V4.2H11a3 3 0 0 0-3 3zM11.2 9h4.8M11.2 12.5h4.8M11.2 16h3.3" /></>}
      {name === "mindmap" && <><circle {...common} cx="6" cy="12" r="2.6" /><circle {...common} cx="18" cy="6" r="2.6" /><circle {...common} cx="18" cy="18" r="2.6" /><path {...common} d="M8.4 11 15.6 7.1M8.4 13l7.2 3.9" /></>}
      {name === "whiteboard" && <><rect {...common} x="3.5" y="4.5" width="17" height="13" rx="1.8" /><path {...common} d="m8 21 2.4-3.5M16 21l-2.4-3.5M7.5 8.3h9M7.5 11.7h5.5" /></>}
      {name === "search" && <><circle {...common} cx="10.8" cy="10.8" r="6.2" /><path {...common} d="m15.4 15.4 4.7 4.7" /></>}
      {name === "user" && <><circle {...common} cx="12" cy="7.4" r="3.1" /><path {...common} d="M5.2 20c.5-3.5 3-5.4 6.8-5.4s6.3 1.9 6.8 5.4" /></>}
      {name === "menu" && <><path {...common} d="M4 6.5h16M4 12h16M4 17.5h16" /></>}
      {name === "chevron-left" && <path {...common} d="m14.5 5-7 7 7 7" />}
      {name === "chevron-right" && <path {...common} d="m9.5 5 7 7-7 7" />}
      {name === "chevron-down" && <path {...common} d="m5 9 7 7 7-7" />}
      {name === "folder" && <><path {...common} d="M3.5 6.5h6l1.7 2h9.3v9.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...common} d="M3.5 8.5h17" /></>}
      {name === "folder-plus" && <><path {...common} d="M3.5 6.5h6l1.7 2h9.3v9.2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path {...common} d="M12 11.5v5M9.5 14h5" /></>}
      {name === "trash" && <><path {...common} d="M5 7h14M9 7V4.5h6V7M7.2 7l.7 12.5h8.2L16.8 7M10 10.5v5.5M14 10.5v5.5" /></>}
      {name === "image" && <><rect {...common} x="3.5" y="4.5" width="17" height="15" rx="2" /><circle {...common} cx="8.5" cy="9" r="1.25" /><path {...common} d="m4.5 17 4.8-4.8 3.3 3.2 2.3-2.3 4.6 4.5" /></>}
      {name === "music" && <><path {...common} d="M9 18.3V6.2l9-1.7v12.1" /><circle {...common} cx="6.5" cy="18.3" r="2.5" /><circle {...common} cx="15.5" cy="16.6" r="2.5" /></>}
      {name === "palette" && <><path {...common} d="M12 4a8 8 0 0 0 0 16h1.6a1.8 1.8 0 0 0 1.2-3.1c-.8-.8-.2-2.2 1-2.2H18a2 2 0 0 0 2-2A8.1 8.1 0 0 0 12 4Z" /><circle {...common} cx="7.8" cy="11" r=".7" /><circle {...common} cx="9.2" cy="7.8" r=".7" /><circle {...common} cx="13" cy="6.8" r=".7" /><circle {...common} cx="16.2" cy="8.3" r=".7" /></>}
      {name === "pencil" && <><path {...common} d="m4.5 16.8-.9 3.6 3.6-.9L19 7.7a2.1 2.1 0 0 0-3-3z" /><path {...common} d="m14.6 6.1 3.3 3.3M4 20.5l2.6-2.6" /></>}
      {name === "lock" && <><rect {...common} x="5" y="10" width="14" height="10" rx="2" /><path {...common} d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5" /></>}
      {name === "unlock" && <><rect {...common} x="5" y="10" width="14" height="10" rx="2" /><path {...common} d="M8 10V7a4 4 0 0 1 7.3-2.2M12 14v2.5" /></>}
      {name === "plus" && <><path {...common} d="M12 5v14M5 12h14" /></>}
      {name === "export" && <><path {...common} d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13.5v5h14v-5" /></>}
      {name === "check" && <path {...common} d="m5 12.5 4.2 4.2L19 7" />}
      {name === "spark" && <><path {...common} d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4z" /><path {...common} d="m18.5 16 .6 2.4 2.4.6-2.4.6-.6 2.4-.6-2.4-2.4-.6 2.4-.6z" /></>}
      {name === "pin" && <><path {...common} d="m8.5 4.5 7 7M14.5 3l6.5 6.5-3 1-3.8 3.8.8 4.2-1.1 1.1-4.8-4.8-4.8 4.8-.9-.9 4.8-4.8-4.8-4.8 1.1-1.1 4.2.8 3.8-3.8z" /></>}
      {name === "book" && <><path {...common} d="M5 4.5h8.3A2.7 2.7 0 0 1 16 7.2V20H7.2A2.2 2.2 0 0 0 5 22z" /><path {...common} d="M19 4.5h-3v15.4h3M8.5 8h4.2M8.5 11.5h4.2" /></>}
      {name === "scroll" && <><path {...common} d="M7 4.5h9.5A2.5 2.5 0 0 1 19 7v10.5a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3Z" /><path {...common} d="M7 4.5v12a1 1 0 0 0 1 1h10.5M8.5 8.5h7M8.5 12h6" /></>}
      {name === "play" && <path fill="currentColor" d="m8 5 11 7-11 7z" />}
      {name === "pause" && <><path {...common} d="M8 5v14M16 5v14" /></>}
      {name === "previous" && <><path {...common} d="M6 5v14M18 6l-8 6 8 6z" /></>}
      {name === "next" && <><path {...common} d="M18 5v14M6 6l8 6-8 6z" /></>}
      {name === "shuffle" && <><path {...common} d="M4 7h2.5c3.6 0 5.1 10 9 10H20M17 5l3 2-3 2M17 15l3 2-3 2M4 17h2.5c1.2 0 2.1-.7 2.8-1.6M14.6 8.6C15.3 7.6 16 7 17 7" /></>}
      {name === "repeat" && <><path {...common} d="M17 4.5 20 7l-3 2.5M19.5 7H7a3 3 0 0 0-3 3v1M7 19.5 4 17l3-2.5M4.5 17H17a3 3 0 0 0 3-3v-1" /></>}
      {name === "volume" && <><path {...common} d="M4 10v4h3l4 3V7l-4 3zM15.5 9a4.3 4.3 0 0 1 0 6M18 6.8a7.3 7.3 0 0 1 0 8.4" /></>}
      {name === "zoom-in" && <><circle {...common} cx="10.5" cy="10.5" r="6" /><path {...common} d="M15 15 20 20M10.5 7.5v6M7.5 10.5h6" /></>}
      {name === "zoom-out" && <><circle {...common} cx="10.5" cy="10.5" r="6" /><path {...common} d="M15 15 20 20M7.5 10.5h6" /></>}
      {name === "link" && <><path {...common} d="m9.4 14.6-1.5 1.5a3.5 3.5 0 0 1-5-5l2.2-2.2a3.5 3.5 0 0 1 5-0.1M14.6 9.4l1.5-1.5a3.5 3.5 0 0 1 5 5l-2.2 2.2a3.5 3.5 0 0 1-5 .1M8.5 15.5l7-7" /></>}
      {name === "unlink" && <><path {...common} d="m9.5 14.5-1.6 1.6a3.5 3.5 0 0 1-5-5l2.2-2.2a3.5 3.5 0 0 1 4.3-.5M14.5 9.5l1.6-1.6a3.5 3.5 0 0 1 5 5l-2.2 2.2a3.5 3.5 0 0 1-4.3.5M4 4l16 16" /></>}
      {name === "close" && <><path {...common} d="m6 6 12 12M18 6 6 18" /></>}
      {name === "refresh" && <><path {...common} d="M19 8a7.5 7.5 0 0 0-13.7-1.8L4 8.5M4 4.5v4h4M5 16a7.5 7.5 0 0 0 13.7 1.8l1.3-2.3M20 19.5v-4h-4" /></>}
      {name === "clock" && <><circle {...common} cx="12" cy="12" r="8.5" /><path {...common} d="M12 7v5l3.2 2" /></>}
      {name === "eye" && <><path {...common} d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z" /><circle {...common} cx="12" cy="12" r="2" /></>}
      {name === "focus" && <><path {...common} d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M8 20H5a1 1 0 0 1-1-1v-3M16 20h3a1 1 0 0 0 1-1v-3" /><circle {...common} cx="12" cy="12" r="3.2" /></>}
      {name === "undo" && <><path {...common} d="M9 7 5 11l4 4" /><path {...common} d="M5.5 11H14a5 5 0 0 1 5 5v1" /></>}
      {name === "redo" && <><path {...common} d="m15 7 4 4-4 4" /><path {...common} d="M18.5 11H10a5 5 0 0 0-5 5v1" /></>}
      {name === "align-left" && <><path {...common} d="M5 6h14M5 10h10M5 14h14M5 18h10" /></>}
      {name === "align-center" && <><path {...common} d="M5 6h14M7 10h10M5 14h14M7 18h10" /></>}
      {name === "align-right" && <><path {...common} d="M5 6h14M9 10h10M5 14h14M9 18h10" /></>}
      {name === "list-bullet" && <><path {...common} d="M9 6h10M9 12h10M9 18h10" /><circle fill="currentColor" stroke="none" cx="5.2" cy="6" r="1" /><circle fill="currentColor" stroke="none" cx="5.2" cy="12" r="1" /><circle fill="currentColor" stroke="none" cx="5.2" cy="18" r="1" /></>}
      {name === "list-number" && <><path {...common} d="M9 6h10M9 12h10M9 18h10" /><path {...common} d="M4.5 7.5V5.2l1.5-.7v3M4.5 10h1.8l-1.8 3h1.9M4.5 16h1.8a1 1 0 0 1 0 2H4.5l1.3-2" /></>}
      {name === "clear-format" && <><path {...common} d="M6 5h12M12 5v14M8.5 19h7" /><path {...common} d="m17 15 4 4M21 15l-4 4" /></>}
      {name === "target" && <><circle {...common} cx="12" cy="12" r="7.5" /><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2" /></>}
      {name === "move" && <><path {...common} d="M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5" /></>}
    </svg>
  );
}
