import Dexie, { type Table } from "dexie";
import type { QAPair } from "@/types/index";

// 「アプリ全体の状態」をバージョン付きで保存
export type AppSnapshot = {
  id: "app"; // 常に "app" （単一スナップショット運用）
  version: number; // スキーマ版
  updatedAt: number; // Date.now()
  state: {
    settings: {
      mode: "study" | "battle";
      sort: "random" | "sequential";
      practiceMode: boolean;
    };
    progress: { lastOpenedAt: number; makingProblem: QAPair[] };
    // 他にも必要な slice をホワイトリストで
  };
};

class AppDB extends Dexie {
  app!: Table<AppSnapshot, string>;
  constructor() {
    super("my-app-db");
    this.version(1).stores({
      app: "id, updatedAt",
    });
    // 例：2版で state に新フィールドを追加したら
    // this.version(2).stores({ app: "id, updatedAt" }).upgrade(tx => {
    //   return tx.table<AppSnapshot>("app").toCollection().modify(row => {
    //     row.version = 2;
    //     row.state.settings ??= { sound: true, bgmVolume: 0.4, theme: "light" };
    //   });
    // });
  }
}
export const db = new AppDB();
