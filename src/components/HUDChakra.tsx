// src/components/HUDChakra.tsx
import { Box, HStack, Progress, SimpleGrid, Stat } from "@chakra-ui/react";

export type HUDProps = {
  wpm: number;
  accuracy: number; // 0-100
  timeLeftSec: number;
  combo: number;
};

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
          <Stat.Label>WPM</Stat.Label>
          <Stat.ValueText fontSize="3xl" fontWeight="bold">
            {Math.max(0, Math.round(wpm))}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root>
          <Stat.Label>Accuracy</Stat.Label>
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
          <Stat.Label>Time Left</Stat.Label>
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
          <Stat.Label>Combo</Stat.Label>
          <Stat.ValueText>{combo}x</Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>
    </Box>
  );
}
