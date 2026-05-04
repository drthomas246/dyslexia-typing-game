import { Box, Button, Grid, GridItem, HStack, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type { StickerOption } from "@/types/index";

type CalendarStickerMap = Record<
  string,
  { stickerId: string; earnedAt: number; mode: "test" }[]
>;

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function buildMonthKey(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;
}

export function getStickerEmoji(
  stickerOptions: StickerOption[],
  stickerId: string,
) {
  return stickerOptions.find((sticker) => sticker.id === stickerId)?.emoji ?? "❔";
}

export default function StickerCalendar({
  stickersByDate,
  stickerOptions,
}: {
  stickersByDate: CalendarStickerMap;
  stickerOptions: StickerOption[];
}) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const stickerMap = useMemo(
    () => new Map(stickerOptions.map((sticker) => [sticker.id, sticker])),
    [stickerOptions],
  );

  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const monthIndex = monthCursor.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, idx) => {
      const day = idx - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) {
        return null;
      }

      const dateKey = toDateKey(year, monthIndex, day);
      return {
        dateKey,
        day,
        stickers: stickersByDate[dateKey] ?? [],
      };
    });
  }, [monthCursor, stickersByDate]);

  return (
    <Stack gap="3">
      <HStack justify="space-between">
        <Text fontSize="xl" fontWeight="bold">
          カレンダー
        </Text>
        <HStack>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMonthCursor(
                (current) =>
                  new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            まえ
          </Button>
          <Text minW="120px" textAlign="center" fontWeight="medium">
            {buildMonthKey(monthCursor)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMonthCursor(
                (current) =>
                  new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            つぎ
          </Button>
        </HStack>
      </HStack>

      <Grid templateColumns="repeat(7, minmax(0, 1fr))" gap="2">
        {WEEKDAY_LABELS.map((label) => (
          <GridItem key={label}>
            <Text textAlign="center" fontWeight="bold" color="fg.muted">
              {label}
            </Text>
          </GridItem>
        ))}
        {cells.map((cell, index) => (
          <GridItem key={cell?.dateKey ?? `blank-${index}`}>
            <Box
              minH="92px"
              rounded="lg"
              borderWidth="1px"
              bg={cell ? "bg.panel" : "bg.subtle"}
              p="2"
              opacity={cell ? 1 : 0.45}
            >
              {cell ? (
                <Stack gap="2">
                  <Text fontSize="sm" fontWeight="bold">
                    {cell.day}
                  </Text>
                  <Box fontSize="2xl" lineHeight="1.2">
                    {cell.stickers.length ? (
                      cell.stickers.map((entry, stickerIndex) => (
                        <Text as="span" key={`${cell.dateKey}-${stickerIndex}`}>
                          {stickerMap.get(entry.stickerId)?.emoji ?? "❔"}
                        </Text>
                      ))
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        まだない
                      </Text>
                    )}
                  </Box>
                </Stack>
              ) : null}
            </Box>
          </GridItem>
        ))}
      </Grid>
    </Stack>
  );
}
