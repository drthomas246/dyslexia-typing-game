import type { HeaderControlsProps } from "@/types/index";
import { Button, HStack } from "@chakra-ui/react";

export default function HeaderControls({
  learningMode,
  started,
  finished,
  onStart,
  onEscape,
  onOpenSettings,
  onBack,
}: HeaderControlsProps) {
  return (
    <HStack>
      <Button onClick={onBack} variant="outline">
        もどる
      </Button>
      <Button onClick={onOpenSettings} variant="outline">
        せってい
      </Button>
      {!started || finished ? (
        <Button colorPalette="blue" onClick={onStart}>
          {learningMode ? "始める" : "バトル"}
        </Button>
      ) : (
        <Button colorPalette="red" onClick={onEscape}>
          {learningMode ? "終わる" : "にげる"}
        </Button>
      )}
    </HStack>
  );
}
