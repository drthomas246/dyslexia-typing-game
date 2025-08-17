import type {
  Tooltip as ChakraTooltip,
  IconButtonProps,
} from "@chakra-ui/react";
import type { ThemeProviderProps } from "next-themes";

export type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">;

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
  content: React.ReactNode;
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

export type HUDProps = {
  wpm: number;
  accuracy: number; // 0-100
  timeLeftSec: number;
  combo: number;
};

export type InputCaptureProps = {
  onKey: (ch: string, e: KeyboardEvent) => void;
  enabled?: boolean;
  handleEnter?: boolean; // 既定: true
  handleBackspace?: boolean; // 既定: true
  handleSpace?: boolean; // 既定: true
  handleTab?: boolean; // 既定: false
};

export type ResultsModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onRetry: () => void;
  summary: { wpm: number; accuracy: number; timeSec: number; errors: number };
};

// エンジン連携の最小インターフェース（オプショナル）
export type EngineLike = {
  state: { learningPhase: "study" | "recall" };
  setLearningPhase: (p: "study" | "recall") => void;
};

export type Settings = {
  durationSec: number; // プレイ時間
  sound: boolean; // 効果音
  language: string; // "en" | "ja" | ...
  learningMode: boolean; // 学習モード（常時ヒント・タイマー停止）
  learnThenRecall: boolean; // ★追加：学習→リコールの2段階を有効化
  orderMode: "random" | "sequential";
};

export type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
  engine?: EngineLike; // ★追加：現在フェーズ表示と手動切替に使用（任意）
};

export type SpeakOpts = {
  lang?: string; // 既定: "en-US"
  rate?: number; // 0.1 - 10 (既定 1)
  pitch?: number; // 0 - 2 (既定 1)
  voiceHint?: string; // 例: "en-US" / "en"
  /** 同一テキストの短時間重複呼び出しを抑止する間隔(ms)。既定 500ms */
  dedupeMs?: number;
  /** デデュープを無効化（常に発話）したい時は true */
  noDedupe?: boolean;
};

export type EngineOptions = {
  /** プレイ時間（秒） */
  durationSec: number;
  /** 出題順のシード（省略時は現在時刻ベース） */
  seed?: number;
  /** タイマー更新間隔(ms) 既定=100ms */
  tickMs?: number;
  /** 学習モード：最初からヒント表示＆コンボ対象外＆タイマー停止 */
  learningMode?: boolean;
  /** 学習→リコールの二段階を有効化 */
  learnThenRecall?: boolean;
  /** ★追加：true=ランダム / false=並び順（既定 false） */
  randomOrder?: boolean;
  damagePerSentence?: number;
};

export type EngineState = {
  started: boolean;
  finished: boolean;
  startAt?: number;
  questionImg?: string;

  questionJa: string;
  answerEn: string;

  typed: string;
  correctMap: boolean[];
  showHint: boolean;

  index: number;
  hits: number;
  errors: number;

  combo: number;
  problemHasMistake: boolean;
  problemUsedHint: boolean;

  /** Tabヒント段階: 0=未使用,1=音声済,2=表示済 */
  hintStep: 0 | 1 | 2;
  /** 学習モード時の段階: study=学習, recall=リコール */
  learningPhase: "study" | "recall";
};

export type QAPair = { ja: string; en: string; img?: string };

export type JudgeResult = { ok: boolean; expected: string; received: string };
