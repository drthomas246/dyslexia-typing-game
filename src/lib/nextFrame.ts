export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
