import type {
  ConfidenceReadout,
  CursorContext,
  EffectId,
  EffectResult,
} from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";

type Severity = "ok" | "warn" | "bad";
type Trend = "up" | "down" | "flat";

/**
 * 12. Cursor Confidence — emits fake confidence/analytics readouts that update every
 * couple of seconds and have no relationship to reality. The renderer persists the last
 * set between updates.
 */
export class ConfidenceEffect extends BaseEffect {
  readonly id: EffectId = "confidence";
  readonly name = "Cursor Confidence";
  readonly description = "Live pointer analytics with no basis in reality.";

  private nextAt = 0;
  private cache: ConfidenceReadout[] = [];

  update(ctx: CursorContext): EffectResult {
    if (ctx.now < this.nextAt && this.cache.length) return {};
    this.nextAt = ctx.now + ctx.rng.range(1800, 2600);

    const pct = () => `${ctx.rng.int(28, 99)}%`;
    const sev = (): Severity => ctx.rng.pick<Severity>(["ok", "warn", "bad"]);
    const trend = (): Trend => ctx.rng.pick<Trend>(["up", "down", "flat"]);

    this.cache = [
      { id: "cursor-conf", label: "Cursor confidence", value: pct(), severity: sev(), trend: trend() },
      {
        id: "align",
        label: "Click alignment confidence",
        value: pct(),
        severity: "warn",
        trend: trend(),
      },
      {
        id: "intent",
        label: "User intent confidence",
        value: ctx.rng.pick(["inconclusive", "contested", "under review"]),
        severity: "bad",
      },
      {
        id: "anomaly",
        label: ctx.rng.pick([
          "Motor accuracy anomaly",
          "Pointer-user disagreement",
          "Manual override drift",
        ]),
        value: ctx.rng.pick(["detected", "flagged", "monitored"]),
        severity: "bad",
      },
    ];

    if (this.boolp("casino", false)) {
      this.cache.push({ id: "streak", label: "Win streak", value: `${ctx.rng.int(1, 12)}`, severity: "ok", trend: "up" });
      this.cache.push({ id: "odds", label: "Click success odds", value: pct(), severity: "warn" });
    }

    return { confidence: this.cache };
  }

  cleanup(): void {
    this.nextAt = 0;
    this.cache = [];
  }
}
