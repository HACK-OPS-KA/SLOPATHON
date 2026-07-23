#!/usr/bin/env node
// Cursor Distorter — Terminal recovery.
//
// Stops everything and restores normal input. This script ONLY terminates Cursor
// Distorter's own processes; it changes no settings and DELETES NOTHING. It is safe to
// run at any time and safe to run repeatedly (idempotent) — if nothing is running, it
// simply reports that and exits cleanly.
//
// Usage:
//   pnpm recover
//   node scripts/recover.mjs

import { spawnSync } from "node:child_process";

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║              CURSOR DISTORTER · RECOVERY                       ║
║                                                                ║
║   Restoring normal input. This stops Cursor Distorter only.    ║
║   It changes no settings and deletes nothing.                  ║
╚══════════════════════════════════════════════════════════════╝
`;

// Process-name patterns we will try to stop, with the exact manual command for each.
const TARGETS = [
  { label: "Cursor Distorter (Electron app)", pattern: 'Cursor Distorter' },
  { label: "cursor-distorter helper (native)", pattern: "cursor-distorter-helper" },
];

/**
 * Best-effort, non-fatal terminate of processes matching `pattern` via pkill.
 * Never throws; returns a short human-readable outcome string.
 */
function tryPkill(pattern) {
  try {
    // -f matches against the full command line; we do NOT use -9 so processes can
    // shut down cleanly (which is what restores normal input on the way out).
    const res = spawnSync("pkill", ["-f", pattern], { encoding: "utf8" });
    if (res.error) {
      // e.g. pkill not found on this platform — non-fatal.
      return `skipped (could not run pkill: ${res.error.message})`;
    }
    // pkill exit codes: 0 = matched & signalled, 1 = no processes matched.
    if (res.status === 0) return "stopped running process(es)";
    if (res.status === 1) return "nothing was running";
    return `pkill exited with status ${res.status}`;
  } catch (err) {
    return `skipped (error: ${err?.message ?? String(err)})`;
  }
}

function main() {
  console.log(BANNER);

  for (const { label, pattern } of TARGETS) {
    const outcome = tryPkill(pattern);
    console.log(`  • ${label}: ${outcome}`);
  }

  console.log(`
Done. If distortion was active, normal input is restored now.

If you'd rather do this by hand, these are the exact commands this script runs:

    pkill -f "Cursor Distorter"
    pkill -f cursor-distorter-helper

Other ways out (any one of them is enough):

    • Press  ⌘⇧⎋  (Cmd+Shift+Esc)  — instant panic, bypasses all distortion.
    • Use the menu-bar "Disable all distortion" item.
    • Quit the app — quitting always restores normal input first.
    • Wait for the max session timer (default 10 minutes) to auto-disable it.

This script restores normal input only. It never deletes files or changes settings.
`);
}

main();
