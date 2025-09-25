import QA_MONTH from "@/data/texts/qa_month";
import QA_NUMBER from "@/data/texts/qa_number";
import QA_NUMBER11 from "@/data/texts/qa_number11";
import QA_STEP1 from "@/data/texts/qa_step1";
import QA_WEEK from "@/data/texts/qa_week";

import type { MapPoint } from "@/types/index";
import QA_3part3 from "./texts/3part3";
import QA_4part1 from "./texts/4part1";
import QA_4part2 from "./texts/4part2";
import QA_4take1 from "./texts/4take1";
import QA_4take2 from "./texts/4task2";

export const TYPING_ROUTE_POINTS: MapPoint[] = [
  { id: 1, x: 0.2, y: 0.3, title: "1～10までの数字", QA: QA_NUMBER },
  { id: 2, x: 0.65, y: 0.45, title: "11～20までの数字", QA: QA_NUMBER11 },
  { id: 3, x: 0.77, y: 0.77, title: "月の名前", QA: QA_MONTH },
  { id: 4, x: 0.285, y: 0.8, title: "曜日の名前", QA: QA_WEEK },
  { id: 5, x: 0.5, y: 0.2, title: "ステップ1", QA: QA_STEP1 },
  { id: 6, x: 0.5, y: 0.2, title: "Lesson3 Part3", QA: QA_3part3 },
  { id: 7, x: 0.5, y: 0.2, title: "Lesson4 Part1", QA: QA_4part1 },
  { id: 8, x: 0.5, y: 0.2, title: "Lesson4 Part2", QA: QA_4part2 },
  { id: 9, x: 0.5, y: 0.2, title: "Lesson4 take action1", QA: QA_4take1 },
  { id: 10, x: 0.5, y: 0.2, title: "Lesson4 take action2", QA: QA_4take2 },
];
