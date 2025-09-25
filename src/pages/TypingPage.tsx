import {
  Badge,
  Box,
  Button,
  Center,
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
import AnswerInputView from "@/components/AnswerInputView";
import InputCapture from "@/components/InputCapture";
import ResultsModalChakra from "@/components/ResultsDialogChakra";
import SettingsDrawerChakra from "@/components/SettingsDrawerChakra";
import {
  useBattle,
  usePracticeMode,
  useSetPage,
  useSort,
} from "@/contexts/PageContext";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { toaster } from "@/lib/toaster";
import type { QAPair, Settings } from "@/types/index";

export default function Typing({
  QA,
  title,
  makingProblem,
}: {
  QA: QAPair[];
  title: string;
  makingProblem: boolean;
  sound?: boolean;
}) {
  const battle = useBattle();
  const sort = useSort();
  const setPage = useSetPage();
  const practiceMode = usePracticeMode();
  const [settings, setSettings] = useState<Settings>({
    durationSec: 60,
    sound: true,
    language: "ja",
    learningMode: !battle, // study が既定 → true
    learnThenRecall: practiceMode, // true が既定
    orderMode: sort ? "sequential" : "random", // ★Context 準拠
  });

  useEffect(() => {
    setSettings((s) =>
      s.learningMode === !battle ? s : { ...s, learningMode: !battle },
    );
  }, [battle]);

  // sort（=順序モード）変更に合わせて orderMode 同期（新規）
  useEffect(() => {
    setSettings((s) => {
      const ctxOrder = sort ? "sequential" : "random";
      return s.orderMode === ctxOrder ? s : { ...s, orderMode: ctxOrder };
    });
  }, [sort]);

  useEffect(() => {
    setSettings((s) =>
      s.learnThenRecall === practiceMode
        ? s
        : { ...s, learnThenRecall: practiceMode },
    );
  }, [practiceMode]);

  const engine = useTypingEngine(
    {
      durationSec: settings.durationSec,
      learningMode: settings.learningMode,
      learnThenRecall: settings.learnThenRecall,
      randomOrder: settings.orderMode === "random",
    },
    QA,
    makingProblem,
  );

  const settingsDisc = useDisclosure();
  const [resultOpen, setResultOpen] = useState(false);

  const handleStart = () => {
    setResultOpen(false);
    if (QA.length === 0) {
      toaster.create({
        title: "まちがえた問題がありません",
        description: "すべてふくしゅうできたよ。",
        type: "success",
        duration: 4000,
        closable: true,
      });
    } else {
      engine.start();
    }
  };

  // 終了を検知して開く（Enterに依存しない）
  useEffect(() => {
    if (engine.state.started && engine.state.finished) {
      const id = setTimeout(() => setResultOpen(true), 0);
      return () => clearTimeout(id);
    }
  }, [engine.state.started, engine.state.finished]);
  const timeSecActual = (() => {
    // startAt が無ければ念のため fallback
    if (!engine.state.startAt) return 0;
    // 学習モードは timeLeftSec が固定なので、startAt からの実時間で計測
    const now = Date.now();
    const elapsed = Math.floor((now - engine.state.startAt) / 1000);
    return elapsed;
  })();

  return (
    <Container p="6" maxW="container.md">
      <Stack gap="6">
        <HStack justify="space-between">
          <Heading size="lg">タイピングゲーム ～{title}～</Heading>
          <HStack>
            <Button onClick={() => setPage(0)} variant="outline">
              もどる
            </Button>
            <Button onClick={settingsDisc.onOpen} variant="outline">
              せってい
            </Button>
            {!engine.state.started || engine.state.finished ? (
              <Button colorPalette="blue" onClick={handleStart}>
                始める
              </Button>
            ) : (
              <Button colorPalette="red" onClick={engine.stop}>
                終わる
              </Button>
            )}
          </HStack>
        </HStack>

        {/* 学習モードの段階表示（任意） */}
        <HStack h="25px">
          {settings.learningMode ? (
            <>
              <Badge
                colorPalette={
                  engine.state.learningPhase === "study" ? "blue" : "purple"
                }
                variant="solid"
              >
                {engine.state.learningPhase === "study"
                  ? "練習（スペル＋音声）"
                  : "ふく習（Tabキーでヒント。1回目で音声・2回目でスペル）"}
              </Badge>
              <Text fontSize="sm" color="fg.muted">
                学習で正かい →
                ふく習へ。ふく習で正かいすると次の問題に進みます。
              </Text>
            </>
          ) : (
            <Badge colorPalette="orange" variant="solid">
              テスト（Tabキーでヒント。1回目で音声・2回目でスペル）
            </Badge>
          )}
        </HStack>

        {/* 日本語の問題文 */}
        <Box
          p="4"
          rounded="xl"
          borderWidth="1px"
          bg="bg.subtle"
          h="calc(100vh - 398px)"
        >
          <Grid
            templateColumns={"1fr calc(100vh - 432px)"}
            gap={4}
            alignItems="center"
          >
            <GridItem>
              <Text fontSize="6xl">
                {engine.state.questionJa || "問題がここに出るよ"}
              </Text>
            </GridItem>
            <GridItem>
              <Box w="calc(100vh - 432px)" h="calc(100vh - 432px)">
                <Center h="100%">
                  {engine.state.questionImg ? (
                    <Image
                      src={engine.state.questionImg}
                      alt={engine.state.questionJa}
                      fit="contain"
                      rounded="lg"
                      borderWidth="1px"
                      maxW="300px"
                      maxH="300px"
                      m="auto"
                    />
                  ) : (
                    <Skeleton rounded="lg" />
                  )}
                </Center>
              </Box>
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
            スペースキー: 次のたん語 / エンターキー: 始める、終わる /
            バックスペースキー: 1文字消す / タブキー: ヒント
          </Text>
        </Box>

        {/* 入力キャプチャ（ダイアログ表示中は無効） */}
        <InputCapture
          enabled={!engine.state.finished && !resultOpen && !settingsDisc.open}
          onKey={(ch, e) => {
            if (ch === "\t" || ch === " " || ch === "\b") {
              e.preventDefault();
              e.stopPropagation();
            }
            if (ch === "\n") {
              e.preventDefault();
              if (!engine.state.started) {
                engine.start();
                return;
              } else if (!engine.state.finished) {
                engine.stop();
                return;
              }
            }
            engine.onKey(ch); // Tab/Space/Backspace/通常文字 すべてここで処理
          }}
        />
      </Stack>

      <SettingsDrawerChakra
        open={settingsDisc.open}
        onClose={settingsDisc.onClose}
        settings={settings}
        onChange={setSettings}
        // エンジンを渡して Drawer 側から study/recall を手動切替可能に
        engine={engine}
      />

      <ResultsModalChakra
        open={resultOpen}
        setOpen={setResultOpen}
        onRetry={handleStart}
        summary={{
          timeSec: timeSecActual,
          hints: engine.problemsWithHint,
          errors: engine.problemsWithMistake,
        }}
      />
    </Container>
  );
}
