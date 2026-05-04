import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import {
  appendMakingProblems,
  removeMakingProblem,
} from "@/repositories/appStateRepository";
import type { EngineOptions, EngineState, QAPair } from "@/types/index";

/**
 * シード値からランダム数値を生成する関数
 * @param a シード値
 * @returns 0-1の乱数を返す関数
 */
function mulberry32(a: number) {
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 配列をシード値に基づいてシャッフルする
 * @param arr シャッフル対象の配列
 * @param seed シード値
 * @returns シャッフルされた新しい配列
 */
function shuffle<T>(arr: T[], seed: number) {
  const rng = mulberry32(seed);
  return [...arr].sort(() => rng() - 0.5);
}

/**
 * タイピングゲームのコアエンジンフック
 * @param opts エンジンオプション（時間制限、学習モードなど）
 * @param QA 問題と回答のペア配列
 * @param makingProblem 復習問題モードかどうか
 * @returns エンジンの状態と操作関数
 */
export function useTypingEngine(
  opts: EngineOptions,
  QA: QAPair[],
  makingProblem: boolean,
) {
  const tickMs = Math.max(16, opts.tickMs ?? 100);
  const { speak } = useSpeech();

  // 問題の出題順序
  const [order, setOrder] = useState<number[]>([]);

  // エンジンの状態
  const [state, setState] = useState<EngineState>(() => ({
    started: false,
    finished: false,
    questionJa: "",
    questionJaPlain: "",
    answerEn: "",
    typed: "",
    correctMap: [],
    showHint: !!opts.learningMode,
    index: 0,
    hits: 0,
    errors: 0,
    combo: 0,
    problemHasMistake: false,
    problemUsedHint: false,
    hintStep: 0,
    learningPhase: "study",
  }));

  // ★追加：途中終了フラグ
  const [wasManuallyStoppedEarly, setWasManuallyStoppedEarly] = useState(false);

  // 経過時間の計算用
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const elapsedSec = useMemo(() => {
    if (!state.started || !state.startAt) return 0;
    return Math.max(0, Math.floor((nowMs - state.startAt) / 1000));
  }, [nowMs, state.started, state.startAt]);

  // 問題単位の集計（重複防止に Set を採用）
  const mistakesSetRef = useRef<Set<number>>(new Set());
  const hintsSetRef = useRef<Set<number>>(new Set());
  const [problemsWithMistake, setProblemsWithMistake] = useState(0);
  const [problemsWithHint, setProblemsWithHint] = useState(0);

  // 進行制御
  const progressingRef = useRef(false); // next() の再入防止
  const startedRef = useRef(false); // 初回ロード制御

  /**
   * 問題順序を初期化する
   * ランダムモードの場合はシャッフル、それ以外は順番通り
   */
  const initOrder = useCallback(() => {
    const seed = opts.seed ?? Date.now() % 1_000_000;
    const indices = Array.from({ length: QA.length }, (_, i) => i);
    const useRandom = opts.randomOrder ?? true;
    setOrder(useRandom ? shuffle(indices, seed) : indices);
  }, [opts.seed, QA.length, opts.randomOrder]);

  /**
   * 指定されたインデックスの問題をロードする
   * @param nextIdx ロードする問題のインデックス
   */
  const loadPair = useCallback(
    (nextIdx: number) => {
      const pairIndex = order[nextIdx] ?? 0;
      const pair: QAPair = QA[pairIndex] ?? QA[0];
      const learning = !!opts.learningMode;

      progressingRef.current = false;

      setState((s) => ({
        ...s,
        index: nextIdx,
        questionJa: pair.ja,
        questionJaPlain: pair.jaPlain,
        answerEn: pair.en,
        questionImg: pair.img,
        typed: "",
        correctMap: [],
        showHint: learning,
        problemHasMistake: false,
        problemUsedHint: false,
        hintStep: 0,
        learningPhase: "study",
      }));
    },
    [order, opts.learningMode, QA],
  );

  /**
   * セッションを開始する
   * 全ての状態をリセットして最初の問題から始める
   */
  const start = useCallback(() => {
    initOrder();
    startedRef.current = true;
    const now = Date.now();
    setNowMs(now);

    // 集計をリセット
    mistakesSetRef.current.clear();
    hintsSetRef.current.clear();
    setProblemsWithMistake(0);
    setProblemsWithHint(0);

    // ★追加：途中終了フラグをリセット
    setWasManuallyStoppedEarly(false);

    progressingRef.current = false;

    const learning = !!opts.learningMode;
    setState({
      started: true,
      finished: false,
      startAt: now,
      questionJa: "",
      questionJaPlain: "",
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
      problemUsedHint: false,
      hintStep: 0,
      learningPhase: "study",
    });
  }, [initOrder, opts.learningMode]);

  /**
   * ストップウォッチの更新
   * 開始から終了までの経過時間を定期的に更新
   */
  useEffect(() => {
    if (!state.started || state.finished) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [state.started, state.finished, tickMs]);

  /**
   * 最初の問題をロード
   * セッション開始時に自動的に最初の問題を表示
   */
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

  /**
   * 学習モードの study 段階で最初の音声を再生
   * 同じ問題での重複再生を防ぐ
   */
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

  /**
   * 学習モード中は showHint を維持
   * 学習モードでは常にヒントが表示される（ヒント使用カウントには含まれない）
   */
  useEffect(() => {
    if (!state.started || state.finished) return;
    const learning = !!opts.learningMode;
    setState((s) => ({
      ...s,
      showHint: s.showHint || learning,
    }));
  }, [opts.learningMode, state.started, state.finished]);

  /**
   * 現在の問題の結果を確定集計する
   * ミスやヒント使用を Set で管理し、重複カウントを防ぐ
   * @param s 現在のエンジン状態
   */
  const finalizeCurrentProblem = useCallback(
    (s: EngineState) => {
      const seqIndex = s.index; // 出題シーケンス上のインデックス

      // ミスがあった問題を記録
      if (s.problemHasMistake) {
        mistakesSetRef.current.add(seqIndex);
      }

      // ヒントを使用した問題を記録
      if (s.problemUsedHint) {
        hintsSetRef.current.add(seqIndex);
      }

      // Set のサイズを state に反映
      setProblemsWithMistake(mistakesSetRef.current.size);
      setProblemsWithHint(hintsSetRef.current.size);

      // 学習モードの "study" フェーズでは保存しない
      const skipSave = !!opts.learningMode && s.learningPhase === "study";

      // IndexedDB へ保存：ミス or ヒント使用した問題のみ
      if ((s.problemHasMistake || s.problemUsedHint) && !skipSave) {
        const pairIndex = order[seqIndex] ?? 0;
        const pair: QAPair = QA[pairIndex] ?? QA[0];
        void appendMakingProblems([pair], { unique: true });
      }
    },
    [order, QA, opts.learningMode],
  );

  /**
   * 次の問題に進む
   * 現在の問題を集計してから次の問題をロード
   * 全問題が終了していれば finished フラグを立てる
   */
  const next = useCallback(() => {
    if (progressingRef.current) return; // 再入防止
    progressingRef.current = true;

    setState((s) => {
      // この問題を確定集計（Set により重複は無効化）
      finalizeCurrentProblem(s);

      const hasNext = s.index + 1 < order.length;
      if (!hasNext) {
        progressingRef.current = false;
        return { ...s, finished: true };
      }

      const nextIndex = s.index + 1;
      const pairIndex = order[nextIndex] ?? 0;
      const pair: QAPair = QA[pairIndex] ?? QA[0];
      const learning = !!opts.learningMode;

      progressingRef.current = false;

      return {
        ...s,
        index: nextIndex,
        questionJa: pair.ja,
        questionJaPlain: pair.jaPlain,
        answerEn: pair.en,
        questionImg: pair.img,
        typed: "",
        correctMap: [],
        showHint: learning,
        problemHasMistake: false,
        problemUsedHint: false,
        hintStep: 0,
        learningPhase: "study",
      };
    });
  }, [order, opts.learningMode, QA, finalizeCurrentProblem]);

  /**
   * セッションを停止する
   * ★改善：途中終了かどうかを判定してフラグを設定
   */
  const stop = useCallback(() => {
    setState((s) => {
      // 最後の問題を未集計のままでも重複なしで確定
      finalizeCurrentProblem(s);

      // ★改善：途中終了の判定ロジック
      // - 最終問題でない場合は明らかに途中終了
      // - 最終問題の場合でも、まだ正解していない（typed が完全一致していない）なら途中終了
      const isLastProblem = s.index === order.length - 1;
      const isCurrentProblemCompleted =
        s.typed === s.answerEn && s.correctMap.every(Boolean);
      const isEarlyStop = !isLastProblem || !isCurrentProblemCompleted;

      setWasManuallyStoppedEarly(isEarlyStop);

      progressingRef.current = false;
      return { ...s, finished: true };
    });
  }, [finalizeCurrentProblem, order.length]);

  /**
   * 学習モードのフェーズを手動で切り替える
   * @param phase "study"（学習）または "recall"（復習）
   */
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
    [opts.learningMode],
  );

  /**
   * キー入力を処理する
   * @param key 入力されたキー文字
   */
  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      // 右矢印キー：次の問題へスキップ
      if (key === "→") {
        next();
        return;
      }

      // Tabキー：ヒント表示
      if (key === "\t") {
        const inRecall =
          !!opts.learningMode &&
          !!opts.learnThenRecall &&
          state.learningPhase === "recall";

        // 通常モード or recall 段では Tab ヒントを有効化
        if (!opts.learningMode || inRecall) {
          if (state.hintStep === 0) {
            // 1回目：音声再生
            speak(state.answerEn, { lang: "en-US" });
            setState((s) => ({
              ...s,
              hintStep: 1,
              problemUsedHint: true, // Tab 使用でのみカウント対象
            }));
          } else if (state.hintStep === 1) {
            // 2回目：スペル表示
            setState((s) => ({
              ...s,
              hintStep: 2,
              showHint: true,
              problemUsedHint: true,
            }));
          }
        }
        return;
      }

      // Backspaceキー：1文字削除
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

      // Enterキー：無視（開始/停止は別で処理）
      if (key === "\n") return;

      // 既に全文字入力済みの場合は無視
      if (state.typed.length >= state.answerEn.length) {
        return;
      }

      // 通常の文字入力を判定
      const cursor = state.typed.length;
      const res = judgeChar(state.answerEn, cursor, key);

      setState((s) => ({
        ...s,
        typed: s.typed + key,
        correctMap: [...s.correctMap, res.ok],
        // スコア表示はしないが互換のため内部カウントは維持
        hits: s.hits + (res.ok ? 1 : 0),
        errors: s.errors + (res.ok ? 0 : 1),
        problemHasMistake: s.problemHasMistake || !res.ok,
      }));

      // 全文字正解で完了判定
      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;

      if (completesAllCorrect) {
        // 学習モードの二段階（study→recall）
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

        // テスト（learningMode=false）で正解したら削除
        if (!opts.learningMode && makingProblem) {
          const pairIndex = order[state.index] ?? 0;
          const pair: QAPair = QA[pairIndex] ?? QA[0];
          void removeMakingProblem(pair); // 書き捨てでOK（失敗してもゲーム継続）
        }

        // 自動で次の問題へ（重複は Set で抑止）
        setTimeout(next, 0);
      }
    },
    [
      state,
      next,
      opts.learningMode,
      opts.learnThenRecall,
      speak,
      makingProblem,
      QA,
      order,
    ],
  );

  return {
    state,
    elapsedSec,
    problemsWithMistake,
    problemsWithHint,
    wasManuallyStoppedEarly, // ★追加：途中終了フラグを公開
    start,
    stop,
    next,
    onKey,
    setLearningPhase,
  };
}
