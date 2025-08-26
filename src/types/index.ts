// types/index.ts
import type {
  Tooltip as ChakraTooltip,
  IconButtonProps,
} from "@chakra-ui/react";
import { useAnimation } from "framer-motion";
import type { ThemeProviderProps } from "next-themes";

// ============================
// UI 共通系
// ============================
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

// ============================
// 入力 / 結果
// ============================
export type InputCaptureProps = {
  onKey: (ch: string, e: KeyboardEvent) => void;
  enabled?: boolean;
  handleEnter?: boolean; // 既定: true
  handleBackspace?: boolean; // 既定: true
  handleSpace?: boolean; // 既定: true
  handleTab?: boolean; // 既定: false
};

export type ResultsDialogProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onRetry: () => void;
  summary: {
    /** 実測プレイ時間（秒） */
    timeSec: number;
    /** ヒント（Tab/学習ヒントなど）を使った問題の個数 */
    usedHintCount: number;
    /** 1問内で一度でもミスがあった問題の個数 */
    mistakeProblemCount: number;
    /** 学習モードチェック */
    learningMode: boolean;
  };
};

// ============================
// エンジン連携
// ============================
export type QAPair = { ja: string; en: string; img?: string };

export type JudgeResult = { ok: boolean; expected: string; received: string };

/** 発話オプション（useSpeech.ts 用） */
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

/**
 * 唯一のオプション型
 * - 経過時間のみ運用; 制限時間関連は含めない。
 */
export type EngineOptions = {
  /** 出題順のシード（省略時は現在時刻ベース） */
  seed?: number;
  /** タイマー更新間隔(ms) 既定=100ms */
  tickMs?: number;
  /** 学習モード：最初からヒント表示＆コンボ対象外 */
  learningMode?: boolean;
  /** 学習→リコールの二段階を有効化 */
  learnThenRecall?: boolean;
  /** true=ランダム / false=並び順（既定 false） */
  randomOrder?: boolean;
  /** 文クリア時の敵ダメージ（未指定なら damagePerHit, さらに未指定なら 10） */
  damagePerSentence?: number;

  // バトル
  battleMode?: boolean; // 既定: true
  playerMaxHp?: number; // 既定: 100
  enemyMaxHp?: number; // 既定: 100
  damagePerHit?: number; // 既定: 10
  damagePerMiss?: number; // 既定: 5

  // サウンド
  bgm?: boolean;
  bgmSrc?: string;
  bgmVolume?: number;
  sfx?: boolean;
  sfxVolume?: number;
  sfxSlashSrc?: string;
  sfxPunchSrc?: string;
  sfxDefeatSrc?: string;
  sfxEscapeSrc?: string;
  sfxFallDownSrc?: string;
  sound?: boolean;
};

/** 唯一のエンジン状態型 */
export type EngineState = {
  // ランタイム
  started: boolean;
  finished: boolean;
  startAt?: number;

  // 出題
  questionImg?: string;
  questionJa: string;
  answerEn: string;

  // 入力状態
  typed: string;
  correctMap: boolean[];
  showHint: boolean;

  // 進行状況
  index: number;
  hits: number;
  errors: number;

  // 品質・ヒント
  combo: number;
  problemHasMistake: boolean;
  problemUsedHint: boolean;

  /** Tabヒント段階: 0=未使用,1=音声済,2=表示済 */
  hintStep: 0 | 1 | 2;
  /** 学習モード時の段階: study=学習, recall=リコール */
  learningPhase: "study" | "recall";

  // バトル用
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  /** true=勝利 / false=敗北 / undefined=未決 */
  victory?: boolean;

  // メタ
  playCount: number;

  // 集計（ダイアログ用）
  usedHintCount: number; // ヒントを使った「問題」数
  mistakeProblemCount: number; // 間違えがあった「問題」数
};

// EngineLike は useTypingEngine の返り値と同一にして型ズレを防止。
import type { useTypingEngine } from "@/hooks/useTypingEngine";
export type EngineLike = ReturnType<typeof useTypingEngine>;

// ============================
// 設定
// ============================
export type Settings = {
  sound: boolean; // 効果音
  language: string; // "en" | "ja" | ...
  learningMode: boolean; // 学習モード（常時ヒント）
  learnThenRecall: boolean; // 学習→リコールの2段階
  orderMode: "random" | "sequential";
};

export type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
  engine?: EngineLike; // 現在フェーズ表示と手動切替に使用（任意）
};

export type DecodableImage = HTMLImageElement & {
  decode?: () => Promise<void>;
};

export type HowlerWithCtx = typeof Howler & { ctx?: AudioContext };

export type Controls = ReturnType<typeof useAnimation>;

export type MapPoint = { id: number; x: number; y: number; title: string };
