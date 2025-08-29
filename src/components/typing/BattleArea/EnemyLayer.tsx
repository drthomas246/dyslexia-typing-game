import type { EnemyLayerProps } from "@/types/index";
import { Image } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionImg = motion.img;

export default function EnemyLayer({
  backgroundImg,
  enemyImg,
  vanishId,
  vanished,
  onVanishDone,
}: EnemyLayerProps) {
  return (
    <>
      <Image
        src={backgroundImg}
        alt="Background"
        fit="cover"
        w="100%"
        h="100%"
      />
      {!vanished && (
        <MotionImg
          key={`monster-${vanishId}`}
          src={enemyImg}
          alt="Enemy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          initial={{ opacity: 1, scale: 1, x: 0 }}
          animate={{
            opacity: vanishId > 0 ? [1, 1, 0] : 1,
            x:
              vanishId > 0
                ? [0, -20, 20, -18, 18, -15, 15, -10, 10, -5, 5, 0]
                : 0,
            scale: vanishId > 0 ? 0.95 : 1,
          }}
          transition={{
            opacity: { duration: 1.2, ease: "easeOut", times: [0, 0.6, 1] },
            x: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 1.2, ease: "easeOut" },
          }}
          onAnimationComplete={() => {
            if (vanishId > 0) onVanishDone();
          }}
        />
      )}
    </>
  );
}
