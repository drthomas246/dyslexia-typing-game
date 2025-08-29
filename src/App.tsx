import { Box } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ClickPoint } from "@/components/map/ClickPoint";
import { MapCanvas } from "@/components/map/MapCanvas";
import { ConsentDialog } from "@/components/ui/ConsentDialog";
import { SlideOverlay } from "@/components/visuals/SlideOverlay";
import { TitleOverlay } from "@/components/visuals/TitleOverlay";

import { points as pointsData } from "@/data/points";
import { useBgm } from "@/hooks/useBgm";
import { useHowlerOneShot } from "@/hooks/useHowlerOneShot";
import { useSequence } from "@/hooks/useSequence";
import { useSpeech } from "@/hooks/useSpeech";

import QA_MONTH from "@/data/texts/qa_month";
import QA_NUMBER from "@/data/texts/qa_number";
import QA_NUMBER11 from "@/data/texts/qa_number11";
import QA_WEEK from "@/data/texts/qa_week";
import Typing from "@/pages/TypingPage";
import type { AppProps, MapPoint } from "@/types/index";
import { Howler } from "howler";

function resumeHowlerContextIfNeeded() {
  const h = Howler as unknown as { ctx?: AudioContext };
  const ctx = h.ctx;
  if (ctx && ctx.state === "suspended") {
    return ctx.resume();
  }
  return Promise.resolve();
}

export default function App({ played = true, sound = undefined }: AppProps) {
  // ページ状態
  const [page, setPage] = useState<number>(0);

  // 初回演出・BGM状態
  const [firstPlayed, setFirstPlayed] = useState<boolean>(played);
  const [isBgmOn, setIsBgmOn] = useState<boolean | undefined>(sound);
  const [consentOpen, setConsentOpen] = useState<boolean>(firstPlayed);

  // BGM（シングルトン管理・冪等API）
  const { ensurePlaying, fadeOutStop } = useBgm(
    "./music/bgm/mainTheme.mp3",
    0.4 // ← 基準音量（初回も再訪もこの音量に収束）
  );

  // 任意：ユーザー設定で基準音量を変えたい場合にどこかで呼ぶ
  // setTargetVolume(0.4);

  // 効果音
  const { play: playSe } = useHowlerOneShot(
    "./music/soundEffects/screenTransition.mp3",
    1.0
  );

  // タイトル→4枚スライドの演出シーケンス
  const seq = useSequence({
    firstPlayed,
    titleSrc: "./images/title/title.png",
    onFinishFirst: () => setFirstPlayed(false),
  });

  // TTS
  const { warmup, waitUntilReady } = useSpeech();

  // ブラウザ自動再生制限の解除（初回のPointerでAudioContextをresume）
  useEffect(() => {
    const onPointer = () => {
      resumeHowlerContextIfNeeded();
      window.removeEventListener("pointerdown", onPointer);
    };
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  // isBgmOn の変化でのみ BGM を制御（冪等）
  useEffect(() => {
    if (isBgmOn) ensurePlaying(800);
    else fadeOutStop(500);
  }, [isBgmOn, ensurePlaying, fadeOutStop]);

  // ホームに戻ってきた瞬間に確実に鳴らしたい場合（再生中なら何もしない）
  useEffect(() => {
    if (page === 0 && isBgmOn) ensurePlaying(0);
  }, [page, isBgmOn, ensurePlaying]);

  // 同意ダイアログ
  const handleConsentYes = useCallback(() => {
    setConsentOpen(false);
    setIsBgmOn(true);
    ensurePlaying(800);
    seq.start();
  }, [ensurePlaying, seq]);

  const handleConsentNo = useCallback(() => {
    setConsentOpen(false);
    setIsBgmOn(false);
    seq.start();
  }, [seq]);

  // クリックポイント選択時
  const onSelectPoint = useCallback(
    async (id: number) => {
      if (isBgmOn) {
        fadeOutStop(500); // 画面遷移時にBGMを下げる
        playSe();
      }
      await waitUntilReady();
      await warmup();
      setPage(id);
    },
    [isBgmOn, fadeOutStop, playSe, waitUntilReady, warmup]
  );

  // map用ポイント
  const points: MapPoint[] = useMemo(() => pointsData, []);

  // ページ分岐
  switch (page) {
    case 1:
      return <Typing QA={QA_NUMBER} title="1～10までの数字" sound={isBgmOn} />;
    case 2:
      return (
        <Typing QA={QA_NUMBER11} title="11～20までの数字" sound={isBgmOn} />
      );
    case 3:
      return <Typing QA={QA_MONTH} title="月の名前" sound={isBgmOn} />;
    case 4:
      return <Typing QA={QA_WEEK} title="曜日の名前" sound={isBgmOn} />;
    default:
      // ホーム（タイトル・オーバーレイ・地図）
      return (
        <Box pos="relative" w="100vw" h="100vh" bg="black">
          {firstPlayed && (
            <ConsentDialog
              open={consentOpen}
              onOpenChange={setConsentOpen}
              onYes={handleConsentYes}
              onNo={handleConsentNo}
            />
          )}

          <MapCanvas imgSrc="./images/map.png">
            {points.map((p) => (
              <ClickPoint
                key={p.id}
                point={p}
                onClick={() => onSelectPoint(p.id)}
              />
            ))}
          </MapCanvas>
          {firstPlayed && (
            <>
              <TitleOverlay
                src="./images/title/title.png"
                visible={seq.title.visible}
                animateCtrl={seq.title.ctrl}
              />
              <SlideOverlay
                side="top"
                src="./images/title/top.png"
                visible={seq.top.visible}
                animateCtrl={seq.top.ctrl}
              />
              <SlideOverlay
                side="bottom"
                src="./images/title/bottom.png"
                visible={seq.bottom.visible}
                animateCtrl={seq.bottom.ctrl}
              />
              <SlideOverlay
                side="right"
                src="./images/title/right.png"
                visible={seq.right.visible}
                animateCtrl={seq.right.ctrl}
              />
              <SlideOverlay
                side="left"
                src="./images/title/left.png"
                visible={seq.left.visible}
                animateCtrl={seq.left.ctrl}
              />
            </>
          )}
        </Box>
      );
  }
}
