// src/hooks/useTypingEngine.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { judgeChar } from "@/lib/judge";
import {
	appendMakingProblems,
	removeMakingProblem,
} from "@/repositories/appStateRepository";
import type { EngineOptions, EngineState, QAPair } from "@/types/index";

function mulberry32(a: number) {
	return () => {
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

export function useTypingEngine(
	opts: EngineOptions,
	QA: QAPair[],
	makingProblem: boolean,
) {
	const tickMs = Math.max(16, opts.tickMs ?? 100);
	const { speak } = useSpeech();

	const [order, setOrder] = useState<number[]>([]);
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
		problemUsedHint: false,
		hintStep: 0,
		learningPhase: "study",
	}));

	// 経過時間（秒）
	const [nowMs, setNowMs] = useState<number>(Date.now());
	const elapsedSec = useMemo(() => {
		if (!state.started || !state.startAt) return 0;
		return Math.max(0, Math.floor((nowMs - state.startAt) / 1000));
	}, [nowMs, state.started, state.startAt]);

	// 問題単位の集計（重複防止に Set を採用）
	const mistakesSetRef = useRef<Set<number>>(new Set());
	const hintsSetRef = useRef<Set<number>>(new Set());
	const [problemsWithMistake, setProblemsWithMistake] = useState(0);
	const [problemsWithHint, setProblemsWithHint] = useState(0);

	// 進行制御
	const progressingRef = useRef(false); // next() の再入防止
	const startedRef = useRef(false); // 初回ロード制御

	// 問題順の初期化
	const initOrder = useCallback(() => {
		const seed = opts.seed ?? Date.now() % 1_000_000;
		const indices = Array.from({ length: QA.length }, (_, i) => i);
		const useRandom = opts.randomOrder ?? true;
		setOrder(useRandom ? shuffle(indices, seed) : indices);
	}, [opts.seed, QA.length, opts.randomOrder]);

	// 問題ロード
	const loadPair = useCallback(
		(nextIdx: number) => {
			const pairIndex = order[nextIdx] ?? 0;
			const pair: QAPair = QA[pairIndex] ?? QA[0];
			const learning = !!opts.learningMode;

			progressingRef.current = false;

			setState((s) => ({
				...s,
				index: nextIdx,
				questionJa: pair.ja,
				answerEn: pair.en,
				questionImg: pair.img,
				typed: "",
				correctMap: [],
				showHint: learning,
				problemHasMistake: false,
				problemUsedHint: false,
				hintStep: 0,
				learningPhase: "study",
			}));
		},
		[order, opts.learningMode, QA],
	);

	// セッション開始
	const start = useCallback(() => {
		initOrder();
		startedRef.current = true;
		const now = Date.now();
		setNowMs(now);

		// 集計をリセット
		mistakesSetRef.current.clear();
		hintsSetRef.current.clear();
		setProblemsWithMistake(0);
		setProblemsWithHint(0);

		progressingRef.current = false;

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
			problemUsedHint: false,
			hintStep: 0,
			learningPhase: "study",
		});
	}, [initOrder, opts.learningMode]);

	// ストップウォッチ（時間制限は無し）
	useEffect(() => {
		if (!state.started || state.finished) return;
		setNowMs(Date.now());
		const id = setInterval(() => setNowMs(Date.now()), tickMs);
		return () => clearInterval(id);
	}, [state.started, state.finished, tickMs]);

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

	// 学習モードの study 段で最初の音声
	const spokenRef = useRef<string>("");
	useEffect(() => {
		if (!state.started || state.finished) return;
		if (!opts.learningMode) return;
		if (!state.answerEn) return;
		if (state.learningPhase !== "study") return;
		const key = `${state.index}:${state.answerEn}`;
		if (spokenRef.current !== key) {
			spokenRef.current = key;
			speak(state.answerEn, { lang: "en-US" });
		}
	}, [
		state.started,
		state.finished,
		state.index,
		state.answerEn,
		opts.learningMode,
		speak,
		state.learningPhase,
	]);

	// 学習モード中は showHint を維持（自動表示≠ヒント使用カウント）
	useEffect(() => {
		if (!state.started || state.finished) return;
		const learning = !!opts.learningMode;
		setState((s) => ({
			...s,
			showHint: s.showHint || learning,
		}));
	}, [opts.learningMode, state.started, state.finished]);

	// 現在の問題を重複なしで確定集計
	const finalizeCurrentProblem = useCallback(
		(s: EngineState) => {
			const seqIndex = s.index; // 出題シーケンス上のインデックス
			if (s.problemHasMistake) {
				mistakesSetRef.current.add(seqIndex);
			}
			if (s.problemUsedHint) {
				hintsSetRef.current.add(seqIndex);
			}
			// Set のサイズを state に反映
			setProblemsWithMistake(mistakesSetRef.current.size);
			setProblemsWithHint(hintsSetRef.current.size);

			// ★ 追加：学習モードの "study" フェーズでは保存しない
			const skipSave = !!opts.learningMode && s.learningPhase === "study";
			// ★ IndexedDB へ保存：ミス or ヒント使用した問題のみ
			if ((s.problemHasMistake || s.problemUsedHint) && !skipSave) {
				const pairIndex = order[seqIndex] ?? 0;
				const pair: QAPair = QA[pairIndex] ?? QA[0];
				void appendMakingProblems([pair], { unique: true });
			}
		},
		[order, QA, opts.learningMode],
	);

	const next = useCallback(() => {
		if (progressingRef.current) return; // 再入防止
		progressingRef.current = true;

		setState((s) => {
			// この問題を確定集計（Set により重複は無効化）
			finalizeCurrentProblem(s);

			const hasNext = s.index + 1 < order.length;
			if (!hasNext) {
				progressingRef.current = false;
				return { ...s, finished: true };
			}

			const nextIndex = s.index + 1;
			const pairIndex = order[nextIndex] ?? 0;
			const pair: QAPair = QA[pairIndex] ?? QA[0];
			const learning = !!opts.learningMode;

			progressingRef.current = false;

			return {
				...s,
				index: nextIndex,
				questionJa: pair.ja,
				answerEn: pair.en,
				questionImg: pair.img,
				typed: "",
				correctMap: [],
				showHint: learning,
				problemHasMistake: false,
				problemUsedHint: false,
				hintStep: 0,
				learningPhase: "study",
			};
		});
	}, [order, opts.learningMode, QA, finalizeCurrentProblem]);

	const stop = useCallback(() => {
		setState((s) => {
			// 最後の問題を未集計のままでも重複なしで確定
			finalizeCurrentProblem(s);
			progressingRef.current = false;
			return { ...s, finished: true };
		});
	}, [finalizeCurrentProblem]);

	const setLearningPhase = useCallback(
		(phase: "study" | "recall") => {
			setState((s) => ({
				...s,
				learningPhase: phase,
				showHint: phase === "study" || !!opts.learningMode,
				typed: "",
				correctMap: [],
				hintStep: 0,
			}));
		},
		[opts.learningMode],
	);

	const onKey = useCallback(
		(key: string) => {
			if (!state.started || state.finished || state.answerEn.length === 0)
				return;

			if (key === " ") {
				next();
				return;
			}

			if (key === "\t") {
				const inRecall =
					!!opts.learningMode &&
					!!opts.learnThenRecall &&
					state.learningPhase === "recall";

				// 通常モード or recall 段では Tab ヒントを有効化
				if (!opts.learningMode || inRecall) {
					if (state.hintStep === 0) {
						speak(state.answerEn, { lang: "en-US" });
						setState((s) => ({
							...s,
							hintStep: 1,
							problemUsedHint: true, // Tab 使用でのみカウント対象
						}));
					} else if (state.hintStep === 1) {
						setState((s) => ({
							...s,
							hintStep: 2,
							showHint: true,
							problemUsedHint: true,
						}));
					}
				}
				return;
			}

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

			if (key === "\n") return;

			if (state.typed.length >= state.answerEn.length) {
				return;
			}

			const cursor = state.typed.length;
			const res = judgeChar(state.answerEn, cursor, key);

			setState((s) => ({
				...s,
				typed: s.typed + key,
				correctMap: [...s.correctMap, res.ok],
				// スコア表示はしないが互換のため内部カウントは維持
				hits: s.hits + (res.ok ? 1 : 0),
				errors: s.errors + (res.ok ? 0 : 1),
				problemHasMistake: s.problemHasMistake || !res.ok,
			}));

			const willCompleteLen = cursor + 1 === state.answerEn.length;
			const allPrevCorrect = state.correctMap.every(Boolean);
			const completesAllCorrect = willCompleteLen && res.ok && allPrevCorrect;

			if (completesAllCorrect) {
				// 学習モードの二段階（study→recall）
				if (
					opts.learningMode &&
					opts.learnThenRecall &&
					state.learningPhase === "study"
				) {
					setState((s) => ({
						...s,
						learningPhase: "recall",
						showHint: false,
						typed: "",
						correctMap: [],
						hintStep: 0,
					}));
					return;
				}
				// テスト（learningMode=false）で正解したら削除
				if (!opts.learningMode && makingProblem) {
					const pairIndex = order[state.index] ?? 0;
					const pair: QAPair = QA[pairIndex] ?? QA[0];
					void removeMakingProblem(pair); // 書き捨てでOK（失敗してもゲーム継続）
				}
				// 自動で次の問題へ（重複は Set で抑止）
				setTimeout(next, 0);
			}
		},
		[
			state,
			next,
			opts.learningMode,
			opts.learnThenRecall,
			speak,
			makingProblem,
			QA,
			order,
		],
	);

	return {
		state,
		elapsedSec,
		problemsWithMistake,
		problemsWithHint,
		start,
		stop,
		next,
		onKey,
		setLearningPhase,
	};
}
