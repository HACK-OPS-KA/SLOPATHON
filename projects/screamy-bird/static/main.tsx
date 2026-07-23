import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { ScreamyBirdGame } from "../app/screamy-bird-game";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Screamy Bird could not find its flight viewport.");
}

createRoot(root).render(
  <StrictMode>
    <ScreamyBirdGame />
  </StrictMode>,
);
