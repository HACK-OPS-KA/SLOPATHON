'use strict';

// Standalone, self-contained Snake. Doesn't know anything about pty/hooks —
// just consumes a stdin-like stream of raw bytes and writes ANSI frames to a
// stdout-like sink, so it can be dropped into the arcade wrapper or run and
// played directly via `npm run snake`.

const CLEAR_SCREEN = '\x1b[2J';
const CURSOR_HOME = '\x1b[H';
const CURSOR_HIDE = '\x1b[?25l';
const CURSOR_SHOW = '\x1b[?25h';

const TICK_MS = 120;
const CTRL_C = '\x03';

// The playfield is capped at a fixed max size and centered in whatever
// terminal it's given, rather than stretching to fill a large window (which
// made the snake look tiny and far away on a big terminal).
const MAX_WIDTH = 40;
const MAX_HEIGHT = 18;

const DIRS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

// Both normal-cursor-mode (\x1b[A) and application-cursor-mode (\x1bOA)
// arrow key sequences, since which one a terminal sends depends on what was
// last negotiated and isn't reliably one or the other.
const KEY_MAP = {
  '\x1b[A': DIRS.UP,
  '\x1bOA': DIRS.UP,
  w: DIRS.UP,
  W: DIRS.UP,
  '\x1b[B': DIRS.DOWN,
  '\x1bOB': DIRS.DOWN,
  s: DIRS.DOWN,
  S: DIRS.DOWN,
  '\x1b[D': DIRS.LEFT,
  '\x1bOD': DIRS.LEFT,
  a: DIRS.LEFT,
  A: DIRS.LEFT,
  '\x1b[C': DIRS.RIGHT,
  '\x1bOC': DIRS.RIGHT,
  d: DIRS.RIGHT,
  D: DIRS.RIGHT,
};

function isOpposite(a, b) {
  return a.dx === -b.dx && a.dy === -b.dy;
}

/**
 * Starts a Snake game session. Returns { stop, pause, resume, resize,
 * resizeQuiet }:
 *   - pause()/resume() suspend and restart the tick loop WITHOUT resetting
 *     game state, so a caller (the arcade wrapper) can freeze the game
 *     while Claude's real answer is on screen and pick it back up — same
 *     snake, same score — the next time it takes over.
 *   - stop() is the real teardown (used on process exit), which also
 *     detaches the stdin listener.
 *   - resize() re-renders immediately (only safe to call while this game's
 *     frame is actually the visible screen); resizeQuiet() just updates the
 *     stored bounds for a paused game without writing anything to stdout,
 *     since the real screen is showing something else at that point.
 */
