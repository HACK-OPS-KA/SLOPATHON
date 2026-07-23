import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { NoiseEnforcer } from "../app/noise-enforcer";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Noise Enforcement Officer could not find its control room.");
}

createRoot(root).render(
  <StrictMode>
    <NoiseEnforcer />
  </StrictMode>,
);
