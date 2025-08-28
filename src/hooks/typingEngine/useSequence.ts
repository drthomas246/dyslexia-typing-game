import { shuffle } from "@/hooks/typingEngine/rng";
import type { EngineOptions, QAPair } from "@/types/index";
import { useCallback, useState } from "react";

export function useSequence(QA: QAPair[], opts: EngineOptions) {
  const [order, setOrder] = useState<number[]>([]);

  const initOrder = useCallback(() => {
    const seed = opts.seed ?? Date.now() % 1_000_000;
    const indices = Array.from({ length: QA.length }, (_, i) => i);
    const useRandom = opts.randomOrder ?? true;
    setOrder(useRandom ? shuffle(indices, seed) : indices);
  }, [QA.length, opts.seed, opts.randomOrder]);

  const getPair = useCallback(
    (index: number): QAPair => {
      const pairIndex = order[index] ?? 0;
      return QA[pairIndex] ?? QA[0];
    },
    [order, QA]
  );

  return { order, initOrder, getPair };
}
