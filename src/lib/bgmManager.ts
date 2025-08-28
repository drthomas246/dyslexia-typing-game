import { Howl, Howler } from "howler";

type Listener = () => void;

type State = {
  howl: Howl | null;
  src: string | null;
  targetVolume: number; // 常にここに“基準音量”を保持
  isFading: boolean;
  onFade?: Listener;
};

const S: State = {
  howl: null,
  src: null,
  targetVolume: 0.5,
  isFading: false,
  onFade: undefined,
};

const EPS = 0.005;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function attachFadeOnce(h: Howl, cb: Listener) {
  // 既存の 'fade' リスナを外してから登録（多重登録を防止）
  if (S.onFade) h.off("fade", S.onFade);
  S.onFade = cb;
  h.once("fade", cb);
}

export function init(src: string, defaultVolume = 0.5, loop = true) {
  // マスター音量の初期化（必要なら）
  if (Howler.volume() === 0) Howler.volume(1.0);

  // 同じ曲なら再生成しない（音量だけ基準へ合わせる）
  if (S.howl && S.src === src) {
    S.targetVolume = clamp01(defaultVolume);
    if (!S.isFading) S.howl.volume(S.targetVolume);
    return;
  }

  // 異なる/未生成なら作り直し
  if (S.howl) {
    S.howl.stop();
    S.howl.unload();
  }
  S.src = src;
  S.targetVolume = clamp01(defaultVolume);
  S.isFading = false;
  S.onFade = undefined;

  S.howl = new Howl({
    src: [src],
    loop,
    volume: S.targetVolume, // 生成時点で基準音量
    preload: true,
    html5: false,
  });
}

export function setTargetVolume(v: number) {
  S.targetVolume = clamp01(v);
  if (S.howl && !S.isFading) {
    S.howl.volume(S.targetVolume);
  }
}

export function getTargetVolume() {
  return S.targetVolume;
}

/** 冪等な再生：未再生なら 0→target で再生、再生中なら必要時のみ現在→target に寄せる */
export function ensurePlaying(ms = 800, to?: number) {
  const h = S.howl;
  if (!h) return;
  const target = clamp01(to ?? S.targetVolume);
  const cur = h.volume();

  if (!h.playing()) {
    h.volume(0);
    h.play();
    if (ms > 0) {
      S.isFading = true;
      attachFadeOnce(h, () => {
        S.isFading = false;
      });
      h.fade(0, target, ms);
    } else {
      h.volume(target);
    }
    return;
  }

  if (Math.abs(cur - target) > EPS) {
    if (ms > 0) {
      S.isFading = true;
      attachFadeOnce(h, () => {
        S.isFading = false;
      });
      h.fade(cur, target, ms);
    } else {
      h.volume(target);
    }
  }
}

/** フェードアウトして停止。停止後は“基準音量”に戻して待機 */
export function fadeOutStop(ms = 500) {
  const h = S.howl;
  if (!h || !h.playing()) return;
  const cur = h.volume();
  if (cur <= EPS) {
    h.stop();
    h.volume(S.targetVolume);
    return;
  }
  S.isFading = true;
  attachFadeOnce(h, () => {
    h.stop();
    h.volume(S.targetVolume);
    S.isFading = false;
  });
  h.fade(cur, 0, ms);
}

/** 即停止（音量は基準へ戻す） */
export function stopNow() {
  const h = S.howl;
  if (!h) return;
  h.stop();
  h.volume(S.targetVolume);
}
