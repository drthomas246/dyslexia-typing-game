// src/hooks/useTypingEngine.ts
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import type { EngineOptionsEx, EngineStateEx, QAPair } from "@/types/index";
import { Howl } from "howler";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** 擬似乱数 */
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
  setHurtId: React.Dispatch<React.SetStateAction<number>>,
  setVanishId: React.Dispatch<React.SetStateAction<number>>,
  setVanished: React.Dispatch<React.SetStateAction<boolean>>
) {
  const tickMs = Math.max(16, opts.tickMs ?? 100);
  const { speak } = useSpeech();

  // ====== バトル系オプション ======
  const battleMode = opts.battleMode ?? true;
  const playerMaxHp = Math.max(1, opts.playerMaxHp ?? 100);
  const enemyMaxHp = Math.max(1, opts.enemyMaxHp ?? 100);
  const damagePerMiss = Math.max(1, opts.damagePerMiss ?? 5);
  const damagePerSentence = Math.max(
    1,
    opts.damagePerSentence ?? opts.damagePerHit ?? 10
  );

  // ====== BGM / SFX ======
  const bgmEnabled = opts.bgm ?? true;
  const bgmSrc = opts.bgmSrc ?? "./music/bgm/battle.mp3";
  const bgmVolume = Math.min(1, Math.max(0, opts.bgmVolume ?? 0.5));
  const bgmRef = useRef<Howl | null>(null);

  const playBgm = useCallback(() => {
    if (!bgmEnabled) return;
    if (bgmRef.current && bgmRef.current.playing()) return;
    if (bgmRef.current) {
      try {
        bgmRef.current.stop();
        bgmRef.current.unload();
      } catch {
        return;
      }
      bgmRef.current = null;
    }
    const howl = new Howl({
      src: [bgmSrc],
      loop: true,
      volume: bgmVolume,
      html5: true,
    });
    bgmRef.current = howl;
    howl.play();
  }, [bgmEnabled, bgmSrc, bgmVolume]);

  const stopBgm = useCallback(() => {
    if (!bgmRef.current) return;
    try {
      bgmRef.current.stop();
      bgmRef.current.unload();
    } catch {
      return;
    }
    bgmRef.current = null;
  }, []);

  // 短い効果音
  const sfxEnabled = opts.sfx ?? true;
  const sfxVolume = Math.min(1, Math.max(0, opts.sfxVolume ?? 0.8));
  const sfxSlashSrc =
    opts.sfxSlashSrc ?? "./music/soundEffects/killInSword.mp3"; // 敵へダメージ
  const sfxPunchSrc = opts.sfxPunchSrc ?? "./music/soundEffects/punch.mp3"; // 自分ダメージ
  const sfxDefeatSrc = opts.sfxDefeatSrc ?? "./music/soundEffects/defeat.mp3"; // 敵撃破
  const sfxEscapeSrc = opts.sfxEscapeSrc ?? "./music/soundEffects/escape.mp3"; // 逃げる
  const sfxFallDownSrc =
    opts.sfxFallDownSrc ?? "./music/soundEffects/fallDown.mp3"; // 戦闘不能

  const sfxSlashRef = useRef<Howl | null>(null);
  const sfxPunchRef = useRef<Howl | null>(null);
  const sfxDefeatRef = useRef<Howl | null>(null);
  const sfxEscapeRef = useRef<Howl | null>(null);
  const sfxFallDownRef = useRef<Howl | null>(null);

  // --- SFX: 汎用 & 個別を useCallback 化 ---
  const playSfx = useCallback(
    (ref: React.RefObject<Howl | null>, src: string) => {
      if (!sfxEnabled) return;
      if (!ref.current) {
        ref.current = new Howl({ src: [src], volume: sfxVolume, html5: true });
      }
      try {
        ref.current.play();
      } catch {
        return;
      }
    },
    [sfxEnabled, sfxVolume]
  );

  const playSfxSlash = useCallback(
    () => playSfx(sfxSlashRef, sfxSlashSrc),
    [playSfx, sfxSlashSrc]
  );
  const playSfxPunch = useCallback(
    () => playSfx(sfxPunchRef, sfxPunchSrc),
    [playSfx, sfxPunchSrc]
  );
  const playSfxDefeat = useCallback(
    () => playSfx(sfxDefeatRef, sfxDefeatSrc),
    [playSfx, sfxDefeatSrc]
  );
  const playSfxEscape = useCallback(
    () => playSfx(sfxEscapeRef, sfxEscapeSrc),
    [playSfx, sfxEscapeSrc]
  );
  const playSfxFallDown = useCallback(
    () => playSfx(sfxFallDownRef, sfxFallDownSrc),
    [playSfx, sfxFallDownSrc]
  );

  // ====== ステート ======
  const [order, setOrder] = useState<number[]>([]);
  const [state, setState] = useState<EngineStateEx>(() => ({
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
    playerHp: playerMaxHp,
    enemyHp: enemyMaxHp,
    playerMaxHp,
    enemyMaxHp,
    victory: undefined,
    playCount: 0,
    usedHintCount: 0,
    mistakeProblemCount: 0,
  }));
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [playCount, setPlayCount] = useState(0);
  const startedRef = useRef(false);
  const talliedFinalRef = useRef(false);

  // ====== 経過時間（唯一の時間指標） ======
  const actualTimeSec = useMemo(() => {
    if (!state.started || !state.startAt) return 0;
    return Math.max(0, Math.floor((nowMs - state.startAt) / 1000));
  }, [state.started, state.startAt, nowMs]);

  // 並び順
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

  // 開始
  const start = useCallback(() => {
    setPlayCount((e) => e + 1);
    talliedFinalRef.current = false;
    setVanishId(0);
    setVanished(false);
    initOrder();

    if (!opts.learningMode) playBgm();

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
      playerHp: playerMaxHp,
      enemyHp: enemyMaxHp,
      playerMaxHp,
      enemyMaxHp,
      victory: undefined,
      playCount,
      usedHintCount: 0,
      mistakeProblemCount: 0,
    } as EngineStateEx);
  }, [
    initOrder,
    opts.learningMode,
    playerMaxHp,
    enemyMaxHp,
    setVanishId,
    setVanished,
    playCount,
    playBgm,
  ]);

  // タイマー（全モードで経過時間を進める）
  useEffect(() => {
    if (!state.started || state.finished) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [state.started, state.finished, tickMs]);

  // 初回ロード
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

  // 学習モード: study 段で読み上げ
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

  // 次の問題へ（前問のフラグ加算 → ロード）
  const next = useCallback(() => {
    setState((s) => {
      const addHint = s.problemUsedHint ? 1 : 0;
      const addMist = s.problemHasMistake ? 1 : 0;

      const disqualified = s.problemHasMistake || s.problemUsedHint;
      const newCombo = disqualified ? 0 : s.combo + 1;
      const hasNext = s.index + 1 < order.length;

      if (!hasNext) {
        stopBgm();
        return {
          ...s,
          usedHintCount: s.usedHintCount + addHint,
          mistakeProblemCount: s.mistakeProblemCount + addMist,
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
        usedHintCount: s.usedHintCount + addHint,
        mistakeProblemCount: s.mistakeProblemCount + addMist,
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
  }, [order, opts.learningMode, QA, stopBgm]);

  // 停止（逃げる/ユーザ停止/勝敗確定）
  const stop = useCallback(
    (reason?: "escape" | "user" | "dead" | "victory") => {
      if (!talliedFinalRef.current) {
        setState((s) => ({
          ...s,
          usedHintCount: s.usedHintCount + (s.problemUsedHint ? 1 : 0),
          mistakeProblemCount:
            s.mistakeProblemCount + (s.problemHasMistake ? 1 : 0),
        }));
        talliedFinalRef.current = true;
      }

      if (reason === "escape" && !opts.learningMode) {
        try {
          playSfxEscape();
        } catch {
          return;
        }
      }

      stopBgm();

      setState((s) => {
        if (s.finished) return s;
        let victory = s.victory;
        if (reason === "escape") victory = false;
        if (reason === "dead") victory = false;
        if (reason === "victory") victory = true;
        return { ...s, finished: true, victory } as EngineStateEx;
      });
    },
    [opts.learningMode, playSfxEscape, stopBgm]
  );

  // 自分ダメージ（ミス/ヒント時）。学習モードではHP減少なし
  const damagePlayerOnMiss = useCallback(() => {
    setHurtId((n) => n + 1);
    if (!battleMode) return;
    if (opts.learningMode) return;
    playSfxPunch();

    setState((s) => {
      if (s.finished) return s;
      const playerHp = Math.max(0, s.playerHp - damagePerMiss);
      const justDied = s.playerHp > 0 && playerHp === 0;

      if (justDied) {
        // 外側の try/catch は不要（内部で安全に処理）
        playSfxFallDown();
        stopBgm();
      }

      const finished = playerHp <= 0 || s.enemyHp <= 0;
      return {
        ...s,
        playerHp,
        finished: finished ? true : s.finished,
        victory: finished ? (s.enemyHp > 0 ? false : s.victory) : s.victory,
      };
    });
  }, [
    battleMode,
    damagePerMiss,
    opts.learningMode,
    setHurtId,
    playSfxPunch,
    playSfxFallDown,
    stopBgm,
  ]);

  // 敵ダメージ（文クリア時）
  const damageEnemyOnSentence = useCallback(() => {
    if (!battleMode) return;

    if (!opts.learningMode) playSfxSlash();

    setState((s) => {
      if (s.finished) return s;

      const newEnemyHp = Math.max(0, s.enemyHp - damagePerSentence);
      const killedNow = s.enemyHp > 0 && newEnemyHp === 0;

      if (killedNow) {
        if (!opts.learningMode) {
          // 外側の try/catch は不要（内部で安全に処理）
          playSfxDefeat();
        }
        // 同上
        stopBgm();
      }

      const finished = s.playerHp <= 0 || newEnemyHp <= 0;
      return {
        ...s,
        enemyHp: newEnemyHp,
        finished: finished ? true : s.finished,
        victory: finished ? newEnemyHp <= 0 && s.playerHp > 0 : s.victory,
      };
    });
  }, [
    battleMode,
    damagePerSentence,
    opts.learningMode,
    playSfxSlash,
    playSfxDefeat,
    stopBgm,
  ]);

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

  // 入力処理
  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      // Space: 次へ
      if (key === " ") {
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
            speak(state.answerEn, { lang: "en-US" });
            setState(
              (s) =>
                ({ ...s, hintStep: 1, problemUsedHint: true } as EngineStateEx)
            );
            if (!opts.learningMode) damagePlayerOnMiss();
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
            if (!opts.learningMode) damagePlayerOnMiss();
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

      // Enter は App 側で Stop
      if (key === "\n") return;

      // 既に正解長に達していれば無視
      if (state.typed.length >= state.answerEn.length) return;

      // 1文字判定
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

      // ミス時は即ダメージ（学習モードは無効）
      if (!res.ok) damagePlayerOnMiss();

      // 全文字正解 → 敵ダメージ → 次へ
      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;
      if (completesAllCorrect) {
        // 学習モード learn-then-recall の study 段はダメージせず recall へ
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
    ]
  );

  // 指標
  const wpm = useMemo(() => {
    const elapsedMin = actualTimeSec / 60;
    return elapsedMin > 0 ? state.hits / 5 / elapsedMin : 0;
  }, [state.hits, actualTimeSec]);

  const accuracy = useMemo(() => {
    const total = state.hits + state.errors;
    return total ? (state.hits / total) * 100 : 100;
  }, [state.hits, state.errors]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopBgm();
      try {
        sfxSlashRef.current?.unload();
      } catch {
        return;
      }
      try {
        sfxPunchRef.current?.unload();
      } catch {
        return;
      }
      try {
        sfxDefeatRef.current?.unload();
      } catch {
        return;
      }
      try {
        sfxEscapeRef.current?.unload();
      } catch {
        return;
      }
      try {
        sfxFallDownRef.current?.unload();
      } catch {
        return;
      }
      sfxSlashRef.current = null;
      sfxPunchRef.current = null;
      sfxDefeatRef.current = null;
      sfxEscapeRef.current = null;
      sfxFallDownRef.current = null;
    };
  }, [stopBgm]);

  return {
    state,
    wpm,
    accuracy,
    start,
    stop, // ← 逃げる含め統一API
    next,
    onKey,
    setLearningPhase,
    actualTimeSec, // ← 唯一の時間指標
  };
}
