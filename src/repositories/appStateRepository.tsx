import parse from "html-react-parser";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { type AppSnapshot, db } from "@/db";
import type { AppStatePatch, QAPair } from "@/types/index";

const ID = "app";
const SNAPSHOT_VERSION = 4;

// ========== シリアライズ用ヘルパー関数 ==========

function serializeReactNode(node: unknown): string {
  // 型ガードを追加
  if (typeof node === "string") {
    return node;
  }
  if (node == null) {
    return "";
  }
  if (isValidElement(node as ReactNode)) {
    try {
      return renderToStaticMarkup(node as ReactNode);
    } catch (error) {
      console.warn("Failed to serialize React element:", error);
      return String(node);
    }
  }
  if (Array.isArray(node)) {
    return (node as unknown[]).map(serializeReactNode).join("");
  }
  return String(node);
}

function serializeQAPair(pair: QAPair): QAPair {
  return {
    ja: serializeReactNode(pair.ja),
    jaPlain: pair.jaPlain,
    en: pair.en,
    img: pair.img ? serializeReactNode(pair.img) : undefined,
  };
}

// ========== デシリアライズ用ヘルパー関数 ==========

function deserializeReactNode(html: string): React.ReactNode {
  // 空文字列の場合
  if (!html) {
    return "";
  }

  // HTMLタグが含まれている場合はdangerouslySetInnerHTMLで復元
  if (html.includes("<")) {
    return parse(html);
  }

  // プレーンテキストの場合はそのまま
  return html;
}

function deserializeQAPair(pair: QAPair): QAPair {
  return {
    ja: deserializeReactNode(pair.ja as string),
    jaPlain: pair.jaPlain,
    en: pair.en,
    img: pair.img,
  };
}

// ========== 既存の関数 ==========

export async function getMakingProblems(): Promise<QAPair[]> {
  const snap = await db.app.get(ID);
  const stored = snap?.state?.progress?.makingProblem ?? [];

  // 保存されたデータを復元
  return stored.map(deserializeQAPair);
}

export async function loadApp(): Promise<AppSnapshot | undefined> {
  return db.app.get(ID);
}

export async function saveApp(patch: AppStatePatch) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  const next: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      settings: { ...current.state.settings, ...(patch.settings ?? {}) },
      progress: { ...current.state.progress, ...(patch.progress ?? {}) },
    },
  };
  await db.app.put(next);
  return next;
}

export async function appendMakingProblems(
  pairs: QAPair[],
  opts: { unique?: boolean } = { unique: true },
) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: false },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  // データをシリアライズ
  const serializedPairs = pairs.map(serializeQAPair);
  const prev = current.state.progress.makingProblem ?? [];

  const merged = opts.unique
    ? Array.from(
        new Map(
          [...prev, ...serializedPairs].map((p) => [
            `${p.ja}|${p.jaPlain}|${p.en}|${p.img ?? ""}`,
            p,
          ]),
        ).values(),
      )
    : [...prev, ...serializedPairs];

  const next: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        makingProblem: merged,
      },
    },
  };
  await db.app.put(next);
  return next;
}

export async function clearMakingProblems() {
  const current = await db.app.get(ID);
  if (!current) return;
  const next: AppSnapshot = {
    ...current,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        makingProblem: [],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };
  await db.app.put(next);
  return next;
}

export async function overwriteApp(full: AppSnapshot["state"]) {
  const next: AppSnapshot = {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: full,
  };
  await db.app.put(next);
  return next;
}

export async function removeMakingProblems(pairs: QAPair[]) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  // シリアライズしてから比較
  const serializedPairs = pairs.map(serializeQAPair);
  const rmKeys = new Set(
    serializedPairs.map((p) => `${p.ja}|${p.jaPlain}|${p.en}|${p.img ?? ""}`),
  );
  const prev = current.state.progress.makingProblem ?? [];
  const nextList = prev.filter(
    (p) => !rmKeys.has(`${p.ja}|${p.jaPlain}|${p.en}|${p.img ?? ""}`),
  );

  const next: AppSnapshot = {
    ...current,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        makingProblem: nextList,
      },
    },
  };
  await db.app.put(next);
  return next;
}

export async function removeMakingProblem(pair: QAPair) {
  return removeMakingProblems([pair]);
}

// ===== 完了状態管理の関数 =====

export async function getCompletedPoints(): Promise<number[]> {
  const snap = await db.app.get(ID);
  return snap?.state?.progress?.completedPoints ?? [];
}

export async function markPointCompleted(pointId: number) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  const prev = current.state.progress.completedPoints ?? [];
  const next = prev.includes(pointId) ? prev : [...prev, pointId];

  const updated: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        completedPoints: next,
      },
    },
  };
  await db.app.put(updated);
  return updated;
}

export async function unmarkPointCompleted(pointId: number) {
  const current = await db.app.get(ID);
  if (!current) return;

  const prev = current.state.progress.completedPoints ?? [];
  const next = prev.filter((id) => id !== pointId);

  const updated: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        completedPoints: next,
      },
    },
  };
  await db.app.put(updated);
  return updated;
}

export async function clearCompletedPoints() {
  const current = await db.app.get(ID);
  if (!current) return;

  const updated: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        completedPoints: [],
      },
    },
  };
  await db.app.put(updated);
  return updated;
}

// ===== 学習済み状態管理の関数 =====

export async function getStudiedPoints(): Promise<number[]> {
  const snap = await db.app.get(ID);
  return snap?.state?.progress?.studiedPoints ?? [];
}

export async function markPointStudied(pointId: number) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  const prev = current.state.progress.studiedPoints ?? [];
  const next = prev.includes(pointId) ? prev : [...prev, pointId];

  const updated: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        studiedPoints: next,
      },
    },
  };
  await db.app.put(updated);
  return updated;
}

export async function getCalendarStickers() {
  const snap = await db.app.get(ID);
  return snap?.state?.progress?.calendarStickers ?? {};
}

export async function addCalendarSticker(dateKey: string, stickerId: string) {
  const current = (await db.app.get(ID)) ?? {
    id: ID,
    version: SNAPSHOT_VERSION,
    updatedAt: 0,
    state: {
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: {
        lastOpenedAt: 0,
        makingProblem: [] as QAPair[],
        completedPoints: [],
        studiedPoints: [],
        calendarStickers: {},
      },
    },
  };

  const prev = current.state.progress.calendarStickers ?? {};
  const nextEntries = [
    ...(prev[dateKey] ?? []),
    {
      stickerId,
      earnedAt: Date.now(),
      mode: "test" as const,
    },
  ];

  const updated: AppSnapshot = {
    ...current,
    version: SNAPSHOT_VERSION,
    updatedAt: Date.now(),
    state: {
      ...current.state,
      progress: {
        ...current.state.progress,
        calendarStickers: {
          ...prev,
          [dateKey]: nextEntries,
        },
      },
    },
  };
  await db.app.put(updated);
  return updated;
}
