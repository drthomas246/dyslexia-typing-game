import type { PhaseNoticeProps } from "@/types/index";
import { Badge, HStack, Text } from "@chakra-ui/react";

export default function PhaseNotice({
  learningMode,
  learnThenRecall,
  phase,
}: PhaseNoticeProps) {
  if (!learningMode) return null;

  if (learnThenRecall) {
    const isStudy = phase === "study";
    return (
      <HStack h="24px">
        <Badge colorPalette={isStudy ? "blue" : "purple"} variant="solid">
          {isStudy
            ? "練習（スペル＋音声）"
            : "ふく習（Tabキーでヒント。1回目で音声・2回目でスペル）"}
        </Badge>
        <Text fontSize="sm" color="fg.muted">
          学習で正かい → ふく習へ ふく習で正かいすると次の問題に進みます。
        </Text>
      </HStack>
    );
  }

  return (
    <HStack h="24px">
      <Badge colorPalette="blue" variant="solid">
        練習（スペル＋音声）
      </Badge>
      <Text fontSize="sm" color="fg.muted">
        学習で正かい → 次の問題に進みます。
      </Text>
    </HStack>
  );
}
