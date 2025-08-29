import type { PlayerHpBarProps } from "@/types/index";
import { Badge, Box, HStack, Text } from "@chakra-ui/react";

export default function PlayerHpBar({ current, max, pct }: PlayerHpBarProps) {
  return (
    <HStack gap="3" align="center" h="24px">
      <Badge colorPalette="blue" variant="solid">
        あなたのHP
      </Badge>
      <Box
        flex="1"
        h="18px"
        rounded="full"
        bg="blackAlpha.200"
        overflow="hidden"
      >
        <Box h="full" w={`${pct}%`} bg="blue.500" />
      </Box>
      <Text w="96px" textAlign="right">
        {current}/{max}
      </Text>
    </HStack>
  );
}
