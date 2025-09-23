// use-color-mode.ts

import { useTheme } from "next-themes";
import type { ColorMode, UseColorModeReturn } from "@/types/index";

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
