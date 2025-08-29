import type { BattleArenaProps } from "@/types/index";
import { Box, HStack } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import DamageMotion from "./DamageMotion";
import EnemyHpBar from "./EnemyHpBar";
import EnemyLayer from "./EnemyLayer";
import QuestionPanel from "./QuestionPanel";

const MotionDiv = motion.div;

const BattleArena = forwardRef<HTMLDivElement, BattleArenaProps>(
  (
    {
      enemyImg,
      backgroundImg,
      hurtId,
      vanishId,
      vanished,
      slashId,
      onVanishDone,
      questionText,
      questionImg,
      state,
      enemyHpPct,
      arenaRef,
    },
    ref
  ) => {
    return (
      <Box
        rounded="xl"
        borderWidth="1px"
        p="4"
        bg="bg.subtle"
        h="calc(100vh - 293px)"
      >
        <HStack gap="16px" h="calc(100vh - 367px)" mb="16px">
          <Box
            ref={ref}
            mx="auto"
            w="100%"
            h="calc(100vh - 367px)"
            rounded="2xl"
            borderWidth="1px"
            overflow="hidden"
            bg="blackAlpha.50"
            position="relative"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {hurtId > 0 ? (
                <MotionDiv
                  key={`shake-${hurtId}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                  }}
                  initial={{ x: 0 }}
                  animate={{ x: [0, -14, 14, -10, 10, -6, 6, 0] }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  exit={{ x: 0 }}
                >
                  <EnemyLayer
                    backgroundImg={backgroundImg}
                    enemyImg={enemyImg}
                    vanishId={vanishId}
                    vanished={vanished}
                    onVanishDone={onVanishDone}
                  />
                </MotionDiv>
              ) : (
                <Box w="100%" h="100%" position="relative">
                  <EnemyLayer
                    backgroundImg={backgroundImg}
                    enemyImg={enemyImg}
                    vanishId={vanishId}
                    vanished={vanished}
                    onVanishDone={onVanishDone}
                  />
                </Box>
              )}
            </AnimatePresence>

            {/* エフェクト層（斬撃/被弾） */}
            <DamageMotion
              arenaRef={arenaRef}
              slashId={slashId}
              hurtId={hurtId}
            />
          </Box>

          {/* 右側の問題パネルは親側で配置 */}
          <QuestionPanel
            questionText={questionText}
            questionImg={questionImg}
          />
        </HStack>
        <EnemyHpBar
          current={state.enemyHp}
          max={state.enemyMaxHp}
          pct={enemyHpPct}
        />
      </Box>
    );
  }
);

export default BattleArena;
