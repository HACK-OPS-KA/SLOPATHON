import { useStore } from "../state/store";
import { useGlobalControls } from "../hooks/useGlobalControls";
import { Onboarding } from "../onboarding/Onboarding";
import { Dashboard } from "../dashboard/Dashboard";
import { DemoScreen } from "../demo/DemoScreen";

export function App() {
  useGlobalControls();
  const screen = useStore((s) => s.screen);

  return (
    <div className="h-full w-full">
      {screen === "onboarding" && <Onboarding />}
      {screen === "dashboard" && <Dashboard />}
      {screen === "demo" && <DemoScreen />}
    </div>
  );
}
