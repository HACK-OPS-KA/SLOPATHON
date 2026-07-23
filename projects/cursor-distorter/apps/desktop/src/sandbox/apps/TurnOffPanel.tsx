import { useStore } from "../../state/store";
import { EvasiveButton } from "../EvasiveButton";

/**
 * The final button: "Turn Off Cursor Distorter". Mildly difficult to click, then
 * completely normal after three failed attempts. Disarms distortion when it lands.
 */
export function TurnOffPanel() {
  const setActive = useStore((s) => s.setActive);
  const active = useStore((s) => s.active);
  const released = useStore((s) => s.closeEvasionReleased);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div>
        <div className="text-[12px] font-medium text-white/80">Finished being sabotaged?</div>
        <div className="mt-0.5 text-[11px] text-ink-500">
          {released ? "The button has relented. Go ahead." : "This button is mildly difficult on purpose."}
        </div>
      </div>
      <EvasiveButton
        id="turn-off"
        importance={0.95}
        radius={30}
        onActivate={() => setActive(false)}
        className="flex items-center justify-center rounded-xl bg-signal-bad px-6 py-3 text-sm font-semibold text-white shadow-glow"
      >
        Turn Off Cursor Distorter
      </EvasiveButton>
      <div className="text-[11px]">
        Distortion is{" "}
        <span className={active ? "text-signal-bad" : "text-signal-ok"}>{active ? "active" : "off"}</span>
        {!released && <span className="text-ink-500"> · panic: ⌘⇧⎋</span>}
      </div>
    </div>
  );
}
