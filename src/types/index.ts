import type {
  Tooltip as ChakraTooltip,
  IconButtonProps,
} from "@chakra-ui/react";
import type { ThemeProviderProps } from "next-themes";
import type { ReactNode, RefObject } from "react";
import type { AppSnapshot } from "@/db";

export type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">;

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: RefObject<HTMLElement>;
  content: ReactNode;
  contentProps?: ChakraTooltip.ContentProps;
  disabled?: boolean;
}

export type ColorModeProviderProps = ThemeProviderProps;

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

/**
 * HUD（ヘッズアップディスプレイ）のプロパティ
 * ゲーム中の統計情報を表示するための型
 */
export type HUDProps = {
  wpm: number; // Words Per Minute（1分あたりの入力語数）
  accuracy: number; // 正確度（0-100の割合）
  timeLeftSec: number; // 残り時間（秒）
  combo: number; // 連続正解数
};

/**
 * キー入力キャプチャのプロパティ
 * キーボード入力を検知して処理するためのコンポーネント設定
 */
export type InputCaptureProps = {
  onKey: (ch: string, e: KeyboardEvent) => void; // キー入力時のコールバック
  enabled?: boolean; // キャプチャ有効化フラグ
  handleEnter?: boolean; // Enterキーを処理するか（既定: true）
  handleBackspace?: boolean; // Backspaceキーを処理するか（既定: true）
  handleSpace?: boolean; // Spaceキーを処理するか（既定: true）
  handleTab?: boolean; // Tabキーを処理するか（既定: false）
  handleArrowRight?: boolean; // 右矢印キーを処理するか（既定: false）
};

/**
 * 結果モーダルのプロパティ
 * ゲーム終了時の結果を表示するモーダル設定
 */
export type ResultsModalProps = {
  open: boolean; // モーダル表示状態
  setOpen: (v: boolean) => void; // モーダル表示状態の更新関数
  onRetry: () => void; // リトライボタンのコールバック
  stickerPicker?: {
    enabled: boolean;
    options: StickerOption[];
    selectedStickerId?: string;
    saving?: boolean;
    previewDateLabel: string;
    previewStickers: string[];
    onSelect: (stickerId: string) => void;
  };
  summary: {
    timeSec: number; // プレイ時間（秒）
    errors: number; // エラー数
    hints: number; // ヒント使用数
  };
};

/**
 * エンジン連携の最小インターフェース（設定画面で使用）
 * 学習モードのフェーズ管理に使用
 */
export type EngineLike = {
  state: { learningPhase: "study" | "recall" };
  setLearningPhase: (p: "study" | "recall") => void;
};

/**
 * ゲーム設定
 * ユーザーがカスタマイズ可能な全ての設定項目
 */
export type Settings = {
  durationSec: number; // プレイ時間（秒）
  sound: boolean; // 効果音の有効化
  language: string; // 言語設定（"en" | "ja" | ...）
  learningMode: boolean; // 学習モード（常時ヒント表示・タイマー停止）
  learnThenRecall: boolean; // 学習→リコールの2段階を有効化
  orderMode: "random" | "sequential"; // 出題順序（ランダム or 順番）
};

/**
 * 設定ドロワーのプロパティ
 * ゲーム設定を変更するためのドロワーコンポーネント設定
 */
export type SettingsDrawerProps = {
  open: boolean; // ドロワー表示状態
  onClose: () => void; // ドロワーを閉じるコールバック
  settings: Settings; // 現在の設定
  onChange: (s: Settings) => void; // 設定変更のコールバック
  engine?: EngineLike; // エンジンインスタンス（フェーズ表示・切替用、任意）
};

/**
 * 音声読み上げのオプション
 * Web Speech API を使った音声合成の設定
 */
export type SpeakOpts = {
  lang?: string; // 言語コード（既定: "en-US"）
  rate?: number; // 読み上げ速度（0.1 - 10、既定 1）
  pitch?: number; // 音高（0 - 2、既定 1）
  voiceHint?: string; // 音声ヒント（例: "en-US" / "en"）
  dedupeMs?: number; // 同一テキストの短時間重複呼び出しを抑止する間隔(ms)。既定 500ms
  noDedupe?: boolean; // デデュープを無効化（常に発話）したい時は true
};

