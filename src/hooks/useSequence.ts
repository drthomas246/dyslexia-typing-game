import { nextFrame, sleep } from "@/lib/nextFrame";
import { preloadImage } from "@/lib/preloadImage";
import type { Controls, useSequenceVisuals } from "@/types/index";
import { useAnimation } from "framer-motion";
import { useCallback, useState } from "react";

export function useSequence(opts: {
  firstPlayed: boolean;
  titleSrc: string;
  onFinishFirst: () => void;
}) {
  const titleCtrl = useAnimation();
  const topCtrl = useAnimation();
  const bottomCtrl = useAnimation();
  const rightCtrl = useAnimation();
  const leftCtrl = useAnimation();

  const [vis, setVis] = useState<useSequenceVisuals>({
    title: true,
    top: true,
    bottom: true,
    right: true,
    left: true,
  });

  const reset = useCallback(async () => {
    titleCtrl.stop();
    topCtrl.stop();
    bottomCtrl.stop();
    rightCtrl.stop();
    leftCtrl.stop();

    setVis({ title: true, top: true, bottom: true, right: true, left: true });

    await Promise.all([
      titleCtrl.set({ scale: 0, opacity: 0, display: "block" }),
      topCtrl.set({ x: 0, y: 0 }),
      bottomCtrl.set({ x: 0, y: 0 }),
      rightCtrl.set({ x: 0, y: 0 }),
      leftCtrl.set({ x: 0, y: 0 }),
    ]);
  }, [titleCtrl, topCtrl, bottomCtrl, rightCtrl, leftCtrl]);

  const start = useCallback(
    async (setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>) => {
      await reset();
      if (!opts.firstPlayed) return;

      await preloadImage(opts.titleSrc);
      await nextFrame();

      await titleCtrl.start({
        scale: 1,
        opacity: 1,
        transition: { duration: 0.9, ease: "easeOut" },
      });

      await sleep(2000);

      await titleCtrl.start({
        opacity: 0,
        transition: { duration: 0.8, ease: "easeInOut" },
      });
      await titleCtrl.set({ display: "none" });
      setVis((v) => ({ ...v, title: false }));

      await topCtrl.start({
        y: "-100%",
        transition: { duration: 1.5, ease: "easeInOut" },
      });
      setVis((v) => ({ ...v, top: false }));

      await bottomCtrl.start({
        y: "100%",
        transition: { duration: 1.0, ease: "easeInOut" },
      });
      setVis((v) => ({ ...v, bottom: false }));

      await rightCtrl.start({
        x: "100%",
        transition: { duration: 1.0, ease: "easeInOut" },
      });
      setVis((v) => ({ ...v, right: false }));

      await leftCtrl.start({
        x: "-100%",
        transition: { duration: 1.0, ease: "easeInOut" },
      });
      setVis((v) => ({ ...v, left: false }));

      setShowTooltip(true);

      opts.onFinishFirst();
    },
    [opts, reset, titleCtrl, topCtrl, bottomCtrl, rightCtrl, leftCtrl]
  );

  return {
    title: { visible: vis.title, ctrl: titleCtrl as Controls },
    top: { visible: vis.top, ctrl: topCtrl as Controls },
    bottom: { visible: vis.bottom, ctrl: bottomCtrl as Controls },
    right: { visible: vis.right, ctrl: rightCtrl as Controls },
    left: { visible: vis.left, ctrl: leftCtrl as Controls },
    start,
    reset,
  };
}
