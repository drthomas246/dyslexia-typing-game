import { useSpeech } from "@/hooks/useSpeech";
import QA_MONTH from "@/lib/texts/qa_month";
import QA_NUMBER from "@/lib/texts/qa_number";
import QA_NUMBER11 from "@/lib/texts/qa_number11";
import QA_TEST from "@/lib/texts/qa_test";
import QA_WEEK from "@/lib/texts/qa_week";
import { Button, Container, Heading, HStack, Stack } from "@chakra-ui/react";
import { useState } from "react";
import Typing from "./pages/typing";

export default function App() {
  const [page, setPage] = useState<
    "home" | "test" | "number" | "month" | "week" | "number11"
  >("home");
  const { warmup, waitUntilReady } = useSpeech();
  const go = (dest: typeof page) => async () => {
    // ここはユーザー操作（クリック）内
    await waitUntilReady(); // voices が来るまで真に待つ（実装側でタイムアウトを外すこと推奨）
    await warmup(); // 無音1発でTTSを起こす
    setPage(dest); // その後にTypingへ遷移
  };

  switch (page) {
    case "test":
      return <Typing QA={QA_TEST} title="Test問題" />;
    case "number":
      return <Typing QA={QA_NUMBER} title="1～10までの数字" />;
    case "number11":
      return <Typing QA={QA_NUMBER11} title="11～20までの数字" />;
    case "month":
      return <Typing QA={QA_MONTH} title="月の名前" />;
    case "week":
      return <Typing QA={QA_WEEK} title="曜日の名前" />;
  }
  return (
    <Container p="6" maxW="container.md">
      <Stack justify="space-between" gap="6">
        <Heading size="4xl">タイピングゲーム</Heading>
        <HStack>
          <Button onClick={go("number")}>1～10までの数字</Button>
          <Button onClick={go("number11")}>11～20までの数字</Button>
          <Button onClick={go("month")}>月の名前</Button>
          <Button onClick={go("week")}>曜日の名前</Button>
        </HStack>
      </Stack>
    </Container>
  );
}
