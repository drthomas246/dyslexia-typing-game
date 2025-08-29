import type {
  Tooltip as ChakraTooltip,
  IconButtonProps,
} from "@chakra-ui/react";
import { useAnimation } from "framer-motion";
import type { ThemeProviderProps } from "next-themes";
// import type {useTypingEngine} from "@/hooks/typingEngine/useTypingEngine";

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
  setShouldBgmPlay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  sound: boolean | undefined;
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
export interface QAPair {
  ja: string;
  en: string;
  img?: string;
}

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
export interface EngineOptions {
  tickMs?: number;

  // battle
  battleMode?: boolean;
  playerMaxHp?: number;
  enemyMaxHp?: number;
  damagePerMiss?: number;
  damagePerSentence?: number; // (damagePerHit 同等)

  // sound master
  sound?: boolean;

  // bgm
  bgm?: boolean;
  bgmSrc?: string;
  bgmVolume?: number;

  // sfx
  sfx?: boolean;
  sfxVolume?: number;
  sfxSlashSrc?: string;
  sfxPunchSrc?: string;
  sfxDefeatSrc?: string;
  sfxEscapeSrc?: string;
  sfxFallDownSrc?: string;

  // learning
  learningMode?: boolean;
  learnThenRecall?: boolean;

  // order
  randomOrder?: boolean;
  seed?: number;
  damagePerHit?: number;
}

// EngineLike は useTypingEngine の返り値と同一にして型ズレを防止。
import type { useTypingEngine } from "@/hooks/typingEngine/useTypingEngine";
export type EngineLike = ReturnType<typeof useTypingEngine>;

// ============================
// 設定
// ============================
export type Settings = {
  sound: boolean | undefined; // 効果音
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

// src/hooks/engine/types.ts
export type LearningPhase = "study" | "recall";

/** 唯一のエンジン状態型 */
export interface EngineState {
  // lifecycle
  started: boolean;
  finished: boolean;
  startAt?: number;
  victory?: boolean;

  // QA表示
  index: number;
  questionJa: string;
  answerEn: string;
  questionImg?: string;

  // タイピング
  typed: string;
  correctMap: boolean[];
  hits: number;
  errors: number;

  // 学習
  showHint: boolean;
  hintStep: 0 | 1 | 2;
  learningPhase: LearningPhase;
  problemHasMistake: boolean;
  problemUsedHint: boolean;

  // バトル
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;

  // メタ
  combo: number;
  playCount: number;
  usedHintCount: number;
  mistakeProblemCount: number;
}

export type Action =
  | {
      type: "START";
      payload: {
        now: number;
        playerMaxHp: number;
        enemyMaxHp: number;
        learning: boolean;
        playCount: number;
      };
    }
  | { type: "STOP"; payload: { victory?: boolean } }
  | { type: "FINISH"; payload: { victory: boolean } }
  | {
      type: "LOAD_PAIR";
      payload: { index: number; pair: QAPair; learning: boolean };
    }
  | { type: "TYPE_CHAR"; payload: { key: string; ok: boolean } }
  | { type: "BACKSPACE" }
  | { type: "SET_PHASE"; payload: { phase: LearningPhase; showHint: boolean } }
  | {
      type: "SET_HINT_STEP";
      payload: { step: 0 | 1 | 2; showHint?: boolean; markUsedHint?: boolean };
    }
  | { type: "MARK_USED_HINT" }
  | {
      type: "SYNC_LEARNING_TOGGLE";
      payload: { learning: boolean; learnThenRecall: boolean };
    }
  | { type: "TALLY_QUESTION" }
  | { type: "DAMAGE_PLAYER"; payload: { amount: number } }
  | { type: "DAMAGE_ENEMY"; payload: { amount: number } };

export type BattleArenaProps = {
  ref: React.RefObject<HTMLDivElement | null>;
  enemyImg: string;
  backgroundImg: string;
  hurtId: number;
  vanishId: number;
  vanished: boolean;
  onVanishDone: () => void;
  slashId: number;
  children?: React.ReactNode; // DamageMotion レイヤなど
  questionText: string;
  questionImg: string | undefined;
  state: EngineState;
  enemyHpPct: number;
  arenaRef: HTMLDivElement | null;
};

export type HeaderControlsProps = {
  learningMode: boolean;
  started: boolean;
  finished: boolean;
  onStart: () => void;
  onEscape: () => void;
  onOpenSettings: () => void;
  onBack: () => void;
};

export type PhaseNoticeProps = {
  learningMode: boolean;
  learnThenRecall: boolean;
  phase?: "study" | "recall";
};

export type PlayerHpBarProps = {
  current: number;
  max: number;
  pct: number;
};

export type ContainRect = { x: number; y: number; w: number; h: number };

export type ClickPointProps = {
  point: MapPoint;
  containRect?: ContainRect; // ★ ここを optional
  onClick: () => void;
};

export type AnswerPanelProps = {
  typed: string;
  correctMap: boolean[];
  answer: string;
  showHint: boolean;
  state: EngineState;
  inputOnKey: (key: string) => void;
  resultOpen: boolean;
};

export type AnswerInputViewProps = {
  typed: string;
  correctMap: boolean[];
  answer: string;
  showHint: boolean;
};

export type DamageMotionProps = {
  arenaRef: HTMLDivElement | null;
  slashId: number;
  hurtId: number;
};

export type EnemyHpBarProps = {
  current: number;
  max: number;
  pct: number;
};

export type EnemyLayerProps = {
  backgroundImg: string;
  enemyImg: string;
  vanishId: number;
  vanished: boolean;
  onVanishDone: () => void;
};

export type QuestionPanelProps = {
  questionText: string;
  questionImg?: string | null;
};

export type TitleOverlayProps = {
  src: string;
  visible: boolean;
  animateCtrl: Controls; // ← 差し替え
};

export type SlideOverlayProps = {
  side: "top" | "bottom" | "left" | "right";
  src: string;
  visible: boolean;
  animateCtrl: Controls; // ★ ここを AnimationControls → Controls に
};

export type JudgeFn = (
  answer: string,
  cursor: number,
  key: string
) => { ok: boolean };

export type HowlOrNull = Howl | null;

export type SoundCtl = {
  playBgm: () => void;
  stopBgm: () => void;
  sfx: {
    slash: () => void;
    punch: () => void;
    defeat: () => void;
    escape: () => void;
    fallDown: () => void;
  };
};

export type useHowlerBgmOpts = {
  src: string;
  defaultVolume?: number; // 基準音量
  loop?: boolean;
};

export type useSequenceVisuals = {
  title: boolean;
  top: boolean;
  bottom: boolean;
  right: boolean;
  left: boolean;
};

export type TypingPageProps = {
  QA: QAPair[];
  title: string;
  sound: boolean | undefined;
};

export type AppProps = {
  played?: boolean;
  sound?: boolean;
};

export type HeaderAreaProps = {
  setPage: React.Dispatch<React.SetStateAction<"home" | "typing">>;
  title: string;
  start: () => void;
  stop: (reason?: "escape" | "user" | "dead" | "victory") => void;
  state: EngineState;
  setShouldPlay: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  settings: Settings;
  onOpen: () => void;
};
