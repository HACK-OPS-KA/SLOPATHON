#!/usr/bin/env node
'use strict';

const { spawnClaude } = require('../src/pty-manager');
const { createHookBridge } = require('../src/hook-bridge');
const { createTerminalController } = require('../src/terminal-controller');
const { runDoctor } = require('../src/doctor');

function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'doctor') {
    runDoctor();
    return;
  }

  const bridge = createHookBridge();

  const child = spawnClaude(args, {
    cwd: process.cwd(),
    env: { ...process.env, ARCADE_SOCK: bridge.sockPath },
    cols: process.stdout.columns,
    rows: process.stdout.rows,
  });

  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  const controller = createTerminalController({
    stdout: process.stdout,
    child,
    cols: process.stdout.columns,
    rows: process.stdout.rows,
    onQuit: () => {
      child.kill();
    },
  });

  bridge.events.on('event', (evt) => {
    if (evt.kind === 'ready') {
      controller.exitArcade();
    } else if (isInteractive) {
      // Only take over the screen when we actually own a real terminal;
      // a non-interactive run (piped/CI) just gets plain passthrough.
      controller.enterArcade();
    }
  });
  bridge.events.on('error', (err) => {
    process.stderr.write(`[arcade] hook bridge error: ${err.message}\n`);
  });

  if (isInteractive) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const onStdinData = (data) => controller.handleStdin(data);
  process.stdin.on('data', onStdinData);

  child.onData((data) => {
    controller.handleChildData(data);
  });

  const onResize = () => {
    child.resize(process.stdout.columns, process.stdout.rows);
    controller.resize(process.stdout.columns, process.stdout.rows);
  };
  process.stdout.on('resize', onResize);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (isInteractive) {
      // Only meaningful (and only safe to emit) if we ever actually took
      // over a real screen — a non-interactive run never enters arcade
      // mode, and writing these escape codes into piped/redirected output
      // would just be garbage bytes for whatever is consuming it.
      controller.forceRestore();
      try {
        process.stdin.setRawMode(false);
      } catch (_) {
        /* stdin may already be gone */
      }
    }
    process.stdin.removeListener('data', onStdinData);
    process.stdout.removeListener('resize', onResize);
    bridge.close();
  };

  child.onExit(({ exitCode }) => {
    cleanup();
    process.exit(exitCode);
  });

  process.on('SIGINT', () => {
    /* In raw mode Ctrl-C arrives as data (0x03), not SIGINT, so this only
     * fires for non-interactive runs. Forward it to the child either way. */
    child.write('\x03');
  });
  process.on('SIGTERM', () => {
    // Node's default disposition for SIGTERM with no listener terminates
    // the process immediately WITHOUT running the 'exit' handler below, so
    // without this the terminal could be left in raw/alt-screen mode.
    cleanup();
    process.exit(0);
  });
  process.on('uncaughtException', (err) => {
    cleanup();
    process.stderr.write(`[arcade] fatal: ${err.stack || err}\n`);
    process.exit(1);
  });
  process.on('exit', cleanup);
}

main();
