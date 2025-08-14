// src/components/HUDChakra.tsx
import type { HUDProps } from "@/types/index";
import { Box, HStack, Progress, SimpleGrid, Stat } from "@chakra-ui/react";

export default function HUDChakra({
  wpm,
  accuracy,
  timeLeftSec,
  combo,
}: HUDProps) {
  return (
    <Box p="4" rounded="xl" borderWidth="1px" bg="bg" shadow="sm">
      <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
        <Stat.Root>
          <Stat.Label>1分間に打った単語の数</Stat.Label>
          <Stat.ValueText fontSize="3xl" fontWeight="bold">
            {Math.max(0, Math.round(wpm))}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root>
          <Stat.Label>正確さ</Stat.Label>
          <HStack>
            <Stat.ValueText>
              {Math.max(0, Math.min(100, Math.round(accuracy)))}%
            </Stat.ValueText>
          </HStack>
          <Progress.Root
            value={accuracy}
            mt="1"
            rounded="full"
            colorPalette="green"
          >
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Stat.Root>

        <Stat.Root>
          <Stat.Label>のこり時間</Stat.Label>
          <Stat.ValueText>{timeLeftSec}s</Stat.ValueText>
          <Progress.Root
            value={Math.max(0, Math.min(100, (timeLeftSec / 60) * 100))}
            mt="1"
          >
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        </Stat.Root>

        <Stat.Root>
          <Stat.Label>つづけてあたった回数</Stat.Label>
          <Stat.ValueText>{combo}x</Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>
    </Box>
  );
}
