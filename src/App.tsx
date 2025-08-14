import AnswerInputView from "@/components/AnswerInputView";
import HUDChakra from "@/components/HUDChakra";
import InputCapture from "@/components/InputCapture";
import ResultsModalChakra from "@/components/ResultsDialogChakra";
import SettingsDrawerChakra from "@/components/SettingsDrawerChakra";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import type { Settings } from "@/types/index";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    durationSec: 60,
    sound: true,
    language: "ja",
    learningMode: false,
    // ★追加：学習→リコール（二段階）
    learnThenRecall: false,
  });

  const engine = useTypingEngine({
    durationSec: settings.durationSec,
    learningMode: settings.learningMode,
    // ★追加：二段階学習フローをエンジンへ
    learnThenRecall: settings.learnThenRecall,
  });

  const settingsDisc = useDisclosure();
  const [resultOpen, setResultOpen] = useState(false);

  // 終了を検知して開く（Enterに依存しない）
  useEffect(() => {
    if (engine.state.started && engine.state.finished) {
      const id = setTimeout(() => setResultOpen(true), 0);
      return () => clearTimeout(id);
    }
  }, [engine.state.started, engine.state.finished]);
  const timeSecActual = (() => {
    // startAt が無ければ念のため fallback
    if (!engine.state.startAt) return settings.durationSec;

    if (settings.learningMode) {
      // 学習モードは timeLeftSec が固定なので、startAt からの実時間で計測
      const now = Date.now();
      const elapsed = Math.floor((now - engine.state.startAt) / 1000);
      return Math.max(0, elapsed);
    } else {
      // 通常モードは timeLeftSec が減るので差分でOK
      const elapsed = settings.durationSec - engine.timeLeftSec;
      return Math.max(0, elapsed);
    }
  })();
  return (
    <Container p="6" maxW="container.md">
      <Stack gap="6">
        <HStack justify="space-between">
          <Heading size="lg">タイピングゲーム</Heading>
          <HStack>
            <Button onClick={settingsDisc.onOpen} variant="outline">
              せってい
            </Button>
            {!engine.state.started || engine.state.finished ? (
              <Button colorPalette="blue" onClick={engine.start}>
                はじめる
              </Button>
            ) : (
              <Button colorPalette="red" onClick={engine.stop}>
                おわる
              </Button>
            )}
          </HStack>
        </HStack>

        <HUDChakra
          wpm={engine.wpm}
          accuracy={engine.accuracy}
          timeLeftSec={engine.timeLeftSec}
          combo={engine.state.combo}
        />

        {/* 学習モードの段階表示（任意） */}
        {settings.learningMode &&
          settings.learnThenRecall &&
          engine.state.started &&
          !engine.state.finished && (
            <HStack>
              <Badge
                colorPalette={
                  engine.state.learningPhase === "study" ? "blue" : "purple"
                }
                variant="solid"
              >
                {engine.state.learningPhase === "study"
                  ? "れんしゅう（スペル＋音声）"
                  : "ふくしゅう（Tabキーでヒント。1回目で音声・2回目でスペル）"}
              </Badge>
              <Text fontSize="sm" color="fg.muted">
                学習で正解 →
                リコールへ。リコールで正解すると次の問題に進みます。
              </Text>
            </HStack>
          )}

        {/* 日本語の問題文 */}
        <Box p="4" rounded="xl" borderWidth="1px" bg="bg.subtle">
          <Grid
            templateColumns={{ base: "1fr", md: "1.2fr 1fr" }}
            gap={4}
            alignItems="center"
          >
            <GridItem>
              <Text fontSize={{ base: "md", md: "lg" }}>
                {engine.state.questionJa || "もんだいを ひょうじするよ"}
              </Text>
            </GridItem>
            <GridItem>
              <AspectRatio ratio={1 / 1} maxW="200px">
                {engine.state.questionImg ? (
                  <Image
                    src={engine.state.questionImg}
                    alt={engine.state.questionJa}
                    objectFit="contain"
                    rounded="lg"
                    borderWidth="1px"
                  />
                ) : (
                  <Skeleton rounded="lg" />
                )}
              </AspectRatio>
            </GridItem>
          </Grid>
        </Box>

        {/* 入力文字の色分け表示 */}
        <Box p="6" rounded="xl" borderWidth="1px" minH="140px">
          <AnswerInputView
            typed={engine.state.typed}
            correctMap={engine.state.correctMap}
            answer={engine.state.answerEn}
            showHint={engine.state.showHint}
          />
          <Text mt="3" fontSize="sm" color="fg.muted">
            スペースキー: 次の単語 / エンターキー: とじる / バックスペースキー:
            1文字けす / タブキー: ヒント (通常モードのみ)
          </Text>
        </Box>

        {/* 入力キャプチャ（ダイアログ表示中は無効） */}
        <InputCapture
          onKey={(ch, e) => {
            if (ch === "\n" && engine.state.started && !engine.state.finished) {
              e.preventDefault();
              engine.stop();
              return;
            }
            engine.onKey(ch); // Tab/Space/Backspace/通常文字 すべてここで処理
          }}
          enabled={
            engine.state.started && !engine.state.finished && !resultOpen
          }
        />
      </Stack>

      <SettingsDrawerChakra
        open={settingsDisc.open}
        onClose={settingsDisc.onClose}
        settings={settings}
        onChange={setSettings}
        // ★追加：エンジンを渡して Drawer 側から study/recall を手動切替可能に
        engine={engine}
      />

      <ResultsModalChakra
        open={resultOpen}
        setOpen={setResultOpen}
        onRetry={() => {
          setResultOpen(false);
          engine.start();
        }}
        summary={{
          wpm: engine.wpm,
          accuracy: engine.accuracy,
          timeSec: timeSecActual,
          errors: engine.state.errors,
        }}
      />
    </Container>
  );
}
