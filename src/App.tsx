import QA from "@/lib/texts/qa_test";
import { Button, Container, Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import Typing from "./pages/typing";

export default function App() {
  const [page, setPage] = useState<"home" | "typing">("home");
  if (page === "typing") {
    return <Typing QA={QA} title="Test問題" />;
  }
  return (
    <Container p="6" maxW="container.md">
      <Stack justify="space-between" gap="6">
        <Heading size="4xl">タイピングゲーム</Heading>
        <Button onClick={() => setPage("typing")} w="100px">
          Test問題
        </Button>
      </Stack>
    </Container>
  );
}
