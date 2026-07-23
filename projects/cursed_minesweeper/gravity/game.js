const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

// 🪐 GRAVITY: mines aren't locked to the grid — each has a real x/y position,
// jittered inside its cell, so neighbour numbers come out FRACTIONAL like 1.7.
// Right-click a cell that hides a mine and it drops out, falls to the bottom of
// the board and piles up between the cells, reshaping every number as it lands.
const CELL = 30; // px — must match .cell width/height in style.css
const REHIDE_CHANCE = 0.5; // 🪐 chance a dropped mine slips behind a lower tile instead of hitting the floor

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const resetButton = document.getElementById("reset");
const difficultyEl = document.getElementById("difficulty");

let config = PRESETS.beginner;
let grid = [];
let fallenMines = []; // {x, y} of defused mines resting at the bottom
let gravityLayer = null; // overlay div holding the falling / resting 💣s
let minesPlaced = false;
let gameOver = false;
let flagsPlaced = 0;
let minesLeft = 0;
let timerInterval = null;
let secondsElapsed = 0;

function createGrid() {
  grid = [];
  for (let row = 0; row < config.rows; row++) {
    const cells = [];
    for (let col = 0; col < config.cols; col++) {
      cells.push({
        row,
        col,
        mine: false,
        mineX: 0,
        mineY: 0,
        revealed: false,
        flagged: false,
        number: 0,
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

function cellCenter(cell) {
  return { x: (cell.col + 0.5) * CELL, y: (cell.row + 0.5) * CELL };
}

// how much one mine at (mx,my) adds to a cell centre: ~1 when it sits on an
// adjacent cell, fading to 0 about two cells away. jitter + this falloff are
// what produce the cursed fractional numbers.
function weight(cx, cy, mx, my) {
  const dist = Math.hypot(cx - mx, cy - my);
  return Math.max(0, Math.min(1, 2 - dist / CELL));
}

function recomputeNumbers() {
  const sources = [];
  for (const cells of grid) {
    for (const m of cells) {
      if (m.mine) sources.push({ x: m.mineX, y: m.mineY });
    }
  }
  for (const f of fallenMines) sources.push(f);
  for (const cells of grid) {
    for (const cell of cells) {
      const c = cellCenter(cell);
      let sum = 0;
      for (const s of sources) sum += weight(c.x, c.y, s.x, s.y);
      cell.number = sum;
    }
  }
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
    const c = cellCenter(cell);
    cell.mineX = c.x + (Math.random() - 0.5) * CELL * 0.6;
    cell.mineY = c.y + (Math.random() - 0.5) * CELL * 0.6;
  }
  minesLeft = config.mines;
  recomputeNumbers();
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
  // overlay that the falling / resting mines live on (out of grid flow)
  gravityLayer = document.createElement("div");
  gravityLayer.id = "gravity-layer";
  boardEl.appendChild(gravityLayer);
  updateCounters();
}

function formatNumber(v) {
  if (v < 0.05) return "";
  const rounded = Math.round(v);
  if (Math.abs(v - rounded) < 0.05) return String(rounded);
  return v.toFixed(1);
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
  const label = formatNumber(cell.number);
  if (label) {
    button.textContent = label;
    button.dataset.value = Math.round(cell.number); // colour by nearest int
  }
}

function repaintAll() {
  for (const cells of grid) {
    for (const cell of cells) paintCell(cell);
  }
}

function updateCounters() {
  mineCounterEl.textContent = String(Math.max(0, minesLeft)).padStart(3, "0");
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

function onLeftClick(cell) {
  if (gameOver || cell.flagged || cell.revealed) return;
  if (!minesPlaced) {
    placeMines(cell);
    startTimer();
  }
  reveal(cell);
}

function onRightClick(cell) {
  if (gameOver || cell.revealed) return;
  if (!minesPlaced) return; // nothing to drop before the first click
  if (cell.mine) {
    dropMine(cell); // 🪐 a flagged mine falls out of the board
    return;
  }
  // wrong guess — just a (harmless) flag
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  paintCell(cell);
}

function dropMine(cell) {
  cell.mine = false;
  cell.flagged = false;
  cell.revealed = true; // the cell it left opens up — the mine has left it
  const start = cellCenter(cell);

  // 🪐 it might NOT reach the floor: it slips behind a random covered tile
  // further down, becomes a hidden mine again and bumps the numbers there.
  const below = [];
  for (const cells of grid) {
    for (const c of cells) {
      if (c.row > cell.row && !c.revealed && !c.mine) below.push(c);
    }
  }
  if (below.length && Math.random() < REHIDE_CHANCE) {
    const hideCell = below[Math.floor(Math.random() * below.length)];
    hideCell.mine = true; // relocated, NOT removed — minesLeft stays the same
    const hc = cellCenter(hideCell);
    hideCell.mineX = hc.x + (Math.random() - 0.5) * CELL * 0.6;
    hideCell.mineY = hc.y + (Math.random() - 0.5) * CELL * 0.6;
    spawnFallingDot(start.x, start.y, hc.x, hc.y, true);
  } else {
    // reaches the floor and joins the graveyard — defused for good
    minesLeft--;
    const boardW = config.cols * CELL;
    const boardH = config.rows * CELL;
    const restX = Math.max(9, Math.min(boardW - 9, start.x + (Math.random() - 0.5) * CELL));
    const restY = boardH - 10 - Math.random() * 6;
    fallenMines.push({ x: restX, y: restY });
    spawnFallingDot(start.x, start.y, restX, restY, false);
  }

  recomputeNumbers();
  repaintAll();
  updateCounters();
  checkWin();
}

function spawnFallingDot(sx, sy, rx, ry, hide) {
  const dot = document.createElement("div");
  dot.className = "mine-dot falling";
  dot.textContent = "💣";
  dot.style.left = sx + "px";
  dot.style.top = sy + "px";
  gravityLayer.appendChild(dot);
  void dot.offsetWidth; // force reflow so the transition runs from the start
  dot.style.left = rx + "px";
  dot.style.top = ry + "px";
  dot.addEventListener(
    "transitionend",
    () => {
      if (hide) {
        dot.remove(); // slipped behind a tile — hidden again
      } else {
        dot.classList.remove("falling"); // rests in the graveyard
      }
    },
    { once: true }
  );
}

function reveal(cell) {
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  paintCell(cell);
  if (cell.mine) {
    loseGame();
    return;
  }
  if (cell.number < 0.05) {
    for (const neighbour of neighbours(cell)) reveal(neighbour);
  }
  checkWin();
}

function checkWin() {
  if (gameOver) return;
  for (const cells of grid) {
    for (const cell of cells) {
      if (!cell.revealed && !cell.mine) return; // safe cells still to open
    }
  }
  winGame();
}

function loseGame() {
  gameOver = true;
  stopTimer();
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mine) {
        cell.revealed = true;
        paintCell(cell);
      }
    }
  }
  resetButton.textContent = "😵";
}

function winGame() {
  gameOver = true;
  stopTimer();
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mine) {
        cell.flagged = true;
        paintCell(cell);
      }
    }
  }
  resetButton.textContent = "😎";
}

function newGame() {
  config = PRESETS[difficultyEl.value];
  minesPlaced = false;
  gameOver = false;
  flagsPlaced = 0;
  minesLeft = config.mines;
  secondsElapsed = 0;
  fallenMines = [];
  stopTimer();
  resetButton.textContent = "🙂";
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
