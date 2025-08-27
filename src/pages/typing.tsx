// src/pages/typing.tsx
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
import { Howl } from "howler";
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
  const [hurtId, setHurtId] = useState(0);
  const damagePerHit = useMemo(() => 10, []);
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

  // 敵画像
  const [ENEMY_IMG, setEnemyImg] = useState("");
  useEffect(() => {
    const EnemyList = ["slime", "goblin", "dragon"];
    const EMRandomNum = Math.floor(Math.random() * 3);
    setEnemyImg(`./images/monster/${EnemyList[EMRandomNum]}.png`);
  }, [engine.state.playCount]);

  // 背景画像
  const [BACKGROUND_IMG, setBackgroundImg] = useState("");
  useEffect(() => {
    const BGRandomNum = Math.floor(Math.random() * 3);
    setBackgroundImg(`./images/background/${BGRandomNum}.png`);
  }, [engine.state.playCount]);

  const settingsDisc = useDisclosure();
  const [resultOpen, setResultOpen] = useState(false);
  const [page, setPage] = useState<"home" | "typing">("typing");
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // ====== BGM 管理（状態で一元制御） ======
  const [shouldBgmPlay, setShouldBgmPlay] = useState(sound);
  const bgmRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (settings.sound) {
      setShouldBgmPlay(true);
    } else {
      setShouldBgmPlay(false);
    }
  }, [settings.sound]);
  // 「待機中に鳴らすべきか？」の真理値を一本化
  useEffect(() => {
    console.log("shouldBgmPlay", shouldBgmPlay);
    if (shouldBgmPlay) {
      // 既に生成済みで再生中なら何もしない
      if (bgmRef.current && bgmRef.current.playing()) return;

      // 未生成 or 停止済みなら作って再生
      if (!bgmRef.current) {
        bgmRef.current = new Howl({
          src: ["./music/bgm/waitScreen.mp3"],
          loop: true,
          volume: 0.4,
          html5: true,
        });
      }
      try {
        if (!bgmRef.current.playing()) {
          bgmRef.current.play();
        }
      } catch {
        /* ignore */
      }
    } else {
      // 待機条件を満たさない場合は止める
      if (bgmRef.current) {
        try {
          bgmRef.current.stop();
          bgmRef.current.unload();
        } catch {
          /* ignore */
        }
        bgmRef.current = null;
      }
    }
    // アンマウントでも確実に停止
    return () => {
      // ここでは何もしない（上の分岐で都度クリーンにする）
    };
  }, [shouldBgmPlay]);
  // ====== /BGM 管理 ======

  // 終了検知（結果ダイアログを開く）
  useEffect(() => {
    if (engine.state.started && engine.state.finished) {
      if (engine.state.enemyHp === 0) {
        setVanishId((n) => n + 1);
      }
      const id = setTimeout(() => setResultOpen(true), 0);
      return () => clearTimeout(id);
    }
  }, [engine.state.started, engine.state.finished, engine.state.enemyHp]);

  // HP率
  const enemyHpPct = useMemo(
    () => Math.round((engine.state.enemyHp / engine.state.enemyMaxHp) * 100),
    [engine.state.enemyHp, engine.state.enemyMaxHp]
  );
  const playerHpPct = useMemo(
    () => Math.round((engine.state.playerHp / engine.state.playerMaxHp) * 100),
    [engine.state.playerHp, engine.state.playerMaxHp]
  );

  // Start（青ボタン）…即時ミュートしてから開始（重なり防止）
  const handleStart = () => {
    setShouldBgmPlay(false);
    engine.start();
  };

  // Escape（赤ボタン）…停止だけ。再生は shouldBgmPlay の変化で自動
  const handleEscape = () => {
    engine.stop("escape");
    // ※ここで play を呼ばない。shouldBgmPlay が true に変われば自動再生される
  };

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
            scale: vanishId > 0 ? 0.95 : 1,
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
              <Button colorPalette="blue" onClick={handleStart}>
                {settings.learningMode ? "始める" : "バトル"}
              </Button>
            ) : (
              <Button colorPalette="red" onClick={handleEscape}>
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
              <DamageMotion
                arenaRef={arenaRef!.current}
                slashId={slashId}
                hurtId={hurtId}
              />
            </Box>
            <Box w="450px">
              <Box rounded="lg" borderWidth="1px" p="3" bg="gray.subtle">
                <Text fontSize={{ base: "lg", md: "xl" }} color="fg">
                  {engine.state.questionJa
                    ? engine.state.questionJa
                    : settings.learningMode
                    ? "問題がここに出るよ"
                    : "バトル開始"}
                </Text>
              </Box>

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

        {/* 学習モードの段階表示 */}
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

        <InputCapture
          onKey={(ch, e) => {
            if (ch === "\n" && engine.state.started && !engine.state.finished) {
              e.preventDefault();
              engine.stop();
              return;
            }
            engine.onKey(ch);
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
        engine={engine}
      />

      <ResultsModalChakra
        open={resultOpen}
        setOpen={setResultOpen}
        onRetry={() => {
          setResultOpen(false);
          engine.start();
        }}
        setShouldBgmPlay={setShouldBgmPlay}
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
