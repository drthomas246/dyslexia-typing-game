import type { Action, EngineOptions, EngineState } from "@/types/index";
import { useCallback } from "react";
import type { SoundCtl } from "./useSound";

export function useBattle(
  opts: EngineOptions,
  sound: SoundCtl,
  setHurtId: React.Dispatch<React.SetStateAction<number>>,
  setSlashId: React.Dispatch<React.SetStateAction<number>>,
  dispatch: React.Dispatch<Action>
) {
  const battleMode = opts.battleMode ?? true;
  const damagePerMiss = Math.max(1, opts.damagePerMiss ?? 5);
  const damagePerSentence = Math.max(
    1,
    opts.damagePerSentence ?? opts.damagePerHit ?? 10
  );

  const onMiss = useCallback(
    (s: EngineState) => {
      setHurtId((n) => n + 1);
      if (!battleMode) return;
      if (opts.learningMode) return; // 学習モード中はHP減少なし
      sound.sfx.punch();

      const justDied =
        s.playerHp > 0 && Math.max(0, s.playerHp - damagePerMiss) === 0;
      dispatch({ type: "DAMAGE_PLAYER", payload: { amount: damagePerMiss } });

      if (justDied) {
        sound.sfx.fallDown();
        sound.stopBgm();
      }
    },
    [battleMode, damagePerMiss, opts.learningMode, dispatch, setHurtId, sound]
  );

  const onSentenceClear = useCallback(
    (s: EngineState) => {
      if (!battleMode) return;

      if (!opts.learningMode) sound.sfx.slash();
      setSlashId((n) => n + 1);

      const killedNow =
        s.enemyHp > 0 && Math.max(0, s.enemyHp - damagePerSentence) === 0;
      dispatch({
        type: "DAMAGE_ENEMY",
        payload: { amount: damagePerSentence },
      });

      if (killedNow) {
        if (!opts.learningMode) sound.sfx.defeat();
        sound.stopBgm();
      }
    },
    [
      battleMode,
      damagePerSentence,
      opts.learningMode,
      dispatch,
      setSlashId,
      sound,
    ]
  );

  return { onMiss, onSentenceClear };
}
