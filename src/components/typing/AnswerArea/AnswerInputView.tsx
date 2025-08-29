import type { AnswerInputViewProps } from "@/types/index";
import { Box } from "@chakra-ui/react";

export default function AnswerInputView({
  typed,
  correctMap,
  answer,
  showHint,
}: AnswerInputViewProps) {
  const last = typed.length - 1;
  const displayChars = showHint ? answer.split("") : typed.split("");

  return (
    <Box
      fontFamily="mono"
      fontSize={{ base: "lg", md: "2xl" }}
      lineHeight="1.8"
      wordBreak="break-word"
    >
      {displayChars.map((ch, i) => {
        if (!showHint) {
          // ヒントOFF
          if (typed.length === 0) return null;
          if (i >= typed.length) return null; // 未入力は表示しない
          if (i === last) {
            const color = correctMap[i] ? "blue.solid" : "red.solid";
            return (
              <Box as="span" key={i} color={color} whiteSpace="pre">
                {typed[i]}
              </Box>
            );
          }
          const color = correctMap[i] ? "fg" : "red.solid";
          return (
            <Box as="span" key={i} color={color} whiteSpace="pre">
              {typed[i]}
            </Box>
          );
        }

        // ヒントON
        if (i < typed.length) {
          // 入力済み部分
          if (i === last) {
            // 直近は青/赤
            const color = correctMap[i] ? "blue.solid" : "red.solid";
            return (
              <Box as="span" key={i} color={color} whiteSpace="pre">
                {typed[i]}
              </Box>
            );
          }
          // それ以前は「正解=黒 / 不正解=赤」
          const color = correctMap[i] ? "fg" : "red.solid";
          return (
            <Box as="span" key={i} color={color} whiteSpace="pre">
              {typed[i]}
            </Box>
          );
        } else {
          // 未入力は答えを灰色ゴースト表示
          return (
            <Box as="span" key={i} color="gray.focusRing" whiteSpace="pre">
              {ch}
            </Box>
          );
        }
      })}

      {typed.length === 0 && !showHint && (
        <Box as="span" color="fg.muted">
          (こたえのスペルをにゅうりょくしてね)
        </Box>
      )}
    </Box>
  );
}
