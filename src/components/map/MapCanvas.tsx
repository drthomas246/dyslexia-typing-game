import { useContainRect } from "@/hooks/useContainRect";
import type { ContainRect } from "@/types/index";
import { Box, Image } from "@chakra-ui/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type PropsWithChildren,
  type ReactElement,
} from "react";

export function MapCanvas({
  imgSrc,
  children,
}: PropsWithChildren<{ imgSrc: string }>) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { rect, compute } = useContainRect(imgRef, wrapRef);

  return (
    <Box ref={wrapRef} pos="relative" w="100vw" h="100vh">
      <Image
        ref={imgRef}
        src={imgSrc}
        alt="地図"
        w="100%"
        h="100%"
        objectFit="contain"
        pos="absolute"
        inset="0"
        zIndex={0}
        pointerEvents="none"
        onLoad={compute}
      />
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ containRect?: ContainRect }>, {
              containRect: rect,
            })
          : child
      )}
    </Box>
  );
}
