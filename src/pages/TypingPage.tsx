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
import { useLiveQuery } from "dexie-react-hooks";
import parse from "html-react-parser";
import { useEffect, useRef, useState } from "react";
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
import { STICKER_OPTIONS } from "@/data/stickers";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { toaster } from "@/lib/toaster";
import {
  addCalendarSticker,
  getCalendarStickers,
  markPointCompleted,
  markPointStudied,
} from "@/repositories/appStateRepository";
import type { QAPair, Settings } from "@/types/index";

/**
 * タイピングゲームのメインコンポーネント
 * @param QA 問題と回答のペア配列
 * @param title タイトル文字列
 * @param makingProblem 復習問題モードかどうか
 * @param pointId 現在のポイントID（進捗管理用）
 * @param sound 音声有効化フラグ（未使用）
 */
export default function Typing({
  QA,
  title,
  makingProblem,
  pointId,
}: {
  QA: QAPair[];
  title: string;
  makingProblem: boolean;
  pointId?: number;
  sound?: boolean;
}) {
  const battle = useBattle();
  const sort = useSort();
  const setPage = useSetPage();
  const practiceMode = usePracticeMode();

  // 設定の初期化と管理
  const [settings, setSettings] = useState<Settings>({
    durationSec: 60,
    sound: true,
    language: "ja",
    learningMode: !battle,
    learnThenRecall: practiceMode,
    orderMode: sort ? "sequential" : "random",
  });

  /**
   * battleモードが変更されたら学習モードを更新
   */
  useEffect(() => {
    setSettings((s) =>
      s.learningMode === !battle ? s : { ...s, learningMode: !battle },
    );
  }, [battle]);

  /**
   * sortモードが変更されたら出題順序を更新
   */
  useEffect(() => {
    setSettings((s) => {
      const ctxOrder = sort ? "sequential" : "random";
      return s.orderMode === ctxOrder ? s : { ...s, orderMode: ctxOrder };
    });
  }, [sort]);

  /**
   * 練習モードが変更されたら学習→リコールモードを更新
   */
  useEffect(() => {
    setSettings((s) =>
      s.learnThenRecall === practiceMode
        ? s
        : { ...s, learnThenRecall: practiceMode },
    );
  }, [practiceMode]);

  // タイピングエンジンの初期化
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
  const [selectedStickerId, setSelectedStickerId] = useState<string>();
  const [pendingStickerId, setPendingStickerId] = useState<string>();
  const [savingSticker, setSavingSticker] = useState(false);
  const resultHandledRef = useRef(false);
  const calendarStickers = useLiveQuery(
    () => getCalendarStickers(),
    [],
    {} as Record<
      string,
      { stickerId: string; earnedAt: number; mode: "test" }[]
    >,
  );

  /**
   * ゲーム開始ハンドラー
   * 問題が無い場合はトースト表示、ある場合はエンジンを開始
   */
  const handleStart = () => {
    setResultOpen(false);
    setSelectedStickerId(undefined);
    setPendingStickerId(undefined);
    setSavingSticker(false);
    resultHandledRef.current = false;
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

  const canPickSticker = !settings.learningMode && !makingProblem;
  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayDateLabel = `${today.getMonth() + 1}がつ ${today.getDate()}にち`;
  const todayStickerIds = (
    (calendarStickers?.[todayDateKey] ?? []) as {
      stickerId: string;
      earnedAt: number;
      mode: "test";
    }[]
  ).map((entry) => entry.stickerId);
  const previewStickerIds = selectedStickerId
    ? todayStickerIds
    : pendingStickerId
      ? [...todayStickerIds, pendingStickerId]
    : todayStickerIds;

  const handleStickerSelect = async (stickerId: string) => {
    if (!canPickSticker || selectedStickerId || savingSticker) return;

    setPendingStickerId(stickerId);
    setSavingSticker(true);
    try {
      const now = new Date();
      const dateKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await addCalendarSticker(dateKey, stickerId);
      setSelectedStickerId(stickerId);
      setPendingStickerId(undefined);
      toaster.create({
        title: "ステッカーを はりました",
        description: "カレンダーに きょうの きろくを のこしました。",
        type: "success",
        duration: 3000,
        closable: true,
      });
    } finally {
      setPendingStickerId(undefined);
      setSavingSticker(false);
    }
  };

  /**
   * セッション終了を検知して結果モーダルを表示
   * ★改善：完了条件を厳密にチェックして進捗を記録
   */
  useEffect(() => {
    if (
      engine.state.started &&
      engine.state.finished &&
      !resultHandledRef.current
    ) {
      resultHandledRef.current = true;
      const id = setTimeout(() => {
        setResultOpen(true);

        // 完了状態のマーク（復習問題でない場合のみ）
        if (pointId !== undefined && !makingProblem) {
          // ★改善：完全正解の判定
          // テストモード + 全問完了 + ミス0 + ヒント0 の場合のみ緑チェック
          const isPerfectCompletion =
            !settings.learningMode &&
            !engine.wasManuallyStoppedEarly &&
            engine.problemsWithMistake === 0 &&
            engine.problemsWithHint === 0;

          if (isPerfectCompletion) {
            // 完全正解 → 緑のチェックマーク
            markPointCompleted(pointId);
          } else {
            // それ以外（途中終了、ミス、ヒント使用）→ 黄色の学習済みマーク
            markPointStudied(pointId);
          }
        }
      }, 0);
      return () => clearTimeout(id);
    }
  }, [
    engine.state.started,
    engine.state.finished,
    engine.wasManuallyStoppedEarly, // ★追加：途中終了フラグを監視
    pointId,
    makingProblem,
    settings.learningMode,
    engine.problemsWithMistake,
    engine.problemsWithHint, // ★追加：ヒント使用数を監視
  ]);

  /**
   * 実際の経過時間を計算
   * @returns 経過秒数
   */
  const timeSecActual = (() => {
    if (!engine.state.startAt) return 0;
    const now = Date.now();
    const elapsed = Math.floor((now - engine.state.startAt) / 1000);
    return elapsed;
  })();

  return (
    <Container p="6" maxW="container.md">
      <Stack gap="6">
        {/* ヘッダー部分 */}
        <HStack justify="space-between">
          <Heading size="lg">タイピングゲーム ～{parse(title)}～</Heading>
          <HStack>
            <Button onClick={() => setPage(0)} variant="outline">
              もどる
            </Button>
            <Button onClick={settingsDisc.onOpen} variant="outline">
              せってい
            </Button>
            {!engine.state.started || engine.state.finished ? (
              <Button
                colorPalette="blue"
                onClick={handleStart}
                alignItems="end"
                paddingY="5px"
              >
                <ruby>
                  始<rt style={{ fontSize: "0.5em" }}>はじ</rt>
                </ruby>
                める
              </Button>
            ) : (
              <Button
                colorPalette="red"
                onClick={engine.stop}
                alignItems="end"
                paddingY="5px"
              >
                <ruby>
                  終<rt style={{ fontSize: "0.5em" }}>お</rt>
                </ruby>
                わる
              </Button>
            )}
          </HStack>
        </HStack>

        {/* モード表示バッジ */}
        <HStack h="25px">
          {settings.learningMode ? (
            <>
              <Badge
                paddingY="5px"
                colorPalette={
                  engine.state.learningPhase === "study" ? "blue" : "purple"
                }
                variant="solid"
                fontSize="lg"
                alignItems="end"
              >
                {engine.state.learningPhase === "study" ? (
                  <>
                    <ruby>
                      練習<rt style={{ fontSize: "0.5em" }}>れんしゅう</rt>
                    </ruby>
                    （スペル＋
                    <ruby>
                      音声<rt style={{ fontSize: "0.5em" }}>おんせい</rt>
                    </ruby>
                    ）
                  </>
                ) : (
                  <>
                    ふく
                    <ruby>
                      習<rt style={{ fontSize: "0.5em" }}>しゅう</rt>
                    </ruby>
                    （Tabキーでヒント。1
                    <ruby>
                      回目<rt style={{ fontSize: "0.5em" }}>かいめ</rt>
                    </ruby>
                    で
                    <ruby>
                      音声<rt style={{ fontSize: "0.5em" }}>おんせい</rt>
                    </ruby>
                    ・2
                    <ruby>
                      回目<rt style={{ fontSize: "0.5em" }}>かいめ</rt>
                    </ruby>
                    でスペル）
                  </>
                )}
              </Badge>
              <Text fontSize="lg" color="fg.muted">
                <ruby>
                  学習<rt style={{ fontSize: "0.5em" }}>がくしゅう</rt>
                </ruby>
                で
                <ruby>
                  正<rt style={{ fontSize: "0.5em" }}>せい</rt>
                </ruby>
                かい → ふく
                <ruby>
                  習<rt style={{ fontSize: "0.5em" }}>しゅう</rt>
                </ruby>
                へ。ふく
                <ruby>
                  習<rt style={{ fontSize: "0.5em" }}>しゅう</rt>
                </ruby>
                で
                <ruby>
                  正<rt style={{ fontSize: "0.5em" }}>せい</rt>
                </ruby>
                かいすると
                <ruby>
                  次<rt style={{ fontSize: "0.5em" }}>つぎ</rt>
                </ruby>
                の
                <ruby>
                  問題<rt style={{ fontSize: "0.5em" }}>もんだい</rt>
                </ruby>
                に
                <ruby>
                  進<rt style={{ fontSize: "0.5em" }}>すす</rt>
                </ruby>
                みます。
              </Text>
            </>
          ) : (
            <Badge
              colorPalette="orange"
              variant="solid"
              fontSize="md"
              paddingY="5px"
              alignItems="end"
            >
              テスト（Tabキーでヒント。1
              <ruby>
                回目<rt style={{ fontSize: "0.5em" }}>かいめ</rt>
              </ruby>
              で
              <ruby>
                音声<rt style={{ fontSize: "0.5em" }}>おんせい</rt>
              </ruby>
              ・2
              <ruby>
                回目<rt style={{ fontSize: "0.5em" }}>かいめ</rt>
              </ruby>
              でスペル）
            </Badge>
          )}
        </HStack>

        {/* 問題表示エリア */}
        <Box
          p="4"
          rounded="xl"
          borderWidth="1px"
          bg="bg.subtle"
          h="calc(100vh - 410px)"
          whiteSpace="pre-line"
        >
          <Grid
            templateColumns={"1fr calc(100vh - 432px)"}
            gap={4}
            alignItems="center"
          >
            <GridItem>
              <Text
                fontSize={
                  !engine.state.questionJa
                    ? "6xl"
                    : (() => {
                        const text = engine.state.questionJaPlain;
                        const lineCount = (text.match(/\n/g) || []).length + 1;
                        const charCount = text.length;

                        // 行数優先で判定
                        if (lineCount > 5) return "3xl";
                        if (lineCount > 3) return "4xl";
                        if (lineCount > 2) return "5xl";

                        // 行数が少ない場合は文字数で判定
                        if (charCount > 80) return "4xl";
                        if (charCount > 50) return "5xl";
                        return "6xl";
                      })()
                }
                lineHeight="1.3"
                wordBreak="break-word"
              >
                {engine.state.questionJa || (
                  <>
                    <ruby>
                      問題<rt style={{ fontSize: "0.5em" }}>もんだい</rt>
                    </ruby>
                    がここに
                    <ruby>
                      出<rt style={{ fontSize: "0.5em" }}>で</rt>
                    </ruby>
                    るよ
                  </>
                )}
              </Text>
            </GridItem>
            <GridItem>
              <Box w="calc(100vh - 432px)" h="calc(100vh - 432px)">
                <Center h="100%">
                  {engine.state.questionImg ? (
                    <Image
                      src={engine.state.questionImg}
                      alt="image"
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

        {/* 回答入力エリア */}
        <Box p="6" rounded="xl" borderWidth="1px" minH="140px">
          <AnswerInputView
            typed={engine.state.typed}
            correctMap={engine.state.correctMap}
            answer={engine.state.answerEn}
            showHint={engine.state.showHint}
          />
          <Text mt="3" fontSize="lg" color="fg.muted">
            ➡:{" "}
            <ruby>
              次<rt style={{ fontSize: "0.5em" }}>つぎ</rt>
            </ruby>
            のたん
            <ruby>
              語<rt style={{ fontSize: "0.5em" }}>ご</rt>
            </ruby>{" "}
            / エンターキー:{" "}
            <ruby>
              始<rt style={{ fontSize: "0.5em" }}>はじ</rt>
            </ruby>
            める、
            <ruby>
              終<rt style={{ fontSize: "0.5em" }}>お</rt>
            </ruby>
            わる / バックスペースキー: 1
            <ruby>
              文字<rt style={{ fontSize: "0.5em" }}>もじ</rt>
            </ruby>
            <ruby>
              消<rt style={{ fontSize: "0.5em" }}>け</rt>
            </ruby>
            す / タブキー: ヒント
          </Text>
        </Box>

        {/* キー入力キャプチャ */}
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
                handleStart();
                return;
              } else if (!engine.state.finished) {
                engine.stop();
                return;
              }
            }
            engine.onKey(ch);
          }}
        />
      </Stack>

      {/* 設定ドロワー */}
      <SettingsDrawerChakra
        open={settingsDisc.open}
        onClose={settingsDisc.onClose}
        settings={settings}
        onChange={setSettings}
        engine={engine}
      />

      {/* 結果モーダル */}
      <ResultsModalChakra
        open={resultOpen}
        setOpen={setResultOpen}
        onRetry={handleStart}
        stickerPicker={{
          enabled: canPickSticker,
          options: STICKER_OPTIONS,
          selectedStickerId,
          saving: savingSticker,
          previewDateLabel: todayDateLabel,
          previewStickers: previewStickerIds,
          onSelect: handleStickerSelect,
        }}
        summary={{
          timeSec: timeSecActual,
          hints: engine.problemsWithHint,
          errors: engine.problemsWithMistake,
        }}
      />
    </Container>
  );
}
