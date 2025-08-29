import type { QuestionPanelProps } from "@/types/index";
import { AspectRatio, Box, Image, Skeleton, Text } from "@chakra-ui/react";

export default function QuestionPanel({
  questionText,
  questionImg,
}: QuestionPanelProps) {
  return (
    <Box w="450px">
      <Box rounded="lg" borderWidth="1px" p="3" bg="gray.subtle">
        <Text fontSize={{ base: "lg", md: "xl" }} color="fg">
          {questionText}
        </Text>
      </Box>

      <Box mt="16px">
        <AspectRatio ratio={1 / 1} w="200px" mx="auto">
          {questionImg ? (
            <Image
              src={questionImg}
              alt={questionText || "question image"}
              objectFit="contain"
              rounded="lg"
              borderWidth="1px"
              bg="white"
              p="2"
            />
          ) : (
            <Skeleton rounded="lg" />
          )}
        </AspectRatio>
      </Box>
    </Box>
  );
}
