import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEMO_TIMELINE,
  EscalationController,
} from "@cursor-distorter/chaos-engine";
import { ALL_EFFECT_IDS, type EscalationStage } from "@cursor-distorter/shared-types";
import { useStore } from "../state/store";

export interface EscalationState {
  running: boolean;
  elapsed: number;
  latestNote: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const SEED = "live-demo-catastrophe";

/**
 * Drives an escalation timeline against the engine: on start it resets to a known seed,
 * disables everything, arms distortion, then applies each stage as its time is crossed.
 */
export function useEscalation(timeline: EscalationStage[] = DEMO_TIMELINE): EscalationState {
  const engine = useStore((s) => s.engine);
  const setIntensity = useStore((s) => s.setIntensity);
  const setEffectConfig = useStore((s) => s.setEffectConfig);
  const resetSession = useStore((s) => s.resetSession);
  const setActive = useStore((s) => s.setActive);

  const controllerRef = useRef<EscalationController | null>(null);
  if (!controllerRef.current) controllerRef.current = new EscalationController(timeline);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [latestNote, setLatestNote] = useState<string | null>(null);

  const applyStage = useCallback(
    (stage: EscalationStage) => {
      if (stage.intensity != null) setIntensity(stage.intensity);
      if (stage.effects) {
        for (const id of Object.keys(stage.effects) as (keyof typeof stage.effects)[]) {
          const patch = stage.effects[id];
          if (patch) setEffectConfig(id, patch);
        }
      }
      if (stage.note) setLatestNote(stage.note);
    },
    [setIntensity, setEffectConfig],
  );

  const start = useCallback(() => {
    resetSession(SEED);
    for (const id of ALL_EFFECT_IDS) setEffectConfig(id, { enabled: false });
    setIntensity(0.15);
    setActive(true);
    controllerRef.current!.start(performance.now());
    setRunning(true);
    setElapsed(0);
    setLatestNote(null);
  }, [resetSession, setEffectConfig, setIntensity, setActive]);

  const stop = useCallback(() => {
    controllerRef.current!.stop();
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current!.reset();
    resetSession(SEED);
    for (const id of ALL_EFFECT_IDS) setEffectConfig(id, { enabled: false });
    setIntensity(0.15);
    setRunning(false);
    setElapsed(0);
    setLatestNote(null);
  }, [resetSession, setEffectConfig, setIntensity]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      const now = performance.now();
      const ctrl = controllerRef.current!;
      for (const stage of ctrl.tick(now)) applyStage(stage);
      setElapsed(ctrl.elapsedSeconds(now));
      if (ctrl.done) {
        ctrl.stop();
        setRunning(false);
      }
    }, 400);
    return () => window.clearInterval(t);
  }, [running, applyStage]);

  // Ignore engine ref churn (stable); silence unused var lint.
  void engine;

  return { running, elapsed, latestNote, start, stop, reset };
}
