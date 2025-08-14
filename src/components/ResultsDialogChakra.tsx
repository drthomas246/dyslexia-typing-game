// src/components/ResultsModalChakra.tsx
import {
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Stat,
} from "@chakra-ui/react";

export type ResultsModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onRetry: () => void;
  summary: { wpm: number; accuracy: number; timeSec: number; errors: number };
};

export default function ResultsModalChakra({
  open,
  setOpen,
  onRetry,
  summary,
}: ResultsModalProps) {
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
              <Dialog.Title>Results</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap="6" wrap="wrap">
                <Stat.Root>
                  <Stat.Label>WPM</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {Math.round(summary.wpm)}
                  </Stat.ValueText>
                </Stat.Root>
                <Stat.Root>
                  <Stat.Label>Accuracy</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {Math.round(summary.accuracy)}%
                  </Stat.ValueText>
                </Stat.Root>
                <Stat.Root>
                  <Stat.Label>Time</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {summary.timeSec}s
                  </Stat.ValueText>
                </Stat.Root>
                <Stat.Root>
                  <Stat.Label>Errors</Stat.Label>
                  <Stat.ValueText fontSize="2xl">
                    {summary.errors}
                  </Stat.ValueText>
                </Stat.Root>
              </HStack>
            </Dialog.Body>
            <Dialog.Footer gap="2">
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="blue" onClick={onRetry}>
                Retry
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
