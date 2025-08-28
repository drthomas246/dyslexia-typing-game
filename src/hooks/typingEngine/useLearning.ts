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
      // learnThenRecall の意図を反映した showHint を計算
      const learning = !!opts.learningMode;
      const learnThenRecall = !!opts.learnThenRecall;

      // 基本：study なら表示、recall なら非表示（ただし Tab 2 段階目は別途 SET_HINT_STEP 側で表示に）
      const baseShow = learning ? !learnThenRecall || phase === "study" : false;

      dispatch({
        type: "SET_PHASE",
        payload: {
          phase,
          showHint: baseShow,
        },
      });
    },
    [dispatch, opts.learningMode, opts.learnThenRecall]
  );

  // 学習モードの途中切替を同期（learnThenRecall も渡す）
  useEffect(() => {
    if (!state.started || state.finished) return;
    dispatch({
      type: "SYNC_LEARNING_TOGGLE",
      payload: {
        learning: !!opts.learningMode,
        learnThenRecall: !!opts.learnThenRecall,
      },
    });
  }, [
    state.started,
    state.finished,
    dispatch,
    opts.learningMode,
    opts.learnThenRecall,
  ]);

  return { setPhase };
}
