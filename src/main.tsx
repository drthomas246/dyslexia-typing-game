import App from "@/App";
import { Provider } from "@/components/ui/provider";
import PageProvider from "@/contexts/PageProvider";
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <PageProvider>
        <App />
      </PageProvider>
    </Provider>
  </React.StrictMode>,
);
