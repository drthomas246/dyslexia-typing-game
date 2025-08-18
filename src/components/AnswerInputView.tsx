import { Box } from "@chakra-ui/react";

/**
 * typed と correctMap を元に色分けして表示
 * - ヒントOFF:
 *   - 直近（末尾）の正解: 青 / 不正解: 赤
 *   - それ以前: 正解=黒 / 不正解=赤
 * - ヒントON:
 *   - 入力済みの直近: 正解=青 / 不正解=赤
 *   - 入力済みのそれ以前: 正解=黒 / 不正解=赤
 *   - 未入力: 答えを灰色ゴースト表示
 */
export default function AnswerInputView({
  typed,
  correctMap,
  answer,
  showHint,
}: {
  typed: string;
  correctMap: boolean[];
  answer: string;
  showHint: boolean;
}) {
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
            const color = correctMap[i] ? "blue.600" : "red.500";
            return (
              <Box as="span" key={i} color={color} whiteSpace="pre">
                {typed[i]}
              </Box>
            );
          }
          const color = correctMap[i] ? "black" : "red.500";
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
            const color = correctMap[i] ? "blue.600" : "red.500";
            return (
              <Box as="span" key={i} color={color} whiteSpace="pre">
                {typed[i]}
              </Box>
            );
          }
          // それ以前は「正解=黒 / 不正解=赤」
          const color = correctMap[i] ? "black" : "red.500";
          return (
            <Box as="span" key={i} color={color} whiteSpace="pre">
              {typed[i]}
            </Box>
          );
        } else {
          // 未入力は答えを灰色ゴースト表示
          return (
            <Box as="span" key={i} color="gray.400" whiteSpace="pre">
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
