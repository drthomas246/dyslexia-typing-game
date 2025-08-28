import { useEffect, useState } from "react";

export function useTimer(tickMs: number, started: boolean, finished: boolean) {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    if (!started || finished) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [started, finished, tickMs]);

  return { nowMs };
}
