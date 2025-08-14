// use-color-mode.ts
import type { ThemeProviderProps } from "next-themes";
import { useTheme } from "next-themes";

export type ColorModeProviderProps = ThemeProviderProps;

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  toggleColorMode: () => void;
}

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = (forcedTheme || resolvedTheme) as ColorMode;

  const setColorMode = (mode: ColorMode) => setTheme(mode);
  const toggleColorMode = () => {
    // その場の値でトグル（クロージャ固定を避ける）
    setTheme(colorMode === "dark" ? "light" : "dark");
  };

  return { colorMode, setColorMode, toggleColorMode };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}
