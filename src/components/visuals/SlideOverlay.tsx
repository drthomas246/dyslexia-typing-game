import type { SlideOverlayProps } from "@/types/index";
import { Image } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionImage = motion(Image);

export function SlideOverlay({
  side,
  src,
  visible,
  animateCtrl,
}: SlideOverlayProps) {
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
