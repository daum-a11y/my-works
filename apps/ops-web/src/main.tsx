import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./app/AppRouter";
import "./styles/reset.css";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found.");
}

createRoot(container).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
