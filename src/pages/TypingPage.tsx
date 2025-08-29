import App from "@/App";
import DamageMotion from "@/components/typing/BattleArea/DamageMotion";
import ResultsDialogChakra from "@/components/typing/ResultsDialog";
import SettingsDrawerChakra from "@/components/typing/SettingsDrawer";
import { useTypingEngine } from "@/hooks/typingEngine/useTypingEngine";
import { useBgm } from "@/hooks/typingPage/useBgm";
import { useRandomAssets } from "@/hooks/typingPage/useRandomAssets";
import type { Settings, TypingPageProps } from "@/types/index";
import { Container, Stack, useDisclosure } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";

import AnswerArea from "@/components/typing/AnswerArea/index";
import BattleArea from "@/components/typing/BattleArea/index";
import HeaderArea from "@/components/typing/HeaderArea";
import PhaseNotice from "@/components/typing/PhaseNoticeArea/PhaseNotice";
import PlayerHpBar from "@/components/typing/PhaseNoticeArea/PlayerHpBar";

export default function TypingPage({ QA, title, sound }: TypingPageProps) {
  const [settings, setSettings] = useState<Settings>({
    sound,
    language: "ja",
    learningMode: true,
    learnThenRecall: true,
    orderMode: "sequential",
  });

  // アニメトリガ
  const [slashId, setSlashId] = useState(0);
  const [hurtId, setHurtId] = useState(0);
  const [vanishId, setVanishId] = useState(0);
  const [vanished, setVanished] = useState(false);

  const damagePerHit = useMemo(() => 10, []);
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

  // 敵/背景
  const { enemyImg, backgroundImg } = useRandomAssets(engine.state.playCount);

  // BGM
  const { setShouldPlay } = useBgm({
    src: "./music/bgm/waitScreen.mp3",
    loop: true,
    volume: 0.4,
    enabled: settings.sound,
  });

  // モーダル/ページ
  const settingsDisc = useDisclosure();
  const [resultOpen, setResultOpen] = useState(false);
  const [page, setPage] = useState<"home" | "typing">("typing");

  // 終了検知
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

  // アリーナ ref（DamageMotion 用）
  const arenaRef = useRef<HTMLDivElement | null>(null);

  if (page === "home" || QA === undefined) {
    return <App played={false} sound={settings.sound} />;
  }

  return (
    <Container p="6" maxW="container.md">
      <Stack gap="6">
        <HeaderArea
          setPage={setPage}
          title={title}
          start={engine.start}
          stop={engine.stop}
          state={engine.state}
          setShouldPlay={setShouldPlay}
          settings={settings}
          onOpen={settingsDisc.onOpen}
        />
        <BattleArea
          ref={arenaRef}
          enemyImg={enemyImg}
          backgroundImg={backgroundImg}
          hurtId={hurtId}
          vanishId={vanishId}
          vanished={vanished}
          onVanishDone={() => setVanished(true)}
          slashId={slashId}
          questionText={
            engine.state.questionJa
              ? engine.state.questionJa
              : settings.learningMode
              ? "問題がここに出るよ"
              : "バトル開始"
          }
          questionImg={engine.state.questionImg}
          state={engine.state}
          enemyHpPct={enemyHpPct}
          arenaRef={arenaRef.current}
        >
          {/* Damage / Slash エフェクト */}
          <DamageMotion
            arenaRef={arenaRef.current}
            slashId={slashId}
            hurtId={hurtId}
          />
        </BattleArea>

        {settings.learningMode && (
          <PhaseNotice
            learningMode={settings.learningMode}
            learnThenRecall={settings.learnThenRecall}
            phase={engine.state.learningPhase as "study" | "recall" | undefined}
          />
        )}
        {!settings.learningMode && (
          <PlayerHpBar
            current={engine.state.playerHp}
            max={engine.state.playerMaxHp}
            pct={playerHpPct}
          />
        )}

        <AnswerArea
          typed={engine.state.typed}
          correctMap={engine.state.correctMap}
          answer={engine.state.answerEn}
          showHint={engine.state.showHint}
          state={engine.state}
          inputOnKey={engine.onKey}
          resultOpen={resultOpen}
        />
      </Stack>

      <SettingsDrawerChakra
        open={settingsDisc.open}
        onClose={settingsDisc.onClose}
        settings={settings}
        onChange={setSettings}
        engine={engine}
      />

      <ResultsDialogChakra
        open={resultOpen}
        setOpen={setResultOpen}
        onRetry={() => {
          setResultOpen(false);
          engine.start();
        }}
        setShouldBgmPlay={setShouldPlay}
        sound={settings.sound}
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
