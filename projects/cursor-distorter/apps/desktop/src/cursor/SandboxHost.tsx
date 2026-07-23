import { useEffect, useRef, type ReactNode } from "react";
import { useStore } from "../state/store";
import { RegistryProvider, TargetRegistry } from "./registry";
import { CursorLayer, type CursorLayerApi } from "./CursorLayer";
import { ChaosLoop } from "./ChaosLoop";
import { playSound, setSoundEnabled } from "../sound";

/**
 * Wraps the Safe Demo Sandbox: provides the target registry, hides the native cursor,
 * renders the fake cursor overlay, and runs the chaos loop for its lifetime.
 */
export function SandboxHost({ children }: { children: ReactNode }) {
  const engine = useStore((s) => s.engine);
  const syncLive = useStore((s) => s.syncLive);
  const soundOn = useStore((s) => s.soundOn);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorApiRef = useRef<CursorLayerApi | null>(null);
  const registryRef = useRef<TargetRegistry | null>(null);
  if (!registryRef.current) registryRef.current = new TargetRegistry();

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  useEffect(() => {
    const registry = registryRef.current!;
    const root = rootRef.current!;
    registry.setOrigin(root);
    const loop = new ChaosLoop({
      engine,
      registry,
      root,
      cursorApi: () => cursorApiRef.current,
      onLive: syncLive,
      onSound: (name) => playSound(name),
    });
    loop.start();
    return () => loop.stop();
  }, [engine, syncLive]);

  return (
    <div
      ref={rootRef}
      className="cd-hide-native-cursor relative h-full w-full select-none"
      data-cd-sandbox
    >
      <RegistryProvider registry={registryRef.current}>{children}</RegistryProvider>
      <CursorLayer apiRef={cursorApiRef} />
    </div>
  );
}
