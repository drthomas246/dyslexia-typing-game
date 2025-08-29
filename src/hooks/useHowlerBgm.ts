import type { useHowlerBgmOpts } from "@/types/index";
import type { Howl } from "howler";
import { Howler, Howl as HowlerHowl } from "howler";
import { useCallback, useEffect, useRef } from "react";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function useHowlerBgm({
  src,
  defaultVolume = 0.5,
  loop = true,
}: useHowlerBgmOpts) {
  const howlRef = useRef<Howl | null>(null);
  const targetRef = useRef(clamp01(defaultVolume)); // 基準音量
  const fadingRef = useRef(false);
  const EPS = 0.005;

  useEffect(() => {
    if (Howler.volume() === 0) Howler.volume(1.0);
  }, []);

  useEffect(() => {
    const h = new HowlerHowl({
      src: [src],
      loop,
      volume: clamp01(targetRef.current),
      preload: true,
      html5: false,
    });
    howlRef.current = h;
    return () => {
      h.stop();
      h.unload();
      howlRef.current = null;
    };
  }, [src, loop]);

  const setTargetVolume = useCallback((v: number) => {
    const vv = clamp01(v);
    targetRef.current = vv;
    const h = howlRef.current;
    if (h && !fadingRef.current) h.volume(vv);
  }, []);

  const getTargetVolume = useCallback(() => targetRef.current, []);

  /** 冪等な再生：未再生なら0→targetで再生、再生中なら必要時のみ現在値→targetへ */
  const ensurePlaying = useCallback((ms = 800, to?: number) => {
    const h = howlRef.current;
    if (!h) return;
    const target = clamp01(to ?? targetRef.current);
    const cur = h.volume();

    if (!h.playing()) {
      h.volume(0);
      h.play();
      if (ms > 0) {
        fadingRef.current = true;
        h.fade(0, target, ms);
        h.once("fade", () => {
          fadingRef.current = false;
        });
      } else {
        h.volume(target);
      }
      return;
    }

    if (Math.abs(cur - target) > EPS) {
      if (ms > 0) {
        fadingRef.current = true;
        h.fade(cur, target, ms);
        h.once("fade", () => {
          fadingRef.current = false;
        });
      } else {
        h.volume(target);
      }
    }
  }, []);

  /** フェードアウト停止（停止後に基準音量へ戻す） */
  const fadeOutStop = useCallback((ms = 500) => {
    const h = howlRef.current;
    if (!h || !h.playing()) return;
    const cur = h.volume();
    if (cur <= EPS) {
      h.stop();
      h.volume(targetRef.current);
      return;
    }
    fadingRef.current = true;
    h.fade(cur, 0, ms);
    h.once("fade", () => {
      h.stop();
      h.volume(targetRef.current);
      fadingRef.current = false;
    });
  }, []);

  const stopNow = useCallback(() => {
    const h = howlRef.current;
    if (!h) return;
    h.stop();
    h.volume(targetRef.current);
  }, []);

  return {
    howl: howlRef.current,
    ensurePlaying, // ★ 新API（冪等）
    fadeOutStop,
    stopNow,
    setTargetVolume,
    getTargetVolume,
  };
}
