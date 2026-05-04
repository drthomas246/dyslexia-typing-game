import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import { getStickerEmoji } from "@/components/StickerCalendar";
import type { ResultsModalProps } from "@/types/index";

export default function ResultsModalChakra({
  open,
  setOpen,
  onRetry,
  stickerPicker,
  summary,
}: ResultsModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      size="lg"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded="xl">
            <Dialog.Header>
              <Dialog.Title>
                けっか
                <ruby>
                  発表<rt style={{ fontSize: "0.5em" }}>はっぴょう</rt>
                </ruby>
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <HStack gap="6" wrap="wrap">
                <Stat.Root>
                  <Stat.Label alignItems="end">
                    かかった
                    <ruby>
                      時間<rt style={{ fontSize: "0.5em" }}>じかん</rt>
                    </ruby>
                  </Stat.Label>
                  <Stat.ValueText fontSize="2xl" alignItems="end">
                    {summary.timeSec}
                    <ruby>
                      秒<rt style={{ fontSize: "0.5em" }}>びょう</rt>
                    </ruby>
                  </Stat.ValueText>
                </Stat.Root>
                <Stat.Root>
                  <Stat.Label alignItems="end">
                    ヒントを
                    <ruby>
                      表示<rt style={{ fontSize: "0.5em" }}>ひょうじ</rt>
                    </ruby>
                    した
                    <ruby>
                      問題数<rt style={{ fontSize: "0.5em" }}>もんだいすう</rt>
                    </ruby>
                  </Stat.Label>
                  <Stat.ValueText fontSize="2xl" alignItems="end">
                    {summary.hints}{" "}
                    <ruby>
                      問<rt style={{ fontSize: "0.5em" }}>もん</rt>
                    </ruby>
                  </Stat.ValueText>
                </Stat.Root>
                <Stat.Root>
                  <Stat.Label alignItems="end">
                    ミスした
                    <ruby>
                      問題数<rt style={{ fontSize: "0.5em" }}>もんだいすう</rt>
                    </ruby>
                  </Stat.Label>
                  <Stat.ValueText fontSize="2xl" alignItems="end">
                    {summary.errors}
                    <ruby>
                      問<rt style={{ fontSize: "0.5em" }}>もん</rt>
                    </ruby>
                  </Stat.ValueText>
                </Stat.Root>
              </HStack>
              {stickerPicker?.enabled ? (
                <Stack mt="6" gap="3">
                  <Text fontWeight="bold">
                    ステッカーを 1まい えらんで カレンダーに はる
                  </Text>
                  <Box
                    rounded="xl"
                    borderWidth="1px"
                    bg="orange.50"
                    borderColor="orange.200"
                    p="4"
                    maxW="220px"
                  >
                    <Text fontSize="sm" color="fg.muted">
                      {stickerPicker.previewDateLabel}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" mt="1">
                      きょうの マス
                    </Text>
                    <Box
                      mt="3"
                      minH="72px"
                      rounded="lg"
                      borderWidth="1px"
                      bg="white"
                      p="3"
                      fontSize="3xl"
                      lineHeight="1.2"
                    >
                      {stickerPicker.previewStickers.length ? (
                        stickerPicker.previewStickers.map((stickerId, index) => (
                          <Text as="span" key={`${stickerId}-${index}`}>
                            {getStickerEmoji(stickerPicker.options, stickerId)}
                          </Text>
                        ))
                      ) : (
                        <Text fontSize="sm" color="fg.muted">
                          ここに シールが はられます
                        </Text>
                      )}
                    </Box>
                  </Box>
                  <HStack gap="3" wrap="wrap">
                    {stickerPicker.options.map((option) => {
                      const isSelected =
                        stickerPicker.selectedStickerId === option.id;
                      return (
                        <Button
                          key={option.id}
                          variant={isSelected ? "solid" : "outline"}
                          colorPalette={isSelected ? "orange" : "gray"}
                          onClick={() => stickerPicker.onSelect(option.id)}
                          disabled={
                            stickerPicker.saving ||
                            stickerPicker.selectedStickerId !== undefined
                          }
                          h="auto"
                          minW="88px"
                          py="3"
                        >
                          <Stack gap="1">
                            <Box fontSize="3xl" lineHeight="1">
                              {option.emoji}
                            </Box>
                            <Text fontSize="sm">{option.label}</Text>
                          </Stack>
                        </Button>
                      );
                    })}
                  </HStack>
                  {stickerPicker.selectedStickerId ? (
                    <Text color="green.600">
                      ステッカーを カレンダーに はりました。
                    </Text>
                  ) : stickerPicker.saving ? (
                    <Text color="fg.muted">ほぞんしています...</Text>
                  ) : null}
                </Stack>
              ) : null}
            </Dialog.Body>
            <Dialog.Footer gap="2">
              <Button
                colorPalette="blue"
                onClick={onRetry}
                alignItems="end"
                paddingY="5px"
              >
                もう
                <ruby>
                  一度<rt style={{ fontSize: "0.5em" }}>いちど</rt>
                </ruby>
                やる
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>
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
