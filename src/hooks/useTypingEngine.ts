// src/hooks/useTypingEngine.ts
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import type { EngineOptions, EngineState, QAPair } from "@/types/index";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], seed: number) {
  const rng = mulberry32(seed);
  return [...arr].sort(() => rng() - 0.5);
}

export function useTypingEngine(opts: EngineOptions, QA: QAPair[]) {
  const tickMs = Math.max(16, opts.tickMs ?? 100);
  const { speak } = useSpeech();

  const [order, setOrder] = useState<number[]>([]);
  const [state, setState] = useState<EngineState>(() => ({
    started: false,
    finished: false,
    questionJa: "",
    answerEn: "",
    typed: "",
    correctMap: [],
    showHint: !!opts.learningMode,
    index: 0,
    hits: 0,
    errors: 0,
    combo: 0,
    problemHasMistake: false,
    problemUsedHint: !!opts.learningMode,
    hintStep: 0,
    learningPhase: "study",
  }));
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const startedRef = useRef(false);

  const timeLeftSec = useMemo(() => {
    if (opts.learningMode) return opts.durationSec;
    if (!state.started || !state.startAt) return opts.durationSec;
    const elapsedSec = Math.floor((nowMs - state.startAt) / 1000);
    return Math.max(0, opts.durationSec - elapsedSec);
  }, [
    nowMs,
    state.started,
    state.startAt,
    opts.durationSec,
    opts.learningMode,
  ]);

  const initOrder = useCallback(() => {
    const seed = opts.seed ?? Date.now() % 1_000_000;
    const indices = Array.from({ length: QA.length }, (_, i) => i);
    const useRandom = opts.randomOrder ?? true;
    setOrder(useRandom ? shuffle(indices, seed) : indices);
  }, [opts.seed, QA.length, opts.randomOrder]);

  const loadPair = useCallback(
    (nextIdx: number) => {
      const pairIndex = order[nextIdx] ?? 0;
      const pair: QAPair = QA[pairIndex] ?? QA[0];
      const learning = !!opts.learningMode;
      setState((s) => ({
        ...s,
        index: nextIdx,
        questionJa: pair.ja,
        answerEn: pair.en,
        questionImg: pair.img,
        typed: "",
        correctMap: [],
        showHint: learning,
        problemHasMistake: false,
        problemUsedHint: learning,
        hintStep: 0,
        learningPhase: "study",
      }));
    },
    [order, opts.learningMode, QA]
  );

  const start = useCallback(() => {
    initOrder();
    startedRef.current = true;
    const now = Date.now();
    setNowMs(now);
    const learning = !!opts.learningMode;
    setState({
      started: true,
      finished: false,
      startAt: now,
      questionJa: "",
      answerEn: "",
      questionImg: undefined,
      typed: "",
      correctMap: [],
      showHint: learning,
      index: 0,
      hits: 0,
      errors: 0,
      combo: 0,
      problemHasMistake: false,
      problemUsedHint: learning,
      hintStep: 0,
      learningPhase: "study",
    });
  }, [initOrder, opts.learningMode]);

  useEffect(() => {
    if (!state.started || state.finished) return;
    if (opts.learningMode) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [state.started, state.finished, tickMs, opts.learningMode]);

  useEffect(() => {
    if (
      state.started &&
      startedRef.current &&
      order.length > 0 &&
      state.answerEn === ""
    ) {
      loadPair(0);
    }
  }, [state.started, order, state.answerEn, loadPair]);

  const spokenRef = useRef<string>("");
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (!opts.learningMode) return;
    if (!state.answerEn) return;
    if (state.learningPhase !== "study") return;
    const key = `${state.index}:${state.answerEn}`;
    if (spokenRef.current !== key) {
      spokenRef.current = key;
      speak(state.answerEn, { lang: "en-US" });
    }
  }, [
    state.started,
    state.finished,
    state.index,
    state.answerEn,
    opts.learningMode,
    speak,
    state.learningPhase,
  ]);

  useEffect(() => {
    if (!state.started || state.finished) return;
    if (opts.learningMode) return;
    if (timeLeftSec <= 0) setState((s) => ({ ...s, finished: true }));
  }, [timeLeftSec, state.started, state.finished, opts.learningMode]);

  useEffect(() => {
    if (!state.started || state.finished) return;
    const learning = !!opts.learningMode;
    setState((s) => ({
      ...s,
      showHint: s.showHint || learning,
      problemUsedHint: s.problemUsedHint || learning,
    }));
  }, [opts.learningMode, state.started, state.finished]);

  const next = useCallback(() => {
    setState((s) => {
      const disqualified = s.problemHasMistake || s.problemUsedHint;
      const newCombo = disqualified ? 0 : s.combo + 1;
      const hasNext = s.index + 1 < order.length;
      if (!hasNext) {
        return { ...s, combo: newCombo, finished: true };
      }
      const nextIndex = s.index + 1;
      const pairIndex = order[nextIndex] ?? 0;
      const pair: QAPair = QA[pairIndex] ?? QA[0];
      const learning = !!opts.learningMode;
      return {
        ...s,
        combo: newCombo,
        index: nextIndex,
        questionJa: pair.ja,
        answerEn: pair.en,
        questionImg: pair.img,
        typed: "",
        correctMap: [],
        showHint: learning,
        problemHasMistake: false,
        problemUsedHint: learning,
        hintStep: 0,
        learningPhase: "study",
      };
    });
  }, [order, opts.learningMode, QA]);

  const stop = useCallback(() => {
    setState((s) => ({ ...s, finished: true }));
  }, []);

  const setLearningPhase = useCallback(
    (phase: "study" | "recall") => {
      setState((s) => ({
        ...s,
        learningPhase: phase,
        showHint: phase === "study" || !!opts.learningMode,
        typed: "",
        correctMap: [],
        hintStep: 0,
      }));
    },
    [opts.learningMode]
  );

  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      if (key === " ") {
        next();
        return;
      }

      if (key === "\t") {
        const inRecall =
          !!opts.learningMode &&
          !!opts.learnThenRecall &&
          state.learningPhase === "recall";

        // 通常モード or （学習モードでも recall 中）は Tab 有効
        if (!opts.learningMode || inRecall) {
          if (state.hintStep === 0) {
            speak(state.answerEn, { lang: "en-US" }); // 1回目=音声
            setState((s) => ({
              ...s,
              hintStep: 1,
              problemUsedHint: true, // 失格扱い（既に学習モード中は true のはずだが明示）
            }));
          } else if (state.hintStep === 1) {
            setState((s) => ({
              ...s,
              hintStep: 2,
              showHint: true, // 2回目=英語表示
              problemUsedHint: true,
            }));
          }
        }
        return;
      }

      if (key === "\b") {
        if (state.typed.length > 0) {
          setState((s) => ({
            ...s,
            typed: s.typed.slice(0, -1),
            correctMap: s.correctMap.slice(0, -1),
          }));
        }
        return;
      }

      if (key === "\n") return;

      if (state.typed.length >= state.answerEn.length) {
        return;
      }

      const cursor = state.typed.length;
      const res = judgeChar(state.answerEn, cursor, key);

      setState((s) => ({
        ...s,
        typed: s.typed + key,
        correctMap: [...s.correctMap, res.ok],
        hits: s.hits + (res.ok ? 1 : 0),
        errors: s.errors + (res.ok ? 0 : 1),
        problemHasMistake: s.problemHasMistake || !res.ok,
      }));

      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;
      if (completesAllCorrect) {
        // 学習モード＋二段階有効＋study段 → recall段へ
        if (
          opts.learningMode &&
          opts.learnThenRecall &&
          state.learningPhase === "study"
        ) {
          setState((s) => ({
            ...s,
            learningPhase: "recall",
            showHint: false,
            typed: "",
            correctMap: [],
            hintStep: 0,
          }));
          return;
        }
        setTimeout(next, 0);
      }
    },
    [state, next, opts.learningMode, opts.learnThenRecall, speak]
  );

  const wpm = useMemo(() => {
    const elapsedMin = (opts.durationSec - timeLeftSec) / 60;
    return elapsedMin > 0 ? state.hits / 5 / elapsedMin : 0;
  }, [state.hits, opts.durationSec, timeLeftSec]);

  const accuracy = useMemo(() => {
    const total = state.hits + state.errors;
    return total ? (state.hits / total) * 100 : 100;
  }, [state.hits, state.errors]);

  return {
    state,
    timeLeftSec,
    wpm,
    accuracy,
    start,
    stop,
    next,
    onKey,
    setLearningPhase,
  };
}
