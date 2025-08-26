// src/hooks/engine/useLearning.ts
import type {
  Action,
  EngineOptions,
  EngineState,
  LearningPhase,
} from "@/types/index";
import { useCallback, useEffect } from "react";

export function useLearning(params: {
  state: EngineState;
  dispatch: React.Dispatch<Action>;
  opts: EngineOptions;
}) {
  const { state, dispatch, opts } = params;

  const setPhase = useCallback(
    (phase: LearningPhase) => {
      dispatch({
        type: "SET_PHASE",
        payload: {
          phase,
          showHint: phase === "study" || !!opts.learningMode,
        },
      });
    },
    [dispatch, opts.learningMode]
  );

  // 学習モードの途中切替を同期
  useEffect(() => {
    if (!state.started || state.finished) return;
    dispatch({
      type: "SYNC_LEARNING_TOGGLE",
      payload: { learning: !!opts.learningMode },
    });
  }, [state.started, state.finished, dispatch, opts.learningMode]);

  return { setPhase };
}
