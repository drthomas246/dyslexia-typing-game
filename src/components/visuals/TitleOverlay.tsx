import type { TitleOverlayProps } from "@/types/index";
import { Image } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionImage = motion(Image);

export function TitleOverlay({ src, visible, animateCtrl }: TitleOverlayProps) {
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
      zIndex={60}
      animate={animateCtrl}
      initial={{ scale: 0, opacity: 0, display: "block" }}
      pointerEvents="none"
      style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
    />
  );
}
