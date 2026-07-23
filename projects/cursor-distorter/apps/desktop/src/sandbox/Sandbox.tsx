import { useEffect, useState, type ReactNode } from "react";
import { SandboxHost } from "../cursor/SandboxHost";
import { WindowDots, SbWindow } from "./controls";
import { CookieBanner } from "./apps/CookieBanner";
import { ExpenseForm } from "./apps/ExpenseForm";
import { CaptchaApp } from "./apps/CaptchaApp";
import { SpreadsheetApp } from "./apps/SpreadsheetApp";
import { CalendarApp } from "./apps/CalendarApp";
import { FileCleanup } from "./apps/FileCleanup";
import { EvasivePopup } from "./apps/EvasivePopup";
import { TurnOffPanel } from "./apps/TurnOffPanel";

function MenuBar() {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const t = window.setInterval(tick, 15000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/8 bg-black/30 px-3 text-[12px] text-white/70 backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="text-white/90">◉</span>
        <span className="font-semibold text-white/90">Cursor Distorter</span>
        {["File", "Edit", "View", "Sabotage", "Help"].map((m) => (
          <span key={m} className="hidden text-white/55 sm:inline">
            {m}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-white/60">
        <span className="text-signal-bad">● distortion</span>
        <span>􀙇</span>
        <span className="stat-num">{clock}</span>
      </div>
    </div>
  );
}

function BrowserWindow({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-full flex flex-col overflow-hidden rounded-xl border border-white/10 bg-ink-850/95 shadow-glass xl:col-span-2">
      <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.03] px-3 py-2">
        <WindowDots id="win-browser" />
        <div className="flex flex-1 items-center gap-2">
          <span className="text-ink-500">‹ ›</span>
          <div className="flex-1 truncate rounded-md bg-black/30 px-3 py-1 text-[11px] text-ink-500">
            🔒 expenses.internal / new-report
          </div>
        </div>
        <span className="text-[11px] text-ink-500">⋯</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** The full Safe Demo Sandbox: a fake desktop with fake apps to showcase every effect. */
export function Sandbox() {
  return (
    <SandboxHost>
      <div className="flex h-full w-full flex-col bg-gradient-to-br from-[#141a2e] via-[#0d1120] to-[#0a0c16]">
        <MenuBar />
        <div className="relative flex-1 overflow-hidden p-4">
          <div className="mx-auto grid h-full max-w-[1200px] grid-cols-1 content-start gap-4 xl:grid-cols-3">
            <BrowserWindow>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[12px] font-semibold text-white/80">New expense report</div>
                  <ExpenseForm />
                </div>
                <div className="space-y-4">
                  <CaptchaApp />
                  <CookieBanner />
                </div>
              </div>
            </BrowserWindow>

            <SbWindow id="win-calendar" title="Calendar" className="min-h-[220px]">
              <CalendarApp />
            </SbWindow>

            <SbWindow id="win-sheet" title="Numbers — Q3" className="min-h-[220px]">
              <SpreadsheetApp />
            </SbWindow>

            <SbWindow id="win-files" title="Finder — Desktop" className="relative min-h-[220px]">
              <FileCleanup />
            </SbWindow>

            <SbWindow id="win-turnoff" title="Cursor Distorter" className="min-h-[220px]" bodyClassName="flex items-center justify-center">
              <TurnOffPanel />
            </SbWindow>

            <div className="pointer-events-none absolute bottom-4 right-4 z-40">
              <div className="pointer-events-auto">
                <EvasivePopup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SandboxHost>
  );
}
