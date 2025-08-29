import { initialState, reducer } from "@/hooks/typingEngine//reducer";
import { useBattle } from "@/hooks/typingEngine//useBattle";
import { useInput } from "@/hooks/typingEngine//useInput";
import { useLearning } from "@/hooks/typingEngine//useLearning";
import { useSequence } from "@/hooks/typingEngine//useSequence";
import { useSound } from "@/hooks/typingEngine//useSound";
import { useSpeechOnce } from "@/hooks/typingEngine//useSpeechOnce";
import { useTimer } from "@/hooks/typingEngine//useTimer";
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import type { EngineOptions, QAPair } from "@/types/index";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

export function useTypingEngine(
  opts: EngineOptions,
  QA: QAPair[],
  setSlashId: React.Dispatch<React.SetStateAction<number>>,
  setHurtId: React.Dispatch<React.SetStateAction<number>>,
  setVanishId: React.Dispatch<React.SetStateAction<number>>,
  setVanished: React.Dispatch<React.SetStateAction<boolean>>
) {
  // ---- reducer / state ----
  const [state, dispatch] = useReducer(reducer, initialState(opts));

  // ---- tick ----
  const tickMs = Math.max(16, opts.tickMs ?? 100);

  // ---- services / domain ----
  const sound = useSound(opts);
  const { order, initOrder, getPair } = useSequence(QA, opts);
  const { nowMs } = useTimer(tickMs, state.started, state.finished);
  const { setPhase } = useLearning({ state, dispatch, opts });

  // ---- speak（Tabヒント用）----
  const { speak } = useSpeech();

  // ---- 実プレイ回数（START payload用）----
  const playCountRef = useRef(0);

  // ---- start ----
  const start = useCallback(() => {
    // 演出リセット
    setVanishId(0);
    setVanished(false);

    // 出題順
    initOrder();

    // BGMは学習モードでは鳴らさない
    if (!opts.learningMode) sound.playBgm();

    // 状態初期化（学習モードの初期値をpayloadで受け渡し）
    dispatch({
      type: "START",
      payload: {
        now: Date.now(),
        playerMaxHp: Math.max(1, opts.playerMaxHp ?? 100),
        enemyMaxHp: Math.max(1, opts.enemyMaxHp ?? 100),
        learning: !!opts.learningMode,
        playCount: playCountRef.current,
      },
    });
  }, [
    initOrder,
    opts.learningMode,
    opts.playerMaxHp,
    opts.enemyMaxHp,
    setVanishId,
    setVanished,
    sound,
  ]);

  // ---- stop（逃げる/手動停止/勝敗確定）----
  const talliedFinalRef = useRef(false);
  const stop = useCallback(
    (reason?: "escape" | "user" | "dead" | "victory") => {
      // 最後の1問の集計取りこぼし防止（1回だけ）
      if (!talliedFinalRef.current) {
        dispatch({ type: "TALLY_QUESTION" });
        talliedFinalRef.current = true;
      }

      if (reason === "escape" && !opts.learningMode) {
        sound.sfx.escape();
      }

      sound.stopBgm();

      let victory: boolean | undefined = state.victory;
      if (reason === "escape" || reason === "dead") victory = false;
      if (reason === "victory") victory = true;

      dispatch({ type: "STOP", payload: { victory } });
      playCountRef.current += 1;
    },
    [opts.learningMode, sound, state.victory]
  );

  // ---- next（集計は呼び出し側でTALLY済み）----
  const next = useCallback(() => {
    const nextIndex = state.index + 1;
    const hasNext = nextIndex < order.length;

    if (!hasNext) {
      // 戦闘終了
      sound.stopBgm();
      dispatch({ type: "FINISH", payload: { victory: state.enemyHp <= 0 } });
      return;
    }

    const pair = getPair(nextIndex);
    dispatch({
      type: "LOAD_PAIR",
      payload: { index: nextIndex, pair, learning: !!opts.learningMode },
    });
  }, [
    state.index,
    order.length,
    getPair,
    sound,
    state.enemyHp,
    opts.learningMode,
  ]);

  // ---- 学習モード: study 段で英文を1度だけ読み上げ ----
  useSpeechOnce({ state, opts, lang: "en-US" });

  const { onMiss, onSentenceClear } = useBattle(
    opts,
    sound,
    setHurtId,
    setSlashId,
    dispatch
  );

  // ---- 入力処理 ----
  const { onKey } = useInput({
    state,
    opts,
    dispatch,
    judgeChar,
    speak,
    onMiss,
    onSentenceClear,
    next,
    setPhase,
  });

  // ---- 最初の問題ロード ----
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (state.answerEn !== "") return;
    if (order.length === 0) return;

    const first = getPair(0);
    dispatch({
      type: "LOAD_PAIR",
      payload: { index: 0, pair: first, learning: !!opts.learningMode },
    });
  }, [
    state.started,
    state.finished,
    state.answerEn,
    order.length,
    getPair,
    opts.learningMode,
  ]);

  // ---- 指標 ----
  const actualTimeSec = useMemo(() => {
    if (!state.started || !state.startAt) return 0;
    return Math.max(0, Math.floor((nowMs - state.startAt) / 1000));
  }, [state.started, state.startAt, nowMs]);

  return {
    state,
    start,
    stop, // 逃げる/手動停止/勝敗確定の統一API
    next,
    onKey,
    setLearningPhase: setPhase,
    actualTimeSec, // 唯一の時間指標
  };
}
