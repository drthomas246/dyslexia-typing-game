// src/hooks/engine/useSpeechOnce.ts
import { useSpeech } from "@/hooks/useSpeech";
import type { EngineOptions, EngineState } from "@/types/index";
import { useEffect, useRef } from "react";

export function useSpeechOnce(params: {
  state: EngineState;
  opts: EngineOptions;
  lang?: string;
}) {
  const { state, opts, lang = "en-US" } = params;
  const { speak } = useSpeech();
  const spokenRef = useRef<string>("");

  useEffect(() => {
    if (!state.started || state.finished) return;
    if (!opts.learningMode) return;
    if (!state.answerEn) return;
    if (state.learningPhase !== "study") return;

    const key = `${state.index}:${state.answerEn}`;
    if (spokenRef.current !== key) {
      spokenRef.current = key;
      try {
        // 新しいAPI想定
        speak(state.answerEn, { lang });
      } catch {
        try {
          // 旧API互換
          // @ts-expect-error 互換呼び出し
          speak(state.answerEn, lang);
        } catch {
          /* ignore */
        }
      }
    }
  }, [state, opts.learningMode, lang, speak]);
}
