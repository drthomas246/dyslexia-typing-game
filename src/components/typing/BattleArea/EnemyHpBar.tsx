import type { EnemyHpBarProps } from "@/types/index";
import { Badge, Box, HStack, Text } from "@chakra-ui/react";

export default function EnemyHpBar({ current, max, pct }: EnemyHpBarProps) {
  return (
    <HStack gap="3" align="center">
      <Badge colorPalette="purple" variant="solid">
        てきのHP
      </Badge>
      <Box
        flex="1"
        h="18px"
        rounded="full"
        bg="blackAlpha.200"
        overflow="hidden"
      >
        <Box h="full" w={`${pct}%`} bg="purple.500" />
      </Box>
      <Text w="96px" textAlign="right">
        {current}/{max}
      </Text>
    </HStack>
  );
}
