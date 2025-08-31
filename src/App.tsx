import { renderTypingPage, TYPING_ROUTE_POINTS } from "@/data/points";
import { useSpeech } from "@/hooks/useSpeech";
import {
  Button,
  Container,
  For,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

export default function App() {
  const [page, setPage] = useState<number>(0);
  const { warmup, waitUntilReady } = useSpeech();
  const go = (dest: number) => async () => {
    // ここはユーザー操作（クリック）内
    await waitUntilReady(); // voices が来るまで真に待つ（実装側でタイムアウトを外すこと推奨）
    await warmup(); // 無音1発でTTSを起こす
    setPage(dest); // その後にTypingへ遷移
  };

  const pageView = useMemo(() => renderTypingPage(page, false), [page]);

  // 該当ページならそれを表示。なければホームを表示。
  if (pageView) return pageView;

  return (
    <Container p="6" maxW="container.md">
      <Stack justify="space-between" gap="6">
        <Heading size="4xl">タイピングゲーム</Heading>
        <HStack>
          <For each={TYPING_ROUTE_POINTS}>
            {(item, index) => (
              <Button key={index} onClick={go(item.id)}>
                {item.title}
              </Button>
            )}
          </For>
        </HStack>
      </Stack>
    </Container>
  );
}
