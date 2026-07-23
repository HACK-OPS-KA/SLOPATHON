'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// One-command sanity check for `arcade doctor`, meant to catch the handful
// of things that actually go wrong on a fresh clone before someone hits a
// confusing failure mid-demo: the node-pty native module not loading, the
// claude CLI missing from PATH, or running `arcade` from the wrong
// directory (the project-local hook config only applies when cwd is this
// repo).
function runDoctor() {
  console.log('Terminal Arcade doctor\n');
  let ok = true;

  try {
    require('node-pty');
    console.log('OK    node-pty loaded');
  } catch (err) {
    ok = false;
    console.log('FAIL  node-pty failed to load:', err.message);
    console.log('      On macOS this is usually missing Xcode Command Line Tools.');
    console.log('      Try: xcode-select --install, then rerun npm install.');
  }

  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['claude']);
  if (which.status === 0) {
    console.log('OK    claude CLI found on PATH:', which.stdout.toString().trim());
  } else {
    ok = false;
    console.log('FAIL  claude CLI not found on PATH.');
    console.log('      Install Claude Code first, then make sure `claude` is on your PATH.');
  }

  const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    console.log('OK    found project-local .claude/settings.json in', process.cwd());
  } else {
    ok = false;
    console.log('FAIL  no .claude/settings.json in the current directory:', process.cwd());
    console.log('      Run `arcade` from inside the terminal-arcade clone -- that\'s what wires the hooks.');
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    console.log('OK    running in a real terminal (arcade mode will engage)');
  } else {
    console.log('INFO  not running in an interactive terminal right now -- arcade mode');
    console.log('      only engages with a real TTY. Run `arcade doctor` directly in');
    console.log('      your terminal (not piped) to check this properly.');
  }

  console.log('');
  console.log(ok ? 'All checks passed. Run `arcade` to start.' : 'Some checks failed -- fix the items above before running `arcade`.');
  process.exit(ok ? 0 : 1);
}

module.exports = { runDoctor };
