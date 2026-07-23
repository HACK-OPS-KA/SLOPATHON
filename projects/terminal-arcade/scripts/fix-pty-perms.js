#!/usr/bin/env node
'use strict';

// Some npm/tar combinations strip the executable bit from node-pty's
// prebuilt `spawn-helper` binary on install, which makes every pty.spawn()
// fail with "posix_spawnp failed" even though the binary itself is fine.
// Restore +x defensively after install so this never bites a fresh clone.

const fs = require('fs');
const path = require('path');

const prebuildsDir = path.join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds');

if (!fs.existsSync(prebuildsDir)) {
  process.exit(0);
}

for (const platformDir of fs.readdirSync(prebuildsDir)) {
  const helperPath = path.join(prebuildsDir, platformDir, 'spawn-helper');
  if (fs.existsSync(helperPath)) {
    fs.chmodSync(helperPath, 0o755);
  }
}
