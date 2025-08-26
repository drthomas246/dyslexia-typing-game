import { Image } from "@chakra-ui/react";
import { motion, useAnimation } from "framer-motion";
const MotionImage = motion(Image);

// 型は useAnimation の戻り値から
type Controls = ReturnType<typeof useAnimation>;

export function TitleOverlay({
  src,
  visible,
  animateCtrl,
}: {
  src: string;
  visible: boolean;
  animateCtrl: Controls; // ← 差し替え
}) {
  if (!visible) return null;

  return (
    <MotionImage
      src={src}
      alt="タイトル"
      pos="absolute"
      inset="0"
      w="100%"
      h="100%"
      objectFit="contain"
      zIndex={6}
      animate={animateCtrl}
      initial={{ scale: 0, opacity: 0, display: "block" }}
      pointerEvents="none"
      style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
    />
  );
}
