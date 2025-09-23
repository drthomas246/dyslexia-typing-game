import { createContext, useContext } from "react";

export const UserPageContext = createContext<number | undefined>(undefined);
export const UserSetPageContext = createContext<
	React.Dispatch<React.SetStateAction<number>> | undefined
>(undefined);

export const UserBattleContext = createContext<boolean | undefined>(undefined);
export const UserSetBattleContext = createContext<
	React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined);

export const UserSortContext = createContext<boolean | undefined>(undefined);
export const UserSetSortContext = createContext<
	React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined);

export const UserPracticeModeContext = createContext<boolean | undefined>(
	undefined,
);
export const UserSetPracticeModeContext = createContext<
	React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined);

export function usePage() {
	const v = useContext(UserPageContext);
	if (v === undefined)
		throw new Error("usePage must be used within <PageProvider>");
	return v;
}
export function useSetPage() {
	const set = useContext(UserSetPageContext);
	if (set === undefined)
		throw new Error("useSetPage must be used within <PageProvider>");
	return set;
}

export function useBattle() {
	const v = useContext(UserBattleContext);
	if (v === undefined)
		throw new Error("useBattle must be used within <PageProvider>");
	return v;
}
export function useSetBattle() {
	const set = useContext(UserSetBattleContext);
	if (set === undefined)
		throw new Error("useSetBattle must be used within <PageProvider>");
	return set;
}

export function usePracticeMode() {
	const v = useContext(UserPracticeModeContext);
	if (v === undefined)
		throw new Error("usePracticeMode must be used within <PageProvider>");
	return v;
}
export function useSetPracticeMode() {
	const set = useContext(UserSetPracticeModeContext);
	if (set === undefined)
		throw new Error("useSetPracticeMode must be used within <PageProvider>");
	return set;
}

export function useSort() {
	const v = useContext(UserSortContext);
	if (v === undefined)
		throw new Error("useSort must be used within <PageProvider>");
	return v;
}
export function useSetSort() {
	const set = useContext(UserSetSortContext);
	if (set === undefined)
		throw new Error("useSetSort must be used within <PageProvider>");
	return set;
}
