// src/hooks/useTypingEngine.ts
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import type { QAPair } from "@/lib/texts/qa_pairs";
import QA from "@/lib/texts/qa_pairs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type EngineOptions = {
  /** プレイ時間（秒） */
  durationSec: number;
  /** 出題順のシード（省略時は現在時刻ベース） */
  seed?: number;
  /** タイマー更新間隔(ms) 既定=100ms */
  tickMs?: number;
  /** 学習モード：最初からヒント表示（その問題はコンボ対象外）＆タイマー停止 */
  learningMode?: boolean;
};

export type EngineState = {
  // ランタイム
  started: boolean;
  finished: boolean;
  startAt?: number;
  questionImg?: string;

  // 出題
  questionJa: string; // 日本語の問題
  answerEn: string; // 英語の正解

  // 入力と可視化
  typed: string; // 入力済みテキスト
  correctMap: boolean[]; // 各キーの正誤
  showHint: boolean; // ヒント表示（灰色ゴースト）

  // 進行/統計
  index: number; // 現在の問題インデックス（order上）
  hits: number; // 正タイプ数
  errors: number; // ミスタイプ数

  // コンボ（ラウンド制）
  combo: number; // 現在のコンボ
  problemHasMistake: boolean; // この問題に1度でもミスがあれば true（失格）
  problemUsedHint: boolean; // この問題でタブ or 学習モードによりヒント利用すれば true（失格）

  // ▼追加：Tabヒント段階（通常モードのみ使用）
  hintStep: 0 | 1 | 2; // 0:未使用 / 1:音声済 / 2:英語表示済
};

// 疑似乱数（シード固定）
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

/**
 * 日本語→英語タイピングのゲームエンジン
 * - Space: 次の問題へ
 * - Tab:（通常モードのみ）1回目=音声、2回目=英語表示（以降は無効）→その問題はコンボ対象外
 * - Backspace: 1文字削除（統計は巻き戻さない仕様）
 * - Enter: ここでは未処理（App側でStopに割当て）
 * - 末尾まで正しく打つと自動で次の問題へ（全文字正解時のみ）
 * - コンボ: 1問中にミス or ヒント利用が無ければ +1、あれば 0
 * - 学習モード: 最初からヒント表示＆コンボ対象外、途中切替も同期、かつタイマー停止
 * - TimeLeft: プレイ中のみ interval で減少（学習モード時は停止）
 */
