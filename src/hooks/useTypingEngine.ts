// src/hooks/useTypingEngine.ts
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import type { EngineOptions, EngineState, QAPair } from "@/types/index";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** EngineOptions/State を壊さず拡張するためのローカル型 */
type EngineOptionsEx = EngineOptions & {
  /** ドラクエ風バトル（HP制）を有効化。既定: true */
  battleMode?: boolean;
  /** プレイヤー/敵の最大HP（既定: 100） */
  playerMaxHp?: number;
  enemyMaxHp?: number;
  /** 正打/ミス1回あたりのダメージ（既定: 正打2 / ミス5） */
  damagePerHit?: number;
  damagePerMiss?: number;
};

type EngineStateEx = EngineState & {
  /** HP 系と勝敗（バトル用） */
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  /** true=勝利 / false=敗北 / undefined=未決 */
  victory?: boolean;
};

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

export function useTypingEngine(
  opts: EngineOptionsEx,
  QA: QAPair[],
  setSlashId: React.Dispatch<React.SetStateAction<number>>,
  setHurtId: React.Dispatch<React.SetStateAction<number>>
) {
  const tickMs = Math.max(16, opts.tickMs ?? 100);
  const { speak } = useSpeech();

  // バトル系オプション（デフォルト値をここで確定）
  const battleMode = opts.battleMode ?? true;
  const playerMaxHp = Math.max(1, opts.playerMaxHp ?? 100);
  const enemyMaxHp = Math.max(1, opts.enemyMaxHp ?? 100);
  const damagePerMiss = Math.max(1, opts.damagePerMiss ?? 5);

  // damagePerHit を「文クリア時の敵ダメージ」として使う
  // もし専用を用意したい場合は opts.damagePerSentence を見てください（なければ既存値/10にフォールバック）
  const damagePerSentence = Math.max(
    1,
    opts.damagePerSentence ?? opts.damagePerHit ?? 10
  );

  const [order, setOrder] = useState<number[]>([]);
  const [state, setState] = useState<EngineStateEx>(() => ({
    started: false,
    finished: false,
    // EngineState 由来
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
    playerHp: playerMaxHp,
    enemyHp: enemyMaxHp,
    playerMaxHp,
    enemyMaxHp,
    victory: undefined,
  }));
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const startedRef = useRef(false);

  // バトル中はタイマー固定（使わない）。それ以外は従来通り。
  const timeLeftSec = useMemo(() => {
    if (battleMode) return opts.durationSec;
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
    battleMode,
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
      // 以降リセット
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
      // HP 初期化
      playerHp: playerMaxHp,
      enemyHp: enemyMaxHp,
      playerMaxHp,
      enemyMaxHp,
      victory: undefined,
    } as EngineStateEx);
  }, [initOrder, opts.learningMode, playerMaxHp, enemyMaxHp]);

  // 通常モード時のみタイマー更新（バトル/学習は停止）
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (battleMode || opts.learningMode) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [state.started, state.finished, tickMs, opts.learningMode, battleMode]);

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

  // 学習モード: study 段のみ出題確定時に読み上げ
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

  // タイムアップ（バトル/学習では無効）
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (battleMode || opts.learningMode) return;
    if (timeLeftSec <= 0)
      setState(
        (s) =>
          ({ ...s, finished: true, victory: s.enemyHp <= 0 } as EngineStateEx)
      );
  }, [
    timeLeftSec,
    state.started,
    state.finished,
    opts.learningMode,
    battleMode,
  ]);

  // 学習モードの途中切替を同期
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
        return {
          ...s,
          combo: newCombo,
          finished: true,
          victory: s.enemyHp <= 0,
        } as EngineStateEx;
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
      } as EngineStateEx;
    });
  }, [order, opts.learningMode, QA]);

  const stop = useCallback(() => {
    setState(
      (s) =>
        ({ ...s, finished: true, victory: s.enemyHp <= 0 } as EngineStateEx)
    );
  }, []);

  const setLearningPhase = useCallback(
    (phase: "study" | "recall") => {
      setState(
        (s) =>
          ({
            ...s,
            learningPhase: phase,
            showHint: phase === "study" || !!opts.learningMode,
            typed: "",
            correctMap: [],
            hintStep: 0,
          } as EngineStateEx)
      );
    },
    [opts.learningMode]
  );

  // applyBattleDamage を削除/未使用化し、代わりに2関数を定義
  const damagePlayerOnMiss = useCallback(() => {
    if (!battleMode) return;
    // 学習モード中はHPを減らさない
    if (opts.learningMode) return;
    setState((s) => {
      if (s.finished) return s;
      const playerHp = Math.max(0, s.playerHp - damagePerMiss);
      const finished = playerHp <= 0 || s.enemyHp <= 0;
      return {
        ...s,
        playerHp,
        finished: finished ? true : s.finished,
        victory: finished ? (s.enemyHp > 0 ? false : s.victory) : s.victory,
      };
    });
  }, [battleMode, damagePerMiss, opts.learningMode]);

  const damageEnemyOnSentence = useCallback(() => {
    if (!battleMode) return;
    setState((s) => {
      if (s.finished) return s;
      const enemyHp = Math.max(0, s.enemyHp - damagePerSentence);
      const finished = s.playerHp <= 0 || enemyHp <= 0;
      return {
        ...s,
        enemyHp,
        finished: finished ? true : s.finished,
        victory: finished ? enemyHp <= 0 && s.playerHp > 0 : s.victory,
      };
    });
  }, [battleMode, damagePerSentence]);

  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      // Space: 次の問題
      if (key === " ") {
        next();
        return;
      }

      // Tab: 通常 or（学習モードでも recall 中）は段階ヒント
      if (key === "\t") {
        const inRecall =
          !!opts.learningMode &&
          !!opts.learnThenRecall &&
          state.learningPhase === "recall";
        if (!opts.learningMode || inRecall) {
          if (state.hintStep === 0) {
            speak(state.answerEn, { lang: "en-US" });
            setState(
              (s) =>
                ({ ...s, hintStep: 1, problemUsedHint: true } as EngineStateEx)
            );
            setHurtId((n) => n + 1);
            damagePlayerOnMiss();
          } else if (state.hintStep === 1) {
            setState(
              (s) =>
                ({
                  ...s,
                  hintStep: 2,
                  showHint: true,
                  problemUsedHint: true,
                } as EngineStateEx)
            );
            setHurtId((n) => n + 1);
            damagePlayerOnMiss();
          }
        }
        return;
      }

      // Backspace
      if (key === "\b") {
        if (state.typed.length > 0) {
          setState(
            (s) =>
              ({
                ...s,
                typed: s.typed.slice(0, -1),
                correctMap: s.correctMap.slice(0, -1),
              } as EngineStateEx)
          );
        }
        return;
      }

      // Enter: Stop は App 側で
      if (key === "\n") return;

      // 既に正解長に達していたら無視
      if (state.typed.length >= state.answerEn.length) return;

      // 判定
      const cursor = state.typed.length;
      const res = judgeChar(state.answerEn, cursor, key);

      setState(
        (s) =>
          ({
            ...s,
            typed: s.typed + key,
            correctMap: [...s.correctMap, res.ok],
            hits: s.hits + (res.ok ? 1 : 0),
            errors: s.errors + (res.ok ? 0 : 1),
            problemHasMistake: s.problemHasMistake || !res.ok,
          } as EngineStateEx)
      );

      // ダメージ適用
      if (!res.ok) {
        setHurtId((n) => n + 1);
        damagePlayerOnMiss();
      }

      // 全字正解なら自動で次へ（学習2段階あり）
      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;
      if (completesAllCorrect) {
        // 学習モード＋learnThenRecall＋study → recall 遷移
        if (
          opts.learningMode &&
          opts.learnThenRecall &&
          state.learningPhase === "study"
        ) {
          setState(
            (s) =>
              ({
                ...s,
                learningPhase: "recall",
                showHint: false,
                typed: "",
                correctMap: [],
                hintStep: 0,
              } as EngineStateEx)
          );
          return;
        }
        // 文クリア時の敵ダメージをここで適用
        setSlashId((n) => n + 1);
        damageEnemyOnSentence();
        setTimeout(next, 0);
      }
    },
    [
      state,
      next,
      opts.learningMode,
      speak,
      opts.learnThenRecall,
      damagePlayerOnMiss,
      damageEnemyOnSentence,
      setSlashId,
      setHurtId,
    ]
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
