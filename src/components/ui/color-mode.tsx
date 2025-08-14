// color-mode.tsx
import type {
  ColorModeButtonProps,
  ColorModeProviderProps,
} from "@/types/index";
import type { SpanProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { useColorMode } from "./use-color-mode";

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  );
}

export function ColorModeIcon(props: React.ComponentProps<typeof LuSun>) {
  const { colorMode } = useColorMode();
  const Icon = colorMode === "dark" ? LuMoon : LuSun;
  return <Icon {...props} />;
}

// 空の interface -> type エイリアスに変更（警告解消）

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode();
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size="sm"
        ref={ref}
        {...props}
        // アイコン全体のスケールを上げたいなら:
        // fontSize="lg"
        // 個別にSVGを触るなら:
        // css={{ "& svg": { width: "1.25rem", height: "1.25rem" } }}
      >
        <ColorModeIcon size={20} />
      </IconButton>
    </ClientOnly>
  );
});

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        colorScheme="light"
        ref={ref}
        {...props}
      />
    );
  }
);

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function DarkMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme dark"
        colorPalette="gray"
        colorScheme="dark"
        ref={ref}
        {...props}
      />
    );
  }
);
