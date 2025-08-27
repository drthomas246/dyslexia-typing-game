// src/components/ResultsDialogChakra.tsx
import type { ResultsDialogProps } from "@/types/index";
import {
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Stat,
} from "@chakra-ui/react";

export default function ResultsDialogChakra({
  open,
  setOpen,
  onRetry,
  setShouldBgmPlay,
  summary,
}: ResultsDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      size="sm"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded="xl">
            <Dialog.Header>
              <Dialog.Title>けっか発表</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <HStack gap="6" wrap="wrap">
                <Stat.Root>
                  <Stat.Label>時間</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {summary.timeSec}s
                  </Stat.ValueText>
                </Stat.Root>
                {!summary.learningMode && (
                  <Stat.Root>
                    <Stat.Label>ヒントを使った問題数</Stat.Label>
                    <Stat.ValueText fontSize="2xl">
                      {summary.usedHintCount}
                    </Stat.ValueText>
                  </Stat.Root>
                )}

                <Stat.Root>
                  <Stat.Label>まちがえた問題数</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {summary.mistakeProblemCount}
                  </Stat.ValueText>
                </Stat.Root>
              </HStack>
            </Dialog.Body>

            <Dialog.Footer gap="2">
              <Button colorPalette="blue" onClick={onRetry}>
                もう一度やる
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShouldBgmPlay(true);
                    setOpen(false);
                  }}
                >
                  とじる
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
