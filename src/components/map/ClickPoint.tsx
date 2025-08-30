import { Tooltip } from "@/components/ui/tooltip";
import type { ClickPointProps } from "@/types/index";
import { Box } from "@chakra-ui/react";

export function ClickPoint({
  point,
  containRect,
  showTooltip,
  onClick,
}: ClickPointProps) {
  // rect が未注入/未計算なら描画しない
  if (!containRect || containRect.w === 0 || containRect.h === 0) return null;

  const leftPx = containRect.x + point.x * containRect.w;
  const topPx = containRect.y + point.y * containRect.h;

  return (
    <Tooltip
      showArrow
      content={
        <Box fontSize="20px" m="4px" fontWeight="bold" color="gray.50">
          {point.title}
        </Box>
      }
      openDelay={120}
      closeDelay={80}
      contentProps={{ css: { "--tooltip-bg": "tomato" } }}
      open={showTooltip}
    >
      <Box
        pos="absolute"
        left={leftPx}
        top={topPx}
        transform="translate(-50%, -50%)"
        w="16px"
        h="16px"
        borderRadius="50%"
        bg="yellow.200"
        boxShadow="0 0 0 2px rgba(0,0,0,.25)"
        cursor="pointer"
        onClick={onClick}
        _before={{ content: '""', position: "absolute", inset: "-6px" }}
        zIndex={1}
      />
    </Tooltip>
  );
}
