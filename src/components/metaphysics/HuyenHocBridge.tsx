import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HuyenHocPanel } from "./HuyenHocPanel";

function findVanNienTarget() {
  return document.querySelector<HTMLElement>(".van-nien-scroll");
}

/**
 * Mount Huyền Học vào chính vùng scroll của tab Vạn Niên mà không sửa CalendarView.
 * Khi rời Vạn Niên, portal tự biến mất; khi quay lại, MutationObserver tự gắn lại.
 */
export function HuyenHocBridge() {
  const [target, setTarget] = useState<HTMLElement | null>(() => findVanNienTarget());

  useEffect(() => {
    const syncTarget = () => setTarget((current) => {
      const next = findVanNienTarget();
      return current === next ? current : next;
    });
    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return target ? createPortal(<HuyenHocPanel />, target) : null;
}
