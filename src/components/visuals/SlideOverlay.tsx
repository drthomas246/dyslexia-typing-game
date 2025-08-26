import { Image } from "@chakra-ui/react";
import { motion, useAnimation } from "framer-motion"; // ★ 型は useAnimation から作る
const MotionImage = motion(Image);

// useAnimation の戻り値型を使ってコントロール型を定義
type Controls = ReturnType<typeof useAnimation>;

export function SlideOverlay({
  side,
  src,
  visible,
  animateCtrl,
}: {
  side: "top" | "bottom" | "left" | "right";
  src: string;
  visible: boolean;
  animateCtrl: Controls; // ★ ここを AnimationControls → Controls に
}) {
  if (!visible) return null;
  const zIndex =
    side === "top" ? 5 : side === "bottom" ? 4 : side === "right" ? 3 : 2;

  return (
    <MotionImage
      src={src}
      alt={side}
      pos="absolute"
      inset="0"
      w="100%"
      h="100%"
      objectFit="contain"
      zIndex={zIndex}
      animate={animateCtrl}
      pointerEvents="none"
    />
  );
}
