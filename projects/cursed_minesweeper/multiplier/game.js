const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

// ✖️ MULTIPLIER: spawn 3x the usual mines AND let them STACK. a single cell can
// hide 1, 2, 3... as many mines as randomly pile onto it. neighbour numbers add
// up the TOTAL mines around you, so the board gets absolutely cursed.
const MINE_MULTIPLIER = 3;

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const resetButton = document.getElementById("reset");
const difficultyEl = document.getElementById("difficulty");

let config = PRESETS.beginner;
let grid = [];
let minesPlaced = false;
let gameOver = false;
let flagsPlaced = 0;
let revealedCount = 0;
let safeCellsTotal = 0;
let totalMines = 0;
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
        mineCount: 0,
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

function recountNumbers() {
  // a cell's number is the SUM of all mines in its neighbours, not just how
  // many neighbours have a mine — stacks count for their full weight.
  for (const cells of grid) {
    for (const cell of cells) {
      cell.adjacentMines = neighbours(cell).reduce((sum, n) => sum + n.mineCount, 0);
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
  totalMines = config.mines * MINE_MULTIPLIER;
  // NOTE: we never remove a cell from the pool, so the same cell can get hit
  // again and again — that's how a single field ends up with a pile of mines.
  for (let i = 0; i < totalMines; i++) {
    const cell = candidates[Math.floor(Math.random() * candidates.length)];
    cell.mineCount++;
  }
  recountNumbers();
  safeCellsTotal = 0;
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mineCount === 0) safeCellsTotal++;
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
  if (cell.mineCount > 0) {
    // a pile of bombs — show how many are stacked in this one cell
    button.textContent = cell.mineCount > 1 ? "💣×" + cell.mineCount : "💣";
    return;
  }
  if (cell.adjacentMines > 0) {
    button.textContent = cell.adjacentMines;
    // colours only defined for 1-8; bigger numbers just fall back to black
    button.dataset.value = cell.adjacentMines;
  }
}

function updateCounters() {
  mineCounterEl.textContent = String(totalMines - flagsPlaced).padStart(3, "0");
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
  if (gameOver || cell.flagged) return;
  if (!minesPlaced) {
    placeMines(cell);
    startTimer();
  }
  if (cell.revealed) {
    chord(cell);
    return;
  }
  reveal(cell);
}

function onRightClick(cell) {
  if (gameOver || cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  paintCell(cell);
  updateCounters();
}

function reveal(cell) {
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  paintCell(cell);
  if (cell.mineCount > 0) {
    loseGame();
    return;
  }
  revealedCount++;
  if (cell.adjacentMines === 0) {
    for (const neighbour of neighbours(cell)) reveal(neighbour);
  }
  checkWin();
}

function chord(cell) {
  if (cell.adjacentMines === 0) return;
  const around = neighbours(cell);
  const flaggedCount = around.filter((n) => n.flagged).length;
  if (flaggedCount !== cell.adjacentMines) return;
  for (const neighbour of around) reveal(neighbour);
}

function checkWin() {
  if (gameOver) return;
  // you win by revealing every mine-free cell (their count varies because
  // mines stack, so we measure it after placement instead of rows*cols-mines).
  if (revealedCount === safeCellsTotal) winGame();
}

function loseGame() {
  gameOver = true;
  stopTimer();
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mineCount > 0) {
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
      if (cell.mineCount > 0 && !cell.flagged) {
        cell.flagged = true;
        flagsPlaced++;
        paintCell(cell);
      }
    }
  }
  updateCounters();
  resetButton.textContent = "😎";
}

function newGame() {
  config = PRESETS[difficultyEl.value];
  minesPlaced = false;
  gameOver = false;
  flagsPlaced = 0;
  revealedCount = 0;
  secondsElapsed = 0;
  totalMines = config.mines * MINE_MULTIPLIER;
  safeCellsTotal = 0;
  stopTimer();
  resetButton.textContent = "🙂";
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
