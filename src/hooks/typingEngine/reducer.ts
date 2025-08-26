// src/hooks/engine/reducer.ts
import type { Action, EngineOptions, EngineState } from "@/types/index";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function initialState(opts: EngineOptions): EngineState {
  const playerMaxHp = Math.max(1, opts.playerMaxHp ?? 100);
  const enemyMaxHp = Math.max(1, opts.enemyMaxHp ?? 100);
  const learning = !!opts.learningMode;

  return {
    started: false,
    finished: false,
    index: 0,
    questionJa: "",
    answerEn: "",
    questionImg: undefined,

    typed: "",
    correctMap: [],
    hits: 0,
    errors: 0,

    showHint: learning,
    hintStep: 0,
    learningPhase: "study",
    problemHasMistake: false,
    problemUsedHint: learning,

    playerHp: playerMaxHp,
    enemyHp: enemyMaxHp,
    playerMaxHp,
    enemyMaxHp,

    combo: 0,
    playCount: 0,
    usedHintCount: 0,
    mistakeProblemCount: 0,
  };
}

export function reducer(s: EngineState, a: Action): EngineState {
  switch (a.type) {
    case "START": {
      const { now, playerMaxHp, enemyMaxHp, learning, playCount } = a.payload;
      return {
        ...initialState({
          playerMaxHp,
          enemyMaxHp,
          learningMode: learning,
        }),
        started: true,
        finished: false,
        startAt: now,
        playCount,
      };
    }

    case "STOP": {
      if (s.finished) return s;
      return { ...s, finished: true, victory: a.payload.victory };
    }

    case "FINISH": {
      return { ...s, finished: true, victory: a.payload.victory };
    }

    case "LOAD_PAIR": {
      const { index, pair, learning } = a.payload;
      return {
        ...s,
        index,
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
    }

    case "TYPE_CHAR": {
      const ok = a.payload.ok;
      return {
        ...s,
        typed: s.typed + a.payload.key,
        correctMap: [...s.correctMap, ok],
        hits: s.hits + (ok ? 1 : 0),
        errors: s.errors + (ok ? 0 : 1),
        problemHasMistake: s.problemHasMistake || !ok,
      };
    }

    case "BACKSPACE": {
      if (s.typed.length === 0) return s;
      return {
        ...s,
        typed: s.typed.slice(0, -1),
        correctMap: s.correctMap.slice(0, -1),
      };
    }

    case "SET_PHASE": {
      const { phase, showHint } = a.payload;
      return {
        ...s,
        learningPhase: phase,
        showHint,
        typed: "",
        correctMap: [],
        hintStep: 0,
      };
    }

    case "SET_HINT_STEP": {
      const { step, showHint, markUsedHint } = a.payload;
      return {
        ...s,
        hintStep: step,
        showHint: showHint ?? s.showHint,
        problemUsedHint: markUsedHint ? true : s.problemUsedHint,
      };
    }

    case "MARK_USED_HINT": {
      return { ...s, problemUsedHint: true };
    }

    case "SYNC_LEARNING_TOGGLE": {
      const learning = a.payload.learning;
      return {
        ...s,
        showHint: s.showHint || learning,
        problemUsedHint: s.problemUsedHint || learning,
      };
    }

    case "TALLY_QUESTION": {
      const addHint = s.problemUsedHint ? 1 : 0;
      const addMist = s.problemHasMistake ? 1 : 0;
      const disqualified = s.problemUsedHint || s.problemHasMistake;
      const newCombo = disqualified ? 0 : s.combo + 1;
      return {
        ...s,
        usedHintCount: s.usedHintCount + addHint,
        mistakeProblemCount: s.mistakeProblemCount + addMist,
        combo: newCombo,
      };
    }

    case "DAMAGE_PLAYER": {
      const playerHp = clamp(s.playerHp - a.payload.amount, 0, s.playerMaxHp);
      const finished = playerHp <= 0 || s.enemyHp <= 0;
      return {
        ...s,
        playerHp,
        finished: finished ? true : s.finished,
        victory: finished ? (s.enemyHp > 0 ? false : s.victory) : s.victory,
      };
    }

    case "DAMAGE_ENEMY": {
      const enemyHp = clamp(s.enemyHp - a.payload.amount, 0, s.enemyMaxHp);
      const finished = s.playerHp <= 0 || enemyHp <= 0;
      return {
        ...s,
        enemyHp,
        finished: finished ? true : s.finished,
        victory: finished ? enemyHp <= 0 && s.playerHp > 0 : s.victory,
      };
    }

    default:
      return s;
  }
}
