import QA_MONTH from "@/data/texts/qa_month";
import QA_NUMBER from "@/data/texts/qa_number";
import QA_NUMBER11 from "@/data/texts/qa_number11";
import QA_STEP1 from "@/data/texts/qa_step1";
import QA_WEEK from "@/data/texts/qa_week";

import Typing from "@/pages/TypingPage";
import type { MapPoint } from "@/types/index";

export const TYPING_ROUTE_POINTS: MapPoint[] = [
  { id: 1, x: 0.2, y: 0.3, title: "1～10までの数字", QA: QA_NUMBER },
  { id: 2, x: 0.65, y: 0.45, title: "11～20までの数字", QA: QA_NUMBER11 },
  { id: 3, x: 0.77, y: 0.77, title: "月の名前", QA: QA_MONTH },
  { id: 4, x: 0.285, y: 0.8, title: "曜日の名前", QA: QA_WEEK },
  { id: 5, x: 0.5, y: 0.2, title: "ステップ1", QA: QA_STEP1 },
];

// 追加: case分だけを関数化（該当がなければ null）
export function renderTypingPage(page: number, sound: boolean | undefined) {
  const route = TYPING_ROUTE_POINTS.find((r) => r.id === page);
  if (!route) return null; // 該当なしならホーム画面にフォールバック
  return <Typing QA={route.QA} title={route.title} sound={sound} />;
}
