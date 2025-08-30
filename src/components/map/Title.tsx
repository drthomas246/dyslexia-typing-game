import { Box, Image } from "@chakra-ui/react";

export function Title() {
  return (
    <Box pos="absolute" left="calc( 100vw - 400px)" top="0" w="400px">
      <Image src="./images/title/title.png" alt="ことばの魔王とえいごの勇者" />
    </Box>
  );
}
