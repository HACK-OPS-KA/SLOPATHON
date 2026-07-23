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
  config = { ...PRESETS[difficultyEl.value] };
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

const lootboxBuyEl = document.getElementById("lootbox-buy");
const lootboxOverlayEl = document.getElementById("lootbox-overlay");
const lootboxCrateEl = document.getElementById("lootbox-crate");
const lootboxPrizeEl = document.getElementById("lootbox-prize");
const lootboxRarityEl = document.getElementById("lootbox-rarity");
const lootboxPrizeIconEl = document.getElementById("lootbox-prize-icon");
const lootboxPrizeTitleEl = document.getElementById("lootbox-prize-title");
const lootboxPrizeDescEl = document.getElementById("lootbox-prize-desc");
const lootboxClaimEl = document.getElementById("lootbox-claim");

function ensureMinesPlaced() {
  if (minesPlaced) return;
  const all = grid.flat();
  const seed = all[Math.floor(Math.random() * all.length)];
  placeMines(seed);
  startTimer();
}

function emptyUnrevealedCells() {
  return grid.flat().filter((c) => !c.mine && !c.revealed);
}

function mineCells() {
  return grid.flat().filter((c) => c.mine);
}

function recomputeAdjacency() {
  for (const cell of grid.flat()) {
    cell.adjacentMines = neighbours(cell).filter((n) => n.mine).length;
  }
}

function repaintAll() {
  for (const cell of grid.flat()) paintCell(cell);
}

function addBombs(count) {
  if (gameOver) return;
  ensureMinesPlaced();
  const candidates = emptyUnrevealedCells();
  const placed = Math.min(count, candidates.length);
  for (let i = 0; i < placed; i++) {
    const index = Math.floor(Math.random() * candidates.length);
    const [cell] = candidates.splice(index, 1);
    cell.mine = true;
    config.mines++;
  }
  recomputeAdjacency();
  repaintAll();
  updateCounters();
}

function removeBombs(count) {
  if (gameOver) return;
  ensureMinesPlaced();
  const candidates = mineCells();
  const removed = Math.min(count, candidates.length);
  for (let i = 0; i < removed; i++) {
    const index = Math.floor(Math.random() * candidates.length);
    const [cell] = candidates.splice(index, 1);
    cell.mine = false;
    config.mines--;
  }
  recomputeAdjacency();
  repaintAll();
  updateCounters();
  checkWin();
}

function revealSafeTile() {
  if (gameOver) return;
  ensureMinesPlaced();
  const candidates = emptyUnrevealedCells();
  if (candidates.length === 0) return;
  const cell = candidates[Math.floor(Math.random() * candidates.length)];
  cell.flagged = false;
  reveal(cell);
}

function defuseEverything() {
  if (gameOver) return;
  ensureMinesPlaced();
  for (const cell of grid.flat()) {
    cell.mine = false;
    cell.flagged = false;
    if (!cell.revealed) {
      cell.revealed = true;
      revealedCount++;
    }
  }
  config.mines = 0;
  flagsPlaced = 0;
  recomputeAdjacency();
  repaintAll();
  updateCounters();
  winGame();
}

const LOOTBOX_PRIZES = [
  { weight: 25, rarity: "common", icon: "💣", title: "+3 BOMBS", desc: "surprise! the house always wins", apply: () => addBombs(3) },
  { weight: 25, rarity: "common", icon: "🧯", title: "-3 BOMBS", desc: "three bombs vanish into thin air", apply: () => removeBombs(3) },
  { weight: 14, rarity: "uncommon", icon: "💣💣", title: "+5 BOMBS", desc: "you gambled and you lost, congrats", apply: () => addBombs(5) },
  { weight: 14, rarity: "uncommon", icon: "🧯🧯", title: "-5 BOMBS", desc: "five bombs deleted. you love to see it", apply: () => removeBombs(5) },
  { weight: 15, rarity: "rare", icon: "🔦", title: "FREE SAFE TILE", desc: "we opened a guaranteed-safe square for you", apply: () => revealSafeTile() },
  { weight: 7, rarity: "legendary", icon: "🕊️", title: "DEFUSE EVERYTHING", desc: "JACKPOT!!! every bomb gone. instant W", apply: () => defuseEverything() },
];

function rollPrize() {
  const total = LOOTBOX_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of LOOTBOX_PRIZES) {
    roll -= prize.weight;
    if (roll < 0) return prize;
  }
  return LOOTBOX_PRIZES[0];
}

let lootboxTimeouts = [];

function openLootbox() {
  lootboxTimeouts.forEach(clearTimeout);
  lootboxTimeouts = [];

  const prize = rollPrize();

  lootboxOverlayEl.hidden = false;
  lootboxCrateEl.hidden = false;
  lootboxCrateEl.classList.remove("opening");
  lootboxPrizeEl.hidden = true;
  void lootboxCrateEl.offsetWidth;

  lootboxTimeouts.push(setTimeout(() => {
    lootboxCrateEl.classList.add("opening");
  }, 1200));

  lootboxTimeouts.push(setTimeout(() => {
    lootboxCrateEl.hidden = true;
    lootboxPrizeEl.className = "lootbox-prize " + prize.rarity;
    lootboxRarityEl.textContent = prize.rarity.toUpperCase();
    lootboxPrizeIconEl.textContent = prize.icon;
    lootboxPrizeTitleEl.textContent = prize.title;
    lootboxPrizeDescEl.textContent = prize.desc;
    lootboxPrizeEl.hidden = false;
    prize.apply();
  }, 1900));
}

function closeLootbox() {
  lootboxTimeouts.forEach(clearTimeout);
  lootboxTimeouts = [];
  lootboxOverlayEl.hidden = true;
}

lootboxBuyEl.addEventListener("click", openLootbox);
lootboxClaimEl.addEventListener("click", closeLootbox);
