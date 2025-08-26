import App from "@/App";
import AnswerInputView from "@/components/AnswerInputView";
import DamageMotion from "@/components/DamageMotion";
import InputCapture from "@/components/InputCapture";
import ResultsModalChakra from "@/components/ResultsDialogChakra";
import SettingsDrawerChakra from "@/components/SettingsDrawerChakra";
import { useTypingEngine } from "@/hooks/typingEngine/useTypingEngine";
import type { QAPair, Settings } from "@/types/index";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Typing({
  QA,
  title,
  sound,
}: {
  QA: QAPair[];
  title: string;
  sound: boolean;
}) {
  const [settings, setSettings] = useState<Settings>({
    sound: sound,
    language: "ja",
    learningMode: true,
    learnThenRecall: true,
    orderMode: "sequential",
  });

  // クリックごとに増やすと、key が変わってアニメがやり直される
  const [slashId, setSlashId] = useState(0);
  // ダメージ用の状態
  const [hurtId, setHurtId] = useState(0);
  // 一問正解で敵 -10
  const damagePerHit = useMemo(() => 10, []);
  // 消える（モンスターのフェードアウト）
  const [vanishId, setVanishId] = useState(0);
  const [vanished, setVanished] = useState(false);

  const engine = useTypingEngine(
    {
      sound: settings.sound,
      learningMode: settings.learningMode,
      learnThenRecall: settings.learnThenRecall,
      randomOrder: settings.orderMode === "random",
      battleMode: true,
      playerMaxHp: 100,
      enemyMaxHp: damagePerHit * QA.length,
      damagePerHit: 10,
      damagePerMiss: 5,
    },
    QA,
    setSlashId,
    setHurtId,
    setVanishId,
    setVanished
  );

  // 敵の画像
  const [ENEMY_IMG, setEnemyImg] = useState("");
  useEffect(() => {
    const EnemyList = ["slime", "goblin", "dragon"];
    const EMRandomNum = Math.floor(Math.random() * 3);
    setEnemyImg(`./images/monster/${EnemyList[EMRandomNum]}.png`);
  }, [engine.state.playCount]);
  // 背景の画像
  const [BACKGROUND_IMG, setBackgroundImg] = useState("");
  useEffect(() => {
    const BGRandomNum = Math.floor(Math.random() * 3);
    setBackgroundImg(`./images/background/${BGRandomNum}.png`);
  }, [engine.state.playCount]);

  const settingsDisc = useDisclosure();
  const [resultOpen, setResultOpen] = useState(false);
  const [page, setPage] = useState<"home" | "typing">("typing");
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // 終了を検知して開く（Enterに依存しない）
  useEffect(() => {
    if (engine.state.started && engine.state.finished) {
      if (engine.state.enemyHp === 0) {
        setVanishId((n) => n + 1);
      }
      const id = setTimeout(() => setResultOpen(true), 0);
      return () => clearTimeout(id);
    }
  }, [engine.state.started, engine.state.finished, engine.state.enemyHp]);

  // HP率（0〜100）
  const enemyHpPct = useMemo(
    () => Math.round((engine.state.enemyHp / engine.state.enemyMaxHp) * 100),
    [engine.state.enemyHp, engine.state.enemyMaxHp]
  );
  const playerHpPct = useMemo(
    () => Math.round((engine.state.playerHp / engine.state.playerMaxHp) * 100),
    [engine.state.playerHp, engine.state.playerMaxHp]
  );
  const MonsterLayer = (
    <>
      <Image
        src={BACKGROUND_IMG}
        alt="Background"
        fit="cover"
        w="100%"
        h="100%"
      />
      {!vanished && (
        <motion.img
          key={`monster-${vanishId}`}
          src={ENEMY_IMG}
          alt="Enemy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          initial={{ opacity: 1, scale: 1, x: 0 }}
          animate={{
            opacity: vanishId > 0 ? [1, 1, 0] : 1,
            x:
              vanishId > 0
                ? [0, -20, 20, -18, 18, -15, 15, -10, 10, -5, 5, 0]
                : 0,
            scale: vanishId > 0 ? 0.95 : 1, // 少し縮むとやられ感が出る
          }}
          transition={{
            opacity: { duration: 1.2, ease: "easeOut", times: [0, 0.6, 1] },
            x: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 1.2, ease: "easeOut" },
          }}
          onAnimationComplete={() => {
            if (vanishId > 0) setVanished(true);
          }}
        />
      )}
    </>
  );

  if (page === "home" || QA === undefined) {
    return <App played={false} sound={settings.sound} />;
  }

  return (
    <Container p="6" maxW="container.md">
      <Stack gap="6">
        <HStack justify="space-between" h="40px">
          <Heading size="lg">タイピングゲーム ～{title}～</Heading>
          <HStack>
            <Button onClick={() => setPage("home")} variant="outline">
              もどる
            </Button>
            <Button onClick={settingsDisc.onOpen} variant="outline">
              せってい
            </Button>
            {!engine.state.started || engine.state.finished ? (
              <Button colorPalette="blue" onClick={engine.start}>
                {settings.learningMode ? "始める" : "バトル"}
              </Button>
            ) : (
              <Button colorPalette="red" onClick={() => engine.stop("escape")}>
                {settings.learningMode ? "終わる" : "にげる"}
              </Button>
            )}
          </HStack>
        </HStack>

        {/* 敵エリア */}
        <Box
          rounded="xl"
          borderWidth="1px"
          p="4"
          bg="bg.subtle"
          h="calc(100vh - 293px)"
        >
          <HStack gap="4" h="calc(100vh - 367px)" mb="16px">
            {/* 大きな敵スプライト（固定画像） */}
            <Box
              ref={arenaRef}
              mx="auto"
              w="100%"
              h="calc(100vh - 367px)"
              rounded="2xl"
              borderWidth="1px"
              overflow="hidden"
              bg="blackAlpha.50"
              position="relative"
            >
              {/* 敵エリア全体を横揺れさせるラッパー */}
              <AnimatePresence>
                {hurtId > 0 ? (
                  <motion.div
                    key={`shake-${hurtId}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    }}
                    initial={{ x: 0 }}
                    animate={{ x: [0, -14, 14, -10, 10, -6, 6, 0] }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    exit={{ x: 0 }}
                  >
                    {MonsterLayer}
                  </motion.div>
                ) : (
                  <Box w="100%" h="100%" position="relative">
                    {MonsterLayer}
                  </Box>
                )}
              </AnimatePresence>
              {/* 斬撃エフェクト（クリックで再生） */}
              <DamageMotion
                arenaRef={arenaRef!.current}
                slashId={slashId}
                hurtId={hurtId}
              />
            </Box>
            <Box w="450px">
              {/* 敵のセリフ（日本語） */}
              <Box rounded="lg" borderWidth="1px" p="3" bg="gray.subtle">
                <Text fontSize={{ base: "lg", md: "xl" }} color="fg">
                  {engine.state.questionJa
                    ? engine.state.questionJa
                    : settings.learningMode
                    ? "問題がここに出るよ"
                    : "バトル開始"}
                </Text>
              </Box>

              {/* QAの画像（ヒント用）。セリフの下に表示 */}
              <Box mt="16px">
                <AspectRatio ratio={1 / 1} w="200px" mx="auto">
                  {engine.state.questionImg ? (
                    <Image
                      src={engine.state.questionImg}
                      alt={engine.state.questionJa || "question image"}
                      objectFit="contain"
                      rounded="lg"
                      borderWidth="1px"
                      bg="white"
                      p="2"
                    />
                  ) : (
                    <Skeleton rounded="lg" />
                  )}
                </AspectRatio>
              </Box>
            </Box>
          </HStack>
          {/* 敵HPバー（大きめ） */}
          <HStack gap="3" align="center">
            <Badge colorPalette="purple" variant="solid">
              てきのHP
            </Badge>
            <Box
              flex="1"
              h="18px"
              rounded="full"
              bg="blackAlpha.200"
              overflow="hidden"
            >
              <Box h="full" w={`${enemyHpPct}%`} bg="purple.500" />
            </Box>
            <Text w="96px" textAlign="right">
              {engine.state.enemyHp}/{engine.state.enemyMaxHp}
            </Text>
          </HStack>
        </Box>

        {/* 学習モードの段階表示（任意） */}
        {settings.learningMode ? (
          settings.learnThenRecall ? (
            <HStack h="24px">
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
                学習で正かい → ふく習へ ふく習で正かいすると次の問題に進みます。
              </Text>
            </HStack>
          ) : (
            <HStack h="24px">
              <Badge colorPalette="blue" variant="solid">
                練習（スペル＋音声）
              </Badge>
              <Text fontSize="sm" color="fg.muted">
                学習で正かい → 次の問題に進みます。
              </Text>
            </HStack>
          )
        ) : null}

        {/* 入力ビュー（英語で回答） */}
        <Box p="4" rounded="xl" borderWidth="1px" bg="bg.panel" h="109px">
          <AnswerInputView
            typed={engine.state.typed}
            correctMap={engine.state.correctMap}
            answer={engine.state.answerEn}
            showHint={engine.state.showHint}
          />
          <Text mt="2" fontSize="sm" color="fg.muted">
            スペースキー: 次のたん語 / エンターキー: とじる /
            バックスペースキー: 1文字消す / タブキー: ヒント
          </Text>
        </Box>

        {/* 自分HPバー */}
        {!settings.learningMode && (
          <HStack gap="3" align="center" h="24px">
            <Badge colorPalette="blue" variant="solid">
              あなたのHP
            </Badge>
            <Box
              flex="1"
              h="18px"
              rounded="full"
              bg="blackAlpha.200"
              overflow="hidden"
            >
              <Box h="full" w={`${playerHpPct}%`} bg="blue.500" />
            </Box>
            <Text w="96px" textAlign="right">
              {engine.state.playerHp}/{engine.state.playerMaxHp}
            </Text>
          </HStack>
        )}

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
        // エンジンを渡して Drawer 側から study/recall を手動切替可能に
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
          timeSec: engine.actualTimeSec,
          usedHintCount: engine.state.usedHintCount,
          mistakeProblemCount: engine.state.mistakeProblemCount,
          learningMode: settings.learningMode,
        }}
      />
    </Container>
  );
}
