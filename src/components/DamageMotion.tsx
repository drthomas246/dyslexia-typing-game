import { Box } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DamageMotion({
  arenaRef,
  slashId,
  hurtId,
}: {
  arenaRef: HTMLDivElement | null;
  slashId: number;
  hurtId: number;
}) {
  const [travel, setTravel] = useState(400); // フォールバック距離
  useEffect(() => {
    if (!arenaRef) return;
    const el = arenaRef;

    const update = () => {
      const rect = el.getBoundingClientRect();
      // 中心から外へ抜ける長さ（対角の半分 + マージン）
      const d = Math.hypot(rect.width, rect.height) / 2 + 60;
      setTravel(d);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [arenaRef]);
  return (
    <>
      <AnimatePresence>
        {/* 斬撃エフェクト（クリックで再生） */}
        {slashId > 0 && (
          <Box
            position="absolute"
            inset="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
            zIndex={10}
          >
            <motion.div
              key={slashId}
              style={{
                width: "160%", // 対角よりやや長く
                height: "12px",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(255,0,0,0) 0%, rgba(255,0,0,1) 50%, rgba(255,0,0,0) 100%)",
                boxShadow:
                  "0 0 8px rgba(255,0,0,0.9), 0 0 16px rgba(255,0,0,0.6)",
                transformOrigin: "center",
              }}
              initial={{
                opacity: 0,
                rotate: -45,
                x: +travel,
                y: -travel,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                rotate: -45,
                x: -travel,
                y: +travel,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              exit={{ opacity: 0, rotate: -45 }}
            />
          </Box>
        )}
      </AnimatePresence>
      {/* ★ ダメージの赤フラッシュ */}
      <AnimatePresence>
        {hurtId > 0 && (
          <motion.div
            key={`flash-${hurtId}`}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,0,0,0.35)", // 透過赤
              pointerEvents: "none",
              zIndex: 15, // 画像より前、斬撃より後にしたいなら 9〜11 に調整
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.6,
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut",
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
