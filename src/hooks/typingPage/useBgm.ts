import { Howl } from "howler";
import { useEffect, useRef, useState } from "react";

export function useBgm(opts: {
  src: string;
  loop?: boolean;
  volume?: number;
  enabled: boolean | undefined;
}) {
  const { src, loop = true, volume = 0.4, enabled } = opts;
  const [shouldPlay, setShouldPlay] = useState<boolean | undefined>(enabled);
  const bgmRef = useRef<Howl | null>(null);

  // 外部の enabled が変われば追従
  useEffect(() => {
    setShouldPlay(enabled);
  }, [enabled]);

  useEffect(() => {
    if (shouldPlay) {
      // 既に再生中なら何もしない
      if (bgmRef.current && bgmRef.current.playing()) return;

      // 未生成 or 停止済みなら生成して再生
      if (!bgmRef.current) {
        bgmRef.current = new Howl({
          src: [src],
          loop,
          volume,
          html5: true,
        });
      }
      try {
        if (!bgmRef.current.playing()) {
          bgmRef.current.play();
        }
      } catch {
        /* ignore */
      }
    } else {
      // 停止 & アンロード
      if (bgmRef.current) {
        try {
          bgmRef.current.stop();
          bgmRef.current.unload();
        } catch {
          /* ignore */
        }
        bgmRef.current = null;
      }
    }
    // src/volume/loop 変更時も反映（簡易リセット）
  }, [shouldPlay, src, loop, volume]);

  return { shouldPlay, setShouldPlay };
}
