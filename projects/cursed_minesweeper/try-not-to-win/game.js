const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

// 🤖 TRY NOT TO WIN: you don't get to play. a built-in autosolver takes the
// board and wins every single game in seconds. sound deduction handles the
// certain moves; when it would have to guess it peeks at the truth and opens a
// guaranteed-safe cell, so it never, ever loses. good luck NOT winning.
const STEP_MS = 40; // delay between solver ticks so you can watch it work

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const resetButton = document.getElementById("reset");
const difficultyEl = document.getElementById("difficulty");
const statusEl = document.getElementById("solver-status");

let config = PRESETS.beginner;
let grid = [];
let minesPlaced = false;
let gameOver = false;
let awaitingFirstClick = true;
let flagsPlaced = 0;
let revealedCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let solverTimer = null;
let flashTimer = null;
let solveStart = 0;

function createGrid() {
  grid = [];
  for (let row = 0; row < config.rows; row++) {
    const cells = [];
    for (let col = 0; col < config.cols; col++) {
      cells.push({
        row,
        col,
        mine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
        element: null,
      });
    }
    grid.push(cells);
  }
}

function neighbours(cell) {
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const row = cell.row + dr;
      const col = cell.col + dc;
      if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) continue;
      result.push(grid[row][col]);
    }
  }
  return result;
}

function placeMines(safeCell) {
  const forbidden = new Set([safeCell, ...neighbours(safeCell)]);
  const candidates = [];
  for (const cells of grid) {
    for (const cell of cells) {
      if (!forbidden.has(cell)) candidates.push(cell);
    }
  }
  for (let i = 0; i < config.mines; i++) {
    const index = Math.floor(Math.random() * candidates.length);
    const [cell] = candidates.splice(index, 1);
    cell.mine = true;
  }
  for (const cells of grid) {
    for (const cell of cells) {
      cell.adjacentMines = neighbours(cell).filter((n) => n.mine).length;
    }
  }
  minesPlaced = true;
}

function renderBoard() {
  boardEl.style.setProperty("--cols", config.cols);
  boardEl.innerHTML = "";
  for (const cells of grid) {
    for (const cell of cells) {
      const button = document.createElement("button");
      button.className = "cell";
      button.addEventListener("click", () => onLeftClick(cell));
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        onRightClick(cell);
      });
      cell.element = button;
      boardEl.appendChild(button);
    }
  }
  updateCounters();
}

function paintCell(cell) {
  const button = cell.element;
  button.classList.toggle("revealed", cell.revealed);
  button.classList.toggle("flagged", !cell.revealed && cell.flagged);
  button.dataset.value = "";
  button.textContent = "";
  if (cell.flagged && !cell.revealed) {
    button.textContent = "🚩";
    return;
  }
  if (!cell.revealed) return;
  if (cell.mine) {
    button.textContent = "💣";
    return;
  }
  if (cell.adjacentMines > 0) {
    button.textContent = cell.adjacentMines;
    button.dataset.value = cell.adjacentMines;
  }
}

function updateCounters() {
  mineCounterEl.textContent = String(config.mines - flagsPlaced).padStart(3, "0");
  timerEl.textContent = String(Math.min(secondsElapsed, 999)).padStart(3, "0");
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateCounters();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// --- you get exactly ONE move: the first click. then the bot takes over. ---
function onLeftClick(cell) {
  if (gameOver) return;
  if (!awaitingFirstClick) {
    flashStatus("🙅 too late — the autosolver's got it from here.");
    return;
  }
  if (cell.flagged) return;
  // your one and only move: seed the board, then hand it to the bot.
  awaitingFirstClick = false;
  solveStart = performance.now();
  if (!minesPlaced) {
    placeMines(cell);
    startTimer();
  }
  reveal(cell);
  setStatus("🤖 autosolver engaged — from here you literally cannot stop it…");
  schedule();
}

function onRightClick() {
  flashStatus("🙅 flags are the bot's job. just take your first click.");
}

function reveal(cell) {
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  paintCell(cell);
  if (cell.mine) {
    loseGame();
    return;
  }
  revealedCount++;
  if (cell.adjacentMines === 0) {
    for (const neighbour of neighbours(cell)) reveal(neighbour);
  }
  checkWin();
}

function checkWin() {
  if (gameOver) return;
  const safeCells = config.rows * config.cols - config.mines;
  if (revealedCount === safeCells) winGame();
}

function loseGame() {
  // should never happen — the solver only reveals cells it has proven safe.
  gameOver = true;
  stopTimer();
  clearTimeout(solverTimer);
  resetButton.textContent = "😵";
  setStatus("😵 ...huh? that wasn't supposed to happen.");
}

function winGame() {
  gameOver = true;
  stopTimer();
  clearTimeout(solverTimer);
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
        flagsPlaced++;
        paintCell(cell);
      }
    }
  }
  updateCounters();
  resetButton.textContent = "😎";
  setStatus(""); // no gloating banner — the 😎 reset button says it all
}

// --- the autosolver ---
function hiddenNeighbours(cell) {
  return neighbours(cell).filter((n) => !n.revealed && !n.flagged);
}

function deduce() {
  const toReveal = new Set();
  const toFlag = new Set();
  for (const cells of grid) {
    for (const cell of cells) {
      if (!cell.revealed || cell.mine || cell.adjacentMines === 0) continue;
      const hidden = hiddenNeighbours(cell);
      if (hidden.length === 0) continue;
      const flagged = neighbours(cell).filter((n) => n.flagged).length;
      if (cell.adjacentMines === flagged) {
        hidden.forEach((h) => toReveal.add(h)); // the rest must be safe
      } else if (cell.adjacentMines - flagged === hidden.length) {
        hidden.forEach((h) => toFlag.add(h)); // the rest must all be mines
      }
    }
  }
  let changed = false;
  toFlag.forEach((c) => {
    if (!c.flagged && !c.revealed) {
      c.flagged = true;
      flagsPlaced++;
      paintCell(c);
      changed = true;
    }
  });
  toReveal.forEach((c) => {
    if (!c.revealed && !c.flagged) {
      reveal(c);
      changed = true;
    }
  });
  if (changed) updateCounters();
  return changed;
}

function safeGuess() {
  // the little cheat that guarantees the win: open a genuinely safe covered
  // cell (prefer empty ones for a satisfying cascade).
  let best = null;
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.revealed || cell.flagged || cell.mine) continue;
      if (!best || cell.adjacentMines < best.adjacentMines) best = cell;
    }
  }
  if (!best) return false;
  reveal(best);
  updateCounters();
  return true;
}

function solverTick() {
  if (gameOver) return;
  if (deduce()) return schedule();
  if (safeGuess()) return schedule();
  checkWin(); // safety net — by here it should already be won
}

function schedule() {
  solverTimer = setTimeout(solverTick, STEP_MS);
}

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.display = msg ? "" : "none"; // hide the banner when empty
}

function flashStatus(msg) {
  if (!statusEl || gameOver) return;
  const prev = statusEl.textContent;
  setStatus(msg);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    if (!gameOver) setStatus(prev);
  }, 1200);
}

function newGame() {
  config = PRESETS[difficultyEl.value];
  minesPlaced = false;
  gameOver = false;
  awaitingFirstClick = true;
  flagsPlaced = 0;
  revealedCount = 0;
  secondsElapsed = 0;
  clearTimeout(solverTimer);
  stopTimer();
  resetButton.textContent = "🙂";
  setStatus(""); // stay silent until the human's first click hands off to the bot
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
