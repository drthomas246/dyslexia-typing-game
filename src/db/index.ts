import Dexie, { type Table } from "dexie";
import type { QAPair } from "@/types/index";

export type CalendarStickerEntry = {
	stickerId: string;
	earnedAt: number;
	mode: "test";
};

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
		progress: {
			lastOpenedAt: number;
			makingProblem: QAPair[];
			completedPoints: number[];
			studiedPoints: number[];
			calendarStickers: Record<string, CalendarStickerEntry[]>;
		};
	};
};

class AppDB extends Dexie {
	app!: Table<AppSnapshot, string>;
	constructor() {
		super("my-app-db");
		this.version(1).stores({
			app: "id, updatedAt",
		});
		// バージョン2: completedPoints を追加
		this.version(2)
			.stores({
				app: "id, updatedAt",
			})
			.upgrade((tx) => {
				return tx
					.table<AppSnapshot>("app")
					.toCollection()
					.modify((row) => {
						row.version = 2;
						row.state.progress.completedPoints ??= [];
					});
			});
		// バージョン3: studiedPoints を追加
		this.version(3)
			.stores({
				app: "id, updatedAt",
			})
			.upgrade((tx) => {
				return tx
					.table<AppSnapshot>("app")
					.toCollection()
					.modify((row) => {
						row.version = 3;
						row.state.progress.studiedPoints ??= [];
					});
			});
		// バージョン4: calendarStickers を追加
		this.version(4)
			.stores({
				app: "id, updatedAt",
			})
			.upgrade((tx) => {
				return tx
					.table<AppSnapshot>("app")
					.toCollection()
					.modify((row) => {
						row.version = 4;
						row.state.progress.calendarStickers ??= {};
					});
			});
	}
}
export const db = new AppDB();