export function useTypingEngine(opts: EngineOptions) {
  const tickMs = Math.max(16, opts.tickMs ?? 100);
  const { speak } = useSpeech();

  // 出題順（QA のインデックス配列）
  const [order, setOrder] = useState<number[]>([]);

  // エンジン状態
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
  }));

  // TimeLeft のハートビート
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // started直後の初回ロード制御
  const startedRef = useRef(false);

  // 残り時間（秒）
  const timeLeftSec = useMemo(() => {
    // 学習モード中はタイマー停止 → 常に初期値を返す
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

  // 出題順初期化
  const initOrder = useCallback(() => {
    const seed = opts.seed ?? Date.now() % 1_000_000;
    const indices = Array.from({ length: QA.length }, (_, i) => i);
    setOrder(shuffle(indices, seed));
  }, [opts.seed]);

  // 指定インデックスの問題をロード（学習モードを初期反映）
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
        questionImg: pair.img, // img を持つ場合のみ
        typed: "",
        correctMap: [],
        showHint: learning,
        problemHasMistake: false,
        problemUsedHint: learning, // 学習モード中はその問題は失格扱い（コンボ対象外）
        hintStep: 0, // ▼毎問リセット
      }));
    },
    [order, opts.learningMode]
  );

  // Start
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
    });
  }, [initOrder, opts.learningMode]);

  // プレイ中だけ nowMs を更新（学習モード時は停止）
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (opts.learningMode) return; // ★ 学習モードならタイマーを動かさない
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [state.started, state.finished, tickMs, opts.learningMode]);

  // 最初の問題ロード
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

  // ★ 学習モード時に「問題が確定したら1回だけ」読み上げる
  const spokenRef = useRef<string>("");
  useEffect(() => {
    // 条件: 開始済み・未終了・学習モードON・英文あり
    if (!state.started || state.finished) return;
    if (!opts.learningMode) return;
    if (!state.answerEn) return;

    // 問題のユニークキー（index + 英文）
    const key = `${state.index}:${state.answerEn}`;

    if (spokenRef.current !== key) {
      spokenRef.current = key;
      // useSpeech の実装に合わせて options 形式を使用
      speak(state.answerEn, { lang: "en-US" });
    }
  }, [
    state.started,
    state.finished,
    state.index,
    state.answerEn,
    opts.learningMode,
    speak,
  ]);

  // タイムアップ（学習モード時は時間切れで終了しない）
  useEffect(() => {
    if (!state.started || state.finished) return;
    if (opts.learningMode) return; // ★ 学習モードではタイムアップ無効
    if (timeLeftSec <= 0) setState((s) => ({ ...s, finished: true }));
  }, [timeLeftSec, state.started, state.finished, opts.learningMode]);

  // 学習モードの途中切替を同期（表示＆失格フラグ）
  useEffect(() => {
    if (!state.started || state.finished) return;
    const learning = !!opts.learningMode;
    setState((s) => ({
      ...s,
      // すでに手動でTabしていた場合は維持、学習モードONなら強制表示
      showHint: s.showHint || learning,
      // いずれかでヒント利用があれば失格扱いを保持
      problemUsedHint: s.problemUsedHint || learning,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.learningMode]);

  // 次の問題へ（最後まで行ったら終了）
  const next = useCallback(() => {
    setState((s) => {
      const disqualified = s.problemHasMistake || s.problemUsedHint; // ミス or ヒント利用
      const newCombo = disqualified ? 0 : s.combo + 1;

      const hasNext = s.index + 1 < order.length;
      if (!hasNext) {
        // 全QAを出題し終えたら終了
        return {
          ...s,
          combo: newCombo,
          finished: true,
        };
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
        problemUsedHint: learning, // 学習モードなら次の問題も失格扱いから
        hintStep: 0, // ▼次の問題でリセット
      };
    });
  }, [order, opts.learningMode]);

  // 停止
  const stop = useCallback(() => {
    setState((s) => ({ ...s, finished: true }));
  }, []);

  // キー入力
  const onKey = useCallback(
    (key: string) => {
      if (!state.started || state.finished || state.answerEn.length === 0)
        return;

      // Space: 次の問題
      if (key === " ") {
        next();
        return;
      }

      // Tab: ヒント（通常モードのみ段階化）
      if (key === "\t") {
        if (opts.learningMode) {
          // 学習モード中は常時表示なので何もしない
          return;
        }
        setState((s) => {
          // 1回目: 音声のみ
          if (s.hintStep === 0) {
            // この問題はコンボ対象外
            try {
              speak(s.answerEn, { lang: "en-US" });
            } catch {
              /* no-op */
            }
            return { ...s, hintStep: 1, problemUsedHint: true };
          }
          // 2回目: 英語を表示
          if (s.hintStep === 1) {
            return {
              ...s,
              hintStep: 2,
              showHint: true,
              problemUsedHint: true,
            };
          }
          // 3回目以降: 何もしない（必要なら再読上げなどに変更可）
          return s;
        });
        return;
      }

      // Backspace: 1文字削除（統計は巻き戻さない）
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

      // Enter: ここでは未処理（App側でStopに割当て）
      if (key === "\n") return;

      // すでに正解の長さに到達している場合は、通常文字を無視（修正はBackspaceで）
      if (state.typed.length >= state.answerEn.length) {
        return;
      }

      // 通常の1文字判定
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

      // 全文字正解でのみ自動で次へ
      const willCompleteLen = cursor + 1 === state.answerEn.length;
      const allPrevCorrect = state.correctMap.every(Boolean);
      const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;
      if (completesAllCorrect) {
        setTimeout(next, 0);
      }
    },
    [state, next, opts.learningMode, speak]
  );

  // メトリクス
  const wpm = useMemo(() => {
    // 学習モード中は時間経過が止まるため、WPMも分母が増えない
    const elapsedMin = (opts.durationSec - timeLeftSec) / 60;
    return elapsedMin > 0 ? state.hits / 5 / elapsedMin : 0;
  }, [state.hits, opts.durationSec, timeLeftSec]);

  const accuracy = useMemo(() => {
    const total = state.hits + state.errors;
    return total ? (state.hits / total) * 100 : 100;
  }, [state.hits, state.errors]);

  return {
    state, // combo / problemHasMistake / problemUsedHint / hintStep を含む
    timeLeftSec,
    wpm,
    accuracy,
    start,
    stop,
    next,
    onKey,
  };
}