function start(stdin, stdout, { cols = 40, rows = 20, onQuit } = {}) {
  let termCols = cols;
  let termRows = rows;
  let width;
  let height;

  let snake;
  let direction;
  let pendingDirection;
  let food;
  let score;
  let gameOver;
  let awaitingRestart;
  let timer = null;

  function computeBounds() {
    width = Math.min(MAX_WIDTH, Math.max(10, termCols - 2));
    height = Math.min(MAX_HEIGHT, Math.max(6, termRows - 4));
  }

  function randomEmptyCell() {
    while (true) {
      const cell = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      };
      if (!snake.some((seg) => seg.x === cell.x && seg.y === cell.y)) {
        return cell;
      }
    }
  }

  function reset() {
    const startX = Math.floor(width / 2);
    const startY = Math.floor(height / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = DIRS.RIGHT;
    pendingDirection = DIRS.RIGHT;
    score = 0;
    gameOver = false;
    awaitingRestart = false;
    food = randomEmptyCell();
  }

  function update() {
    if (gameOver) return;
    direction = pendingDirection;
    const head = snake[0];
    const next = { x: head.x + direction.dx, y: head.y + direction.dy };

    const hitWall = next.x < 0 || next.x >= width || next.y < 0 || next.y >= height;
    const hitSelf = snake.some((seg) => seg.x === next.x && seg.y === next.y);

    if (hitWall || hitSelf) {
      gameOver = true;
      awaitingRestart = true;
      return;
    }

    snake.unshift(next);
    if (next.x === food.x && next.y === food.y) {
      score += 1;
      food = randomEmptyCell();
    } else {
      snake.pop();
    }
  }

  function render() {
    const cellAt = (x, y) => {
      if (snake[0].x === x && snake[0].y === y) return '@';
      if (snake.some((seg, i) => i > 0 && seg.x === x && seg.y === y)) return 'o';
      if (food.x === x && food.y === y) return '*';
      return ' ';
    };

    const content = [];
    content.push('Snake  —  Score: ' + score);
    content.push('+' + '-'.repeat(width) + '+');
    for (let y = 0; y < height; y++) {
      let row = '|';
      for (let x = 0; x < width; x++) row += cellAt(x, y);
      row += '|';
      content.push(row);
    }
    content.push('+' + '-'.repeat(width) + '+');
    if (gameOver) {
      content.push(`GAME OVER — Score: ${score}. Press any key to restart (Ctrl-C to quit).`);
    } else {
      content.push('Arrows/WASD to move — Ctrl-C to quit.');
    }

    const hPad = Math.max(0, Math.floor((termCols - (width + 2)) / 2));
    const vPad = Math.max(0, Math.floor((termRows - content.length) / 2));

    const lines = [];
    for (let i = 0; i < vPad; i++) lines.push('');
    for (const line of content) lines.push(' '.repeat(hPad) + line);

    stdout.write(CURSOR_HOME + lines.join('\r\n') + '\r\n');
  }

  function startTicking() {
    if (timer) return;
    timer = setInterval(() => {
      update();
      render();
    }, TICK_MS);
  }

  function pause() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function resume() {
    stdout.write(CLEAR_SCREEN + CURSOR_HIDE);
    render();
    startTicking();
  }

  const onData = (data) => {
    if (data.includes(CTRL_C)) {
      if (onQuit) onQuit();
      return;
    }
    if (gameOver) {
      if (awaitingRestart) {
        awaitingRestart = false;
        reset();
        render();
      }
      return;
    }
    const dir = KEY_MAP[data];
    if (dir && !isOpposite(dir, direction)) {
      pendingDirection = dir;
    }
  };
  stdin.on('data', onData);

  function applyDimensions(newCols, newRows) {
    termCols = newCols;
    termRows = newRows;
    computeBounds();
    // A shrink that strands part of the snake outside the new bounds ends
    // the round rather than silently teleporting/clamping segments into an
    // inconsistent state.
    if (!gameOver && snake.some((seg) => seg.x >= width || seg.y >= height)) {
      gameOver = true;
      awaitingRestart = true;
    }
  }

  function resize(newCols, newRows) {
    applyDimensions(newCols, newRows);
    stdout.write(CLEAR_SCREEN);
    render();
  }

  function resizeQuiet(newCols, newRows) {
    applyDimensions(newCols, newRows);
  }

  function stop() {
    pause();
    stdin.removeListener('data', onData);
    stdout.write(CURSOR_SHOW);
  }

  computeBounds();
  reset();
  stdout.write(CLEAR_SCREEN + CURSOR_HIDE);
  render();
  startTicking();

  return { stop, pause, resume, resize, resizeQuiet };
}

if (require.main === module) {
  // Dev harness: `npm run snake` plays it directly in your own terminal.
  const stdin = process.stdin;
  const stdout = process.stdout;
  const isInteractive = Boolean(stdin.isTTY && stdout.isTTY);

  if (isInteractive) stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const session = start(stdin, stdout, {
    cols: stdout.columns,
    rows: stdout.rows,
    onQuit: () => {
      session.stop();
      if (isInteractive) stdin.setRawMode(false);
      process.exit(0);
    },
  });

  stdout.on('resize', () => session.resize(stdout.columns, stdout.rows));

  process.on('exit', () => {
    if (isInteractive) {
      try {
        stdin.setRawMode(false);
      } catch (_) {
        /* already gone */
      }
    }
  });
}

module.exports = { start };
