import type { Howl } from "howler";
import { Howl as HowlerHowl } from "howler";
import { useEffect, useRef } from "react";

export function useHowlerOneShot(src: string, volume = 1.0) {
  const ref = useRef<Howl | null>(null);

  useEffect(() => {
    const h = new HowlerHowl({ src: [src], volume, preload: true });
    ref.current = h;
    return () => {
      h.unload();
      ref.current = null;
    };
  }, [src, volume]);

  return { play: () => ref.current?.play() };
}
