import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { Provider } from "@/components/ui/provider";
import { ToasterHost } from "@/components/ui/ToasterHost";
import PageProvider from "@/contexts/PageProvider";

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<Provider>
				<PageProvider>
					<App />
					<ToasterHost />
				</PageProvider>
			</Provider>
		</React.StrictMode>,
	);
}
