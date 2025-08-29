import AnswerInputView from "@/components/typing/AnswerArea/AnswerInputView";
import InputCapture from "@/components/typing/AnswerArea/InputCapture";
import type { AnswerPanelProps } from "@/types/index";
import { Box, Text } from "@chakra-ui/react";

export default function AnswerPanel({
  typed,
  correctMap,
  answer,
  showHint,
  state,
  inputOnKey,
  resultOpen,
}: AnswerPanelProps) {
  return (
    <>
      <Box p="4" rounded="xl" borderWidth="1px" bg="bg.panel" h="109px">
        <AnswerInputView
          typed={typed}
          correctMap={correctMap}
          answer={answer}
          showHint={showHint}
        />
        <Text mt="2" fontSize="sm" color="fg.muted">
          スペースキー: 次のたん語 / エンターキー: とじる / バックスペースキー:
          1文字消す / タブキー: ヒント
        </Text>
      </Box>
      <InputCapture
        enabled={state.started && !state.finished && !resultOpen}
        onKey={(ch, e) => {
          if (ch === "\n" && state.started && !state.finished) {
            e.preventDefault();
            stop();
            return;
          }
          inputOnKey(ch);
        }}
      />
    </>
  );
}
