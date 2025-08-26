// src/hooks/engine/useInput.ts
import type {
  Action,
  EngineOptions,
  EngineState,
  LearningPhase,
} from "@/types/index";
import { useCallback } from "react";

type JudgeFn = (answer: string, cursor: number, key: string) => { ok: boolean };

export function useInput(params: {
  state: EngineState;
  opts: EngineOptions;
  dispatch: React.Dispatch<Action>;
  judgeChar: JudgeFn;
  speak: (text: string, opts?: { lang?: string }) => void;
  onMiss: (s: EngineState) => void;
  onSentenceClear: (s: EngineState) => void;
  next: () => void;
  setPhase: (phase: LearningPhase) => void;
}) {
  const {
    state,
    opts,
    dispatch,
    judgeChar,
    speak,
    onMiss,
    onSentenceClear,
    next,
    setPhase,
  } = params;

  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      // Space: 次へ
      if (key === " ") {
        dispatch({ type: "TALLY_QUESTION" });
        next();
        return;
      }

      // Tab: 段階ヒント（学習モード recall 中も可）
      if (key === "\t") {
        const inRecall =
          !!opts.learningMode &&
          !!opts.learnThenRecall &&
          state.learningPhase === "recall";
        if (!opts.learningMode || inRecall) {
          if (state.hintStep === 0) {
            try {
              speak(state.answerEn, { lang: "en-US" });
            } catch {
              speak(state.answerEn, { lang: "en-US" });
            }
            dispatch({
              type: "SET_HINT_STEP",
              payload: { step: 1, markUsedHint: true },
            });
            if (!opts.learningMode) onMiss(state);
          } else if (state.hintStep === 1) {
            dispatch({
              type: "SET_HINT_STEP",
              payload: { step: 2, showHint: true, markUsedHint: true },
            });
            if (!opts.learningMode) onMiss(state);
          }
        }
        return;
      }

      // Backspace
      if (key === "\b") {
        if (state.typed.length > 0) dispatch({ type: "BACKSPACE" });
        return;
      }

      // Enter は App 側で Stop
      if (key === "\n") return;

      // 既に正解長に達していれば無視
      if (state.typed.length >= state.answerEn.length) return;

      // 1文字判定
      const cursor = state.typed.length;
      const res = judgeChar(state.answerEn, cursor, key);
      dispatch({ type: "TYPE_CHAR", payload: { key, ok: res.ok } });

      // ミス時は即ダメージ（学習モードは無効）
      if (!res.ok) {
        onMiss(state);
      }

      // 全文字正解 → 敵ダメージ or recall へ → 次へ/待機
      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;

      if (!completesAllCorrect) return;

      // learn-then-recall の study 段はダメージせず recall へ
      if (
        opts.learningMode &&
        opts.learnThenRecall &&
        state.learningPhase === "study"
      ) {
        setPhase("recall");
        return;
      }

      onSentenceClear(state);
      // 次へ（集計はNEXT前に）
      dispatch({ type: "TALLY_QUESTION" });
      next();
    },
    [
      state,
      opts.learningMode,
      opts.learnThenRecall,
      dispatch,
      judgeChar,
      speak,
      onMiss,
      onSentenceClear,
      next,
      setPhase,
    ]
  );

  return { onKey };
}
