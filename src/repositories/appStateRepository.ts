import { db, type AppSnapshot } from "@/db";
import type { QAPair, AppStatePatch } from "@/types/index";

const ID = "app";
const SNAPSHOT_VERSION = 1;

export async function getMakingProblems(): Promise<QAPair[]> {
  const snap = await db.app.get(ID);
  return snap?.state?.progress?.makingProblem ?? [];
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
      // ★ 既定値（初期表示時はこれが効く）
      settings: { mode: "study", sort: "sequential", practiceMode: true },
      progress: { lastOpenedAt: 0, makingProblem: [] as QAPair[] },
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
// ★ makingProblem に「追記」する専用API（重複排除オプション付き）
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
      progress: { lastOpenedAt: 0, makingProblem: [] as QAPair[] },
    },
  };

  const prev = current.state.progress.makingProblem ?? [];
  const merged = opts.unique
    ? // ja/en/img の組合せでユニーク化
      Array.from(
        new Map(
          [...prev, ...pairs].map((p) => [`${p.ja}|${p.en}|${p.img ?? ""}`, p]),
        ).values(),
      )
    : [...prev, ...pairs];

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

// ★ 全消去が必要なら
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
      progress: { lastOpenedAt: 0, makingProblem: [] as QAPair[] },
    },
  };

  const rmKeys = new Set(pairs.map((p) => `${p.ja}|${p.en}|${p.img ?? ""}`));
  const prev = current.state.progress.makingProblem ?? [];
  const nextList = prev.filter(
    (p) => !rmKeys.has(`${p.ja}|${p.en}|${p.img ?? ""}`),
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
