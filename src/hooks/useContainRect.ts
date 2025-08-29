import type { ContainRect } from "@/types/index";
import { useCallback, useEffect, useState, type RefObject } from "react";

export function useContainRect(
  imgRef: RefObject<HTMLImageElement | null>,
  wrapRef: RefObject<HTMLDivElement | null>
) {
  const [rect, setRect] = useState<ContainRect>({ x: 0, y: 0, w: 0, h: 0 });

  const compute = useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img || !img.naturalWidth || !img.naturalHeight) return;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const rImg = img.naturalWidth / img.naturalHeight;
    const rCon = cw / ch;

    let w = 0,
      h = 0,
      x = 0,
      y = 0;
    if (rCon > rImg) {
      h = ch;
      w = h * rImg;
      x = (cw - w) / 2;
      y = 0;
    } else {
      w = cw;
      h = w / rImg;
      x = 0;
      y = (ch - h) / 2;
    }
    setRect({ x, y, w, h });
  }, [imgRef, wrapRef]);

  useEffect(() => {
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [compute]);

  return { rect, compute };
}
