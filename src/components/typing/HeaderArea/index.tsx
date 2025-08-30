import HeaderControls from "@/components/typing/HeaderArea/HeaderControls";
import type { HeaderAreaProps } from "@/types/index";
import { HStack, Heading, Text } from "@chakra-ui/react";

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
      <Heading size="lg">
        {/* ことば：#1E90FF */}
        <Text as="span" color="#1E90FF">
          ことば
        </Text>
        の
        {/* 魔王：#E60033 + 黒縁（WebKit）/ Firefoxフォールバックにtext-shadow */}
        <Text as="span" color="#E60033" fontWeight="bold">
          魔王
        </Text>
        と{/* えいご：#228B22 */}
        <Text as="span" color="#228B22">
          えいご
        </Text>
        の
        {/* 勇者：#FFD700 + 上側だけ白ハイライト（グラデーションを文字にクリップ） */}
        <Text as="span" color="#FFD700">
          勇者
        </Text>{" "}
        ～{title}～
      </Heading>
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
