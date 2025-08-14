import { Box } from "@chakra-ui/react";

export default function SentenceView({
  sentence,
  cursor,
  hitsMap,
}: {
  sentence: string;
  cursor: number;
  hitsMap: boolean[]; // true=正打, false=誤打（その位置で一度でもミス）
}) {
  return (
    <Box
      fontFamily="mono"
      fontSize={{ base: "lg", md: "2xl" }}
      wordBreak="break-word"
      lineHeight="1.8"
    >
      {sentence.split("").map((ch, i) => {
        const isPast = i < cursor;
        const isCursor = i === cursor;
        const isHit = hitsMap[i] === true;
        const color = isPast
          ? isHit
            ? "green.600"
            : "red.500"
          : isCursor
          ? "blue.600"
          : "fg";

        const deco = isCursor ? "underline" : "none";
        const weight = isCursor ? "bold" : "normal";

        return (
          <Box
            as="span"
            key={i}
            color={color}
            textDecoration={deco}
            fontWeight={weight}
            whiteSpace="pre" // 空白をそのまま表示
          >
            {ch}
          </Box>
        );
      })}
    </Box>
  );
}