/**
 * タイピングエンジンのオプション
 * エンジンの動作モードや制限時間などを設定
 */
export type EngineOptions = {
  durationSec: number; // プレイ時間（秒）
  seed?: number; // 出題順のシード値（省略時は現在時刻ベース）
  tickMs?: number; // タイマー更新間隔(ms)（既定=100ms）
  learningMode?: boolean; // 学習モード：最初からヒント表示＆タイマー停止
  learnThenRecall?: boolean; // 学習→リコールの二段階を有効化
  randomOrder?: boolean; // true=ランダム出題 / false=順番通り（既定 false）
};

/**
 * タイピングエンジンの状態
 * ゲームの進行状況や現在の問題情報を保持
 */
export type EngineState = {
  started: boolean; // セッション開始フラグ
  finished: boolean; // セッション終了フラグ
  startAt?: number; // 開始時刻（Unix時間ミリ秒）
  questionImg?: string; // 現在の問題の画像URL

  questionJa: ReactNode; // 現在の問題文（日本語、HTMLを含む可能性あり）
  questionJaPlain: string; // 現在の問題文（プレーンテキスト）
  answerEn: string; // 現在の問題の正解（英語）

  typed: string; // ユーザーが入力した文字列
  correctMap: boolean[]; // 各文字の正誤マップ
  showHint: boolean; // ヒント表示フラグ

  index: number; // 現在の問題インデックス
  hits: number; // 正解文字数の累計
  errors: number; // エラー文字数の累計

  combo: number; // 連続正解数
  problemHasMistake: boolean; // 現在の問題でミスがあったか
  problemUsedHint: boolean; // 現在の問題でヒントを使用したか

  hintStep: 0 | 1 | 2; // Tabヒント段階: 0=未使用, 1=音声済, 2=表示済
  learningPhase: "study" | "recall"; // 学習モード時の段階: study=学習, recall=リコール
};

/**
 * 問題と回答のペア
 * タイピングゲームの1問分のデータ
 */
export type QAPair = {
  ja: ReactNode; // 問題文（日本語、HTMLを含む可能性あり）
  jaPlain: string; // 問題文（プレーンテキスト）
  en: string; // 正解（英語）
  img?: string; // 問題に関連する画像URL（任意）
};

/**
 * 文字判定の結果
 * 入力された文字が正解かどうかの判定結果
 */
export type JudgeResult = {
  ok: boolean; // 正解かどうか
  expected: string; // 期待される文字
  received: string; // 入力された文字
};

/**
 * マップポイント
 * ゲームの各ステージ（ポイント）の情報
 */
export type MapPoint = {
  id: number; // ポイントID
  titleRaw: string; // タイトル（生テキスト）
  title: string; // タイトル（表示用、HTMLを含む可能性あり）
  QA: QAPair[]; // このポイントの問題リスト
  completed?: boolean; // 完全正解済みフラグ（緑チェックマーク）
  studied?: boolean; // 学習済みフラグ（黄色マーク）
};

export type StickerOption = {
  id: string;
  emoji: string;
  label: string;
};

type AppState = AppSnapshot["state"];
type AppSettings = AppState["settings"];
type AppProgress = AppState["progress"];

/**
 * アプリケーションの進捗状態
 * IndexedDBに保存される進捗情報
 */
export type ProgressState = {
  lastOpenedAt: number; // 最終アクセス日時
  makingProblem: QAPair[]; // 復習問題リスト（ミス・ヒント使用した問題）
  completedPoints: number[]; // 完全正解済みポイントのIDリスト
  studiedPoints: number[]; // 学習済みポイントのIDリスト
  calendarStickers: Record<
    string,
    { stickerId: string; earnedAt: number; mode: "test" }[]
  >; // 日付ごとのステッカー
};

/**
 * アプリケーション状態の部分更新
 * 設定や進捗の一部のみを更新する際に使用
 */
export type AppStatePatch = {
  settings?: Partial<AppSettings>;
  progress?: Partial<AppProgress>;
};
