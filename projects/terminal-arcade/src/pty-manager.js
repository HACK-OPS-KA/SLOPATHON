'use strict';

const pty = require('node-pty');

/**
 * Spawns `claude` inside a real pseudo-terminal so its own isTTY-based UI
 * (spinners, arrow-key menus, colors) behaves exactly as it would standalone.
 */
function spawnClaude(args, { cwd, env, cols, rows }) {
  const shell = process.env.ARCADE_CLAUDE_BIN || 'claude';
  return pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: cwd || process.cwd(),
    env: env || process.env,
  });
}

module.exports = { spawnClaude };
