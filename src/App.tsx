import {
  Button,
  CloseButton,
  Container,
  Dialog,
  For,
  Grid,
  Heading,
  HStack,
  Box,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useLiveQuery } from "dexie-react-hooks";
import parse from "html-react-parser";
import { useState } from "react";
import StickerCalendar from "@/components/StickerCalendar";
import { usePage, useSetPage } from "@/contexts/PageContext";
import { STICKER_OPTIONS } from "@/data/stickers";
import { TYPING_ROUTE_POINTS } from "@/data/points";
import Typing from "@/pages/TypingPage";
import {
  clearMakingProblems,
  getCalendarStickers,
  getCompletedPoints,
  getMakingProblems,
  getStudiedPoints,
} from "@/repositories/appStateRepository";

// 文字数ごとにグループ化
function groupByCharCount(points: typeof TYPING_ROUTE_POINTS) {
  const groups = new Map<number, typeof points>();

  for (const point of points) {
    const match = point.titleRaw.match(/^(\d+)文字/);
    const charCount = match ? Number.parseInt(match[1], 10) : 0;

    if (!groups.has(charCount)) {
      groups.set(charCount, []);
    }
    groups.get(charCount)?.push(point);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([charCount, items]) => ({ charCount, items }));
}

export default function App() {
  const making = useLiveQuery(() => getMakingProblems(), [], []);
  const completedIds = useLiveQuery(() => getCompletedPoints(), [], []) as
    | number[]
    | undefined;
  const studiedIds = useLiveQuery(() => getStudiedPoints(), [], []) as
    | number[]
    | undefined;
  const calendarStickers = useLiveQuery(() => getCalendarStickers(), [], {}) as
    | Record<string, { stickerId: string; earnedAt: number; mode: "test" }[]>
    | undefined;
  const page = usePage();
  const setPage = useSetPage();
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ポイントに完了フラグと学習済みフラグを追加
  const pointsWithCompletion = TYPING_ROUTE_POINTS.map((point) => ({
    ...point,
    completed: completedIds ? completedIds.includes(point.id) : false,
    studied: studiedIds ? studiedIds.includes(point.id) : false,
  }));

  const qaData = (page: number) => {
    if (page === 999999) {
      return making;
    } else {
      return TYPING_ROUTE_POINTS[page - 1].QA;
    }
  };

  const titleData = (page: number) => {
    if (page === 999999) {
      return "まちがえた問題";
    } else {
      return TYPING_ROUTE_POINTS[page - 1].title;
    }
  };

  return (
    <>
      {page === 0 ? (
        <Container p="6" maxW="container.lg">
          <Stack gap="6">
            <HStack justify="space-between">
              <Heading size="4xl">タイピングゲーム</Heading>
              <Box>
                <Text as="span" bgColor="yellow.solid">
                  <ruby>黄色<rt style={{ fontSize: "0.5em" }}>きいろ</rt></ruby>
                </Text>は
                <ruby>学習<rt style={{ fontSize:"0.5em"}}>がくしゅう</rt></ruby>とちゅう
              </Box>
              <Box>
                <Text as="span" bgColor="green.solid">
                  <ruby style={{ color: "white"}}>緑色<rt style={{ fontSize: "0.5em", color: "black" }}>みどりいろ</rt></ruby>
                </Text>は
                <ruby>学習<rt style={{ fontSize: "0.5em",color: "black" }}>がくしゅう</rt></ruby>ずみ
              </Box>
              <HStack>
                <Button
                  variant="outline"
                  colorPalette="blue"
                  onClick={() => setCalendarOpen(true)}
                  alignItems="end"
                  paddingY="5px"
                >
                  カレンダー
                </Button>
                <Button
                  variant="outline"
                  colorPalette="orange"
                  onClick={() => clearMakingProblems()}
                  alignItems="end"
                  paddingY="5px"
                >
                  りれきの
                  <ruby>
                    全消去<rt style={{ fontSize: "0.5em" }}>ぜんしょうきょ</rt>
                  </ruby>
                </Button>
              </HStack>
            </HStack>
            {making.length ? (
              <Stack gap="3">
                <Heading size="xl">
                  ふく
                  <ruby>
                    習<rt style={{ fontSize: "0.5em" }}>しゅう</rt>
                  </ruby>
                </Heading>
                <Button
                  colorPalette="teal"
                  onClick={() => setPage(999999)}
                  alignItems="end"
                  paddingY="5px"
                >
                  まちがえた　たん
                  <ruby>
                    語<rt style={{ fontSize: "0.5em" }}>ご</rt>
                  </ruby>{" "}
                  ( {making.length}
                  <ruby>
                    問<rt style={{ fontSize: "0.5em" }}>もん</rt>
                  </ruby>
                  )
                </Button>
              </Stack>
            ) : null}
            <For each={groupByCharCount(pointsWithCompletion)}>
              {(group) => (
                <Stack key={group.charCount} gap="3">
                  <Heading size="xl">
                    {group.charCount}
                    <ruby>
                      文字<rt style={{ fontSize: "0.5em" }}>もじ</rt>
                    </ruby>
                  </Heading>
                  <Grid
                    templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                    gap="3"
                  >
                    <For each={group.items}>
                      {(item, index) => (
                        <Button
                          key={index}
                          onClick={() => setPage(item.id)}
                          variant={
                            item.completed || item.studied ? "solid" : "outline"
                          }
                          colorPalette={
                            item.completed
                              ? "green"
                              : item.studied
                                ? "yellow"
                                : "gray"
                          }
                        >
                          {item.completed && "✓ "}
                          {parse(item.title)}
                        </Button>
                      )}
                    </For>
                  </Grid>
                </Stack>
              )}
            </For>
          </Stack>
        </Container>
      ) : (
        <Typing
          QA={qaData(page)}
          title={titleData(page)}
          makingProblem={page === 999999}
          pointId={page === 999999 ? undefined : page}
        />
      )}
      <Dialog.Root
        open={calendarOpen}
        onOpenChange={(e) => setCalendarOpen(e.open)}
        size="xl"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content rounded="xl">
              <Dialog.Header>
                <Dialog.Title>カレンダー</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <StickerCalendar
                  stickersByDate={calendarStickers ?? {}}
                  stickerOptions={STICKER_OPTIONS}
                />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
