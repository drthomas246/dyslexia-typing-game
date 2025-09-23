import {
	Button,
	Container,
	For,
	Heading,
	HStack,
	Stack,
} from "@chakra-ui/react";
import { useLiveQuery } from "dexie-react-hooks";
import { usePage, useSetPage } from "@/contexts/PageContext";
import { TYPING_ROUTE_POINTS } from "@/data/points";
import Typing from "@/pages/TypingPage";
import { getMakingProblems } from "@/repositories/appStateRepository";
import { clearMakingProblems } from "./repositories/appStateRepository";

export default function App() {
	const making = useLiveQuery(() => getMakingProblems(), [], []);
	const page = usePage();
	const setPage = useSetPage();
	const qaData = (page: number) => {
		if (page === 999999) {
			return making;
		} else {
			return TYPING_ROUTE_POINTS[page - 1].QA;
		}
	};
	const titleData = (page: number) => {
		if (page === 999999) {
			return "まちがえた問題";
		} else {
			return TYPING_ROUTE_POINTS[page - 1].title;
		}
	};

	return (
		<>
			{page === 0 ? (
				<Container p="6" maxW="container.md">
					<Stack justify="space-between" gap="6">
						<HStack justify="space-between">
							<Heading size="4xl">タイピングゲーム</Heading>
							<Button
								variant="outline"
								colorPalette="orange"
								onClick={() => clearMakingProblems()}
							>
								履歴の全消去
							</Button>
						</HStack>
						<HStack>
							<For each={TYPING_ROUTE_POINTS}>
								{(item, index) => (
									<Button key={index} onClick={() => setPage(item.id)}>
										{item.title}
									</Button>
								)}
							</For>
						</HStack>
						{making.length ? (
							<HStack>
								<Button colorPalette="teal" onClick={() => setPage(999999)}>
									間違えた単語
								</Button>
							</HStack>
						) : null}
					</Stack>
				</Container>
			) : (
				<Typing
					QA={qaData(page)}
					title={titleData(page)}
					makingProblem={page === 999999}
				/>
			)}
		</>
	);
}
