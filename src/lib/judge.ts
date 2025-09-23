import type { JudgeResult } from "@/types/index";

const lowerIfAlpha = (ch: string) =>
	/[a-z]/i.test(ch) ? ch.toLowerCase() : ch;

/** 英文の回答に対して1文字判定（大小無視） */
export function judgeChar(
	answerEn: string,
	cursor: number,
	key: string,
): JudgeResult {
	const exp = answerEn[cursor] ?? "";
	if (key === "\n" || key === "\b")
		return { ok: false, expected: exp, received: key };
	const ok = lowerIfAlpha(exp) === lowerIfAlpha(key);
	return { ok, expected: exp, received: key };
}
