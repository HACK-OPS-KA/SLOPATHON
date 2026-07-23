'use strict';

const { EventEmitter } = require('events');
const { start: startSnake } = require('./games/snake');

const ALT_SCREEN_ON = '\x1b[?1049h';
const ALT_SCREEN_OFF = '\x1b[?1049l';
const CURSOR_SHOW = '\x1b[?25h';

// Cap on how much child pty output we'll buffer while the arcade screen is
// up. A single tool call's output could in principle be huge; buffering it
// unboundedly is a memory leak waiting to happen, so past this cap we bail
// out of arcade mode early, flush what we have, and fall back to live
// passthrough for the remainder of the turn rather than keep buffering.
const BUFFER_CAP_BYTES = 3 * 1024 * 1024;

/**
 * Owns the transition between "normal passthrough" (IDLE) and "arcade
 * takeover" (ARCADE): alternate screen buffer, capped buffering of the
 * child's real output, and running the Snake game for the duration. Also
 * the single place responsible for guaranteeing the real terminal is left
 * in a sane state no matter how the process ends.
 */
function createTerminalController({ stdout, child, onQuit, cols, rows }) {
  let mode = 'IDLE';
  let bufferedChunks = [];
  let bufferedBytes = 0;
  let overflowed = false;
  let dims = { cols: cols || 80, rows: rows || 24 };
  let session = null;
  let gameStdin = null;

  function enterArcade() {
    if (mode === 'ARCADE') return;
    mode = 'ARCADE';
    bufferedChunks = [];
    bufferedBytes = 0;
    overflowed = false;
    stdout.write(ALT_SCREEN_ON);
    if (session) {
      // Same snake, same score — pick up exactly where the last turn left
      // off instead of starting a fresh game every time Claude gets busy.
      session.resume();
    } else {
      // snake.js consumes an EventEmitter with the same shape as a real
      // stdin stream (`on('data', ...)` / `removeListener('data', ...)`),
      // so handleStdin below just re-emits onto it rather than duplicating
      // the game's own input-handling logic here. Created once and kept
      // alive for the lifetime of the process (see exitArcade/forceRestore).
      gameStdin = new EventEmitter();
      session = startSnake(gameStdin, stdout, {
        cols: dims.cols,
        rows: dims.rows,
        onQuit,
      });
    }
  }

  function exitArcade() {
    if (mode === 'IDLE') return;
    mode = 'IDLE';
    if (session) {
      // Freeze the game in place rather than tearing it down, so the next
      // enterArcade() resumes instead of resetting.
      session.pause();
    }
    stdout.write(ALT_SCREEN_OFF + CURSOR_SHOW);
    for (const chunk of bufferedChunks) {
      stdout.write(chunk);
    }
    bufferedChunks = [];
    bufferedBytes = 0;
  }

  function handleChildData(data) {
    if (mode === 'IDLE') {
      stdout.write(data);
      return;
    }
    if (overflowed) {
      // Already degraded to live passthrough for the rest of this turn.
      stdout.write(data);
      return;
    }
    bufferedChunks.push(data);
    bufferedBytes += Buffer.byteLength(data);
    if (bufferedBytes > BUFFER_CAP_BYTES) {
      overflowed = true;
      exitArcade();
    }
  }

  function handleStdin(data) {
    if (mode === 'IDLE') {
      child.write(data);
      return;
    }
    if (gameStdin) {
      gameStdin.emit('data', data);
    }
  }

  function resize(newCols, newRows) {
    dims = { cols: newCols, rows: newRows };
    if (!session) return;
    if (mode === 'ARCADE') {
      // Visible right now — re-render immediately.
      session.resize(newCols, newRows);
    } else {
      // Paused and not on screen (the real Claude output is): just update
      // the stored bounds silently. Writing a game frame into the main
      // screen buffer here would corrupt whatever's actually showing.
      session.resizeQuiet(newCols, newRows);
    }
  }

  function forceRestore() {
    // Idempotent and safe to call even if already IDLE / already restored —
    // this is the last-resort safety net invoked from signal/exit handlers,
    // and the actual full teardown (unlike exitArcade's pause).
    if (session) {
      session.stop();
      session = null;
      gameStdin = null;
    }
    stdout.write(ALT_SCREEN_OFF + CURSOR_SHOW);
  }

  function getMode() {
    return mode;
  }

  return {
    enterArcade,
    exitArcade,
    handleChildData,
    handleStdin,
    resize,
    forceRestore,
    getMode,
  };
}

module.exports = { createTerminalController };
