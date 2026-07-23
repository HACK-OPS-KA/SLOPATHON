import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import { App } from "./app/App";
import { OverlayView } from "./overlay/OverlayView";

// `isOverlay` is an overlay-only helper the preload adds on top of the shared
// bridge contract, so it is not part of the typed interface.
const bridge = window.cursorDistorter as
  | (Window["cursorDistorter"] & { isOverlay?: () => boolean })
  | undefined;

const isOverlay =
  bridge?.isOverlay?.() ??
  new URLSearchParams(window.location.search).get("overlay") === "1";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isOverlay ? <OverlayView /> : <App />}</React.StrictMode>,
);
