// src/lib/useSpeech.ts
import type { SpeakOpts } from "@/types/index";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReady, setIsReady] = useState(false); // voices 準備状態
  const readyRef = useRef(false);

  // voices 準備待ちの解放キュー
  const readyWaiters = useRef<Array<() => void>>([]);

  // 直近に再生要求されたテキストと時刻（短時間の二重発火を抑止）
  const lastSpeakRef = useRef<{ text: string; at: number }>({
    text: "",
    at: 0,
  });

  // 現在の Utterance を握っておき、イベントで状態解放
  const currentUtterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const load = () => {
      const v = speechSynthesis.getVoices();
      if (v && v.length) {
        setVoices(v);
        readyRef.current = true;
        setIsReady(true);
        // voices を待っている呼び出しを解放
        if (readyWaiters.current.length) {
          readyWaiters.current.forEach((resolve) => resolve());
          readyWaiters.current = [];
        }
      }
    };
    load();
    // Chrome系は非同期で voices が入る
    const handler = () => load();
    speechSynthesis.onvoiceschanged = handler;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    try {
      // 進行中の Utterance を明示的に破棄
      currentUtterRef.current = null;
      speechSynthesis.cancel();
    } catch {
      // no-op
    }
  }, []);

  // voices 準備完了を待つ（最長 ~1s で解放）
  const waitUntilReady = useCallback((): Promise<void> => {
    if (readyRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      readyWaiters.current.push(resolve);
      // 念のためのタイムアウト保険（1秒）
      setTimeout(() => resolve(), 1000);
    });
  }, []);

  // TTS ウォームアップ（無音の極短発話でエンジンを起動）
  const warmup = useCallback(async () => {
    try {
      await waitUntilReady();
      speechSynthesis.cancel(); // 前残りを掃除
      const u = new SpeechSynthesisUtterance(".");
      u.lang = "en-US";
      u.rate = 1;
      u.pitch = 1;
      u.volume = 0; // 無音
      speechSynthesis.speak(u);
      // すぐ cancel せず、onendに任せる方が安定
    } catch {
      // no-op
    }
  }, [waitUntilReady]);

  const speak = useCallback(
    (text: string, opts: SpeakOpts = {}) => {
      if (!text) return;

      const {
        lang = "en-US",
        rate = 1,
        pitch = 1,
        voiceHint = "en",
        dedupeMs = 500,
        noDedupe = false,
      } = opts;

      // --- デデュープ：同一テキストの短時間二重呼び出しを抑止 ---
      if (!noDedupe) {
        const now = Date.now();
        if (
          lastSpeakRef.current.text === text &&
          now - lastSpeakRef.current.at < dedupeMs
        ) {
          return; // 直前と同一なので捨てる
        }
        lastSpeakRef.current = { text, at: now };
      }

      // 既存キューをクリア（Safari/Chrome対策）
      stop();

      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;

      // 利用可能な voice を選択（なければ lang 前方一致で近いもの）
      const voice =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(lang)) ||
        voices.find((v) => v.lang.startsWith(voiceHint));
      if (voice) u.voice = voice;

      // 終了/エラー時に参照を解放
      u.onend = () => {
        if (currentUtterRef.current === u) currentUtterRef.current = null;
      };
      u.onerror = () => {
        if (currentUtterRef.current === u) currentUtterRef.current = null;
      };

      // voices がまだ届かないプラットフォーム対策：次フレーム発話
      setTimeout(
        () => {
          try {
            currentUtterRef.current = u;

            // 一部ブラウザで pause/resume しないと無音になることがあるため念のため
            if (speechSynthesis.paused) {
              try {
                speechSynthesis.resume();
              } catch {
                /* no-op */
              }
            }

            speechSynthesis.speak(u);
          } catch {
            // no-op
          }
        },
        readyRef.current ? 0 : 60
      );
    },
    [voices, stop]
  );

  // isReady, waitUntilReady, warmup を公開
  return { speak, stop, voices, isReady, waitUntilReady, warmup };
}
