import type { DecodableImage } from "@/types/index";

/** 任意画像のプリロード（HTMLImageElement.decode() 対応） */
export async function preloadImage(src: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const img: DecodableImage = document.createElement("img");
    img.src = src;
    if (typeof img.decode === "function") {
      img
        .decode()
        .then(() => resolve())
        .catch(() => resolve());
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
}
