import QA_MONTH from "@/lib/texts/qa_month";
import QA_NUMBER from "@/lib/texts/qa_number";
import QA_TEST from "@/lib/texts/qa_test";
import { Button, Container, Heading, HStack, Stack } from "@chakra-ui/react";
import { useState } from "react";
import Typing from "./pages/typing";

export default function App() {
  const [page, setPage] = useState<"home" | "test" | "number" | "month">(
    "home"
  );
  switch (page) {
    case "test":
      return <Typing QA={QA_TEST} title="Test問題" />;
    case "number":
      return <Typing QA={QA_NUMBER} title="1～10までの数字" />;
    case "month":
      return <Typing QA={QA_MONTH} title="月の名前" />;
  }
  return (
    <Container p="6" maxW="container.md">
      <Stack justify="space-between" gap="6">
        <Heading size="4xl">タイピングゲーム</Heading>
        <HStack>
          <Button onClick={() => setPage("number")}>1～10までの数字</Button>
          <Button onClick={() => setPage("month")}>月の名前</Button>
        </HStack>
      </Stack>
    </Container>
  );
}
