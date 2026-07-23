const PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

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

const anxietyOverlay = document.getElementById("anxiety-overlay");
const anxietyYes = document.getElementById("anxiety-yes");
const anxietyNo = document.getElementById("anxiety-no");

let pendingCell = null;

function doReveal(cell) {
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

const DODGE_RADIUS = 130;
const EDGE_MARGIN = 8;
const anxietyButtons = anxietyNo.parentElement;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function placeYesFixed(left, top) {
  if (anxietyYes.parentElement !== document.body) {
    document.body.appendChild(anxietyYes);
  }
  const btnRect = anxietyYes.getBoundingClientRect();
  const maxLeft = window.innerWidth - btnRect.width - EDGE_MARGIN;
  const maxTop = window.innerHeight - btnRect.height - EDGE_MARGIN;
  anxietyYes.style.position = "fixed";
  anxietyYes.style.left = `${clamp(left, EDGE_MARGIN, maxLeft)}px`;
  anxietyYes.style.top = `${clamp(top, EDGE_MARGIN, maxTop)}px`;
}

function openAnxiety(cell) {
  pendingCell = cell;
  anxietyButtons.insertBefore(anxietyYes, anxietyNo);
  anxietyYes.style.position = "static";
  anxietyYes.style.left = "";
  anxietyYes.style.top = "";
  anxietyOverlay.hidden = false;
}

function closeAnxiety() {
  anxietyOverlay.hidden = true;
  pendingCell = null;
  anxietyButtons.insertBefore(anxietyYes, anxietyNo);
  anxietyYes.style.position = "static";
  anxietyYes.style.left = "";
  anxietyYes.style.top = "";
}

function dodgeFrom(pointerX, pointerY) {
  const btnRect = anxietyYes.getBoundingClientRect();
  const centerX = btnRect.left + btnRect.width / 2;
  const centerY = btnRect.top + btnRect.height / 2;
  let dx = centerX - pointerX;
  let dy = centerY - pointerY;
  const dist = Math.hypot(dx, dy);
  if (dist > DODGE_RADIUS) return;
  if (dist < 0.001) {
    dx = Math.random() - 0.5;
    dy = Math.random() - 0.5;
  }
  const push = DODGE_RADIUS - dist + 40;
  const norm = Math.hypot(dx, dy) || 1;
  let nextLeft = btnRect.left + (dx / norm) * push;
  let nextTop = btnRect.top + (dy / norm) * push;

  const maxLeft = window.innerWidth - btnRect.width - EDGE_MARGIN;
  const maxTop = window.innerHeight - btnRect.height - EDGE_MARGIN;
  if (nextLeft <= EDGE_MARGIN || nextLeft >= maxLeft) {
    nextLeft = clamp(pointerX < window.innerWidth / 2 ? maxLeft : EDGE_MARGIN, EDGE_MARGIN, maxLeft);
  }
  if (nextTop <= EDGE_MARGIN || nextTop >= maxTop) {
    nextTop = clamp(pointerY < window.innerHeight / 2 ? maxTop : EDGE_MARGIN, EDGE_MARGIN, maxTop);
  }
  placeYesFixed(nextLeft, nextTop);
}

document.addEventListener("mousemove", (event) => {
  if (anxietyOverlay.hidden) return;
  dodgeFrom(event.clientX, event.clientY);
});

anxietyYes.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  dodgeFrom(event.clientX, event.clientY);
});
anxietyYes.addEventListener("click", (event) => event.preventDefault());

anxietyNo.addEventListener("click", closeAnxiety);

function onLeftClick(cell) {
  if (gameOver || cell.flagged) return;
  if (cell.revealed) {
    openAnxiety(cell);
    return;
  }
  openAnxiety(cell);
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

function chord(cell) {
  if (cell.adjacentMines === 0) return;
  const around = neighbours(cell);
  const flaggedCount = around.filter((n) => n.flagged).length;
  if (flaggedCount !== cell.adjacentMines) return;
  for (const neighbour of around) reveal(neighbour);
}

function checkWin() {
  if (gameOver) return;
  const safeCells = config.rows * config.cols - config.mines;
  if (revealedCount === safeCells) winGame();
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
      if (cell.mine && !cell.flagged) {
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
  stopTimer();
  resetButton.textContent = "🙂";
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
