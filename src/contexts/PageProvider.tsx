// @/contexts/PageProvider.tsx
import { useCallback, useState, useMemo, type ReactNode } from "react";
import {
  UserPageContext,
  UserSetPageContext,
  UserBattleContext,
  UserSetBattleContext,
  UserSortContext,
  UserSetSortContext,
  UserPracticeModeContext,
  UserSetPracticeModeContext,
} from "./PageContext";
import { db } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";
import { saveApp } from "@/repositories/appStateRepository";

export default function PageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<number>(0);
  const snap = useLiveQuery(() => db.app.get("app"), [], undefined);

  // ★ snap が無い間は既定値（study / sequential / true）で動かす
  const battleFromSnap = useMemo(
    () => (snap?.state?.settings?.mode ?? "study") === "battle",
    [snap],
  );
  const sortFromSnap = useMemo(() => {
    const s = snap?.state?.settings?.sort ?? "sequential";
    return s === "sequential"; // true=sequential, false=random
  }, [snap]);
  const practiceFromSnap = useMemo(
    () => (snap?.state?.settings?.practiceMode ?? true) as boolean,
    [snap],
  );

  // 楽観更新（任意）
  const [optimisticBattle, setOptimisticBattle] = useState<boolean | null>(
    null,
  );
  const [optimisticSort, setOptimisticSort] = useState<boolean | null>(null);
  const [optimisticPractice, setOptimisticPractice] = useState<boolean | null>(
    null,
  );

  const battle = optimisticBattle ?? battleFromSnap;
  const sort = optimisticSort ?? sortFromSnap; // true=sequential
  const practice = optimisticPractice ?? practiceFromSnap;

  const setBattle = useCallback(
    async (v: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof v === "function" ? v(battle) : v;
      setOptimisticBattle(next);
      await saveApp({
        settings: {
          mode: next ? "battle" : "study",
          sort: sort ? "sequential" : "random",
          practiceMode: practice,
        },
        progress: { lastOpenedAt: Date.now() },
      });
      setOptimisticBattle(null);
    },
    [battle, sort, practice],
  );

  const setSort = useCallback(
    async (v: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof v === "function" ? v(sort) : v; // next=true => sequential
      setOptimisticSort(next);
      await saveApp({
        settings: {
          mode: battle ? "battle" : "study",
          sort: next ? "sequential" : "random", // ★正しいマッピング
          practiceMode: practice,
        },
        progress: { lastOpenedAt: Date.now() },
      });
      setOptimisticSort(null);
    },
    [battle, sort, practice],
  );

  const setPracticeMode = useCallback(
    async (v: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof v === "function" ? v(practice) : v;
      setOptimisticPractice(next);
      await saveApp({
        settings: {
          mode: battle ? "battle" : "study",
          sort: sort ? "sequential" : "random",
          practiceMode: next,
        },
        progress: { lastOpenedAt: Date.now() },
      });
      setOptimisticPractice(null);
    },
    [battle, sort, practice],
  );

  return (
    <UserPageContext.Provider value={page}>
      <UserSetPageContext.Provider value={setPage}>
        <UserBattleContext.Provider value={battle}>
          <UserSetBattleContext.Provider value={setBattle}>
            <UserSortContext.Provider value={sort}>
              <UserSetSortContext.Provider value={setSort}>
                <UserPracticeModeContext.Provider value={practice}>
                  <UserSetPracticeModeContext.Provider value={setPracticeMode}>
                    {children}
                  </UserSetPracticeModeContext.Provider>
                </UserPracticeModeContext.Provider>
              </UserSetSortContext.Provider>
            </UserSortContext.Provider>
          </UserSetBattleContext.Provider>
        </UserBattleContext.Provider>
      </UserSetPageContext.Provider>
    </UserPageContext.Provider>
  );
}
