import { createToaster } from "@chakra-ui/react";

/** アプリ全体で共有する単一インスタンス（関数や定数だけ：コンポーネントは置かない） */
export const toaster = createToaster({
	placement: "bottom-end",
	pauseOnPageIdle: true,
});
