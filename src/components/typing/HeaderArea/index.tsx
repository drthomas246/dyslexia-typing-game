import HeaderControls from "@/components/typing/HeaderArea/HeaderControls";
import type { HeaderAreaProps } from "@/types/index";
import { HStack, Heading } from "@chakra-ui/react";

export default function HeaderArea({
  setPage,
  title,
  start,
  stop,
  state,
  setShouldPlay,
  settings,
  onOpen,
}: HeaderAreaProps) {
  // Start / Escape
  const handleStart = () => {
    setShouldPlay(false);
    start();
  };
  const handleEscape = () => {
    stop("escape"); // shouldPlay は enabled が true なら自動的に再生に戻る
  };
  return (
    <HStack justify="space-between" h="40px">
      <Heading size="lg">タイピングゲーム ～{title}～</Heading>
      <HeaderControls
        learningMode={settings.learningMode}
        started={state.started}
        finished={state.finished}
        onStart={handleStart}
        onEscape={handleEscape}
        onOpenSettings={onOpen}
        onBack={() => {
          setShouldPlay(false);
          setPage("home");
        }}
      />
    </HStack>
  );
}
