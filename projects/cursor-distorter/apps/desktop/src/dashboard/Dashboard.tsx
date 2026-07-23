import { TopBar } from "./TopBar";
import { ControlRail } from "./ControlRail";
import { Sandbox } from "../sandbox/Sandbox";

export function Dashboard() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[384px] shrink-0 border-r border-white/8 bg-ink-900/50 md:block">
          <ControlRail />
        </aside>
        <main className="min-w-0 flex-1 bg-ink-950">
          <Sandbox />
        </main>
      </div>
    </div>
  );
}
