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
const adBreakEl = document.getElementById("ad-break");
const adNumberEl = document.getElementById("ad-number");
const adNameEl = document.getElementById("ad-name");
const adImageEl = document.getElementById("ad-image");
const skipAdButton = document.getElementById("skip-ad");

const IMAGE_ADS = [
  {
    image: "assets/ads/bomb-b-gone.png",
    name: "BOMB-B-GONE — Mines Hate This One Weird Spray",
  },
  {
    image: "assets/ads/left-sock-pro.png",
    name: "LEFT SOCK PRO — Subscribe to Your Other Sock",
  },
  {
    image: "assets/ads/crunch-dust.png",
    name: "CRUNCH DUST — The Snack That Is Mostly Seasoning",
  },
  {
    image: "assets/ads/toaster-vpn.png",
    name: "TOASTER VPN — Encrypt Your Breakfast",
  },
];

let config = PRESETS.beginner;
let grid = [];
let minesPlaced = false;
let gameOver = false;
let flagsPlaced = 0;
let revealedCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let movesSinceAd = 0;
let movesUntilAd = randomAdInterval();
let adPlaying = false;
let adCount = 0;
let currentAd = null;
let skipCountdown = null;
let skipSeconds = 8;
let resumeTimerAfterAd = false;

function randomAdInterval() {
  return 2 + Math.floor(Math.random() * 2);
}

function unlockSkipButton() {
  window.clearInterval(skipCountdown);
  skipCountdown = null;
  skipAdButton.disabled = false;
  skipAdButton.textContent = "SKIP THIS MASTERPIECE";
}

function showAd() {
  if (adPlaying || gameOver) return;
  adPlaying = true;
  adCount++;
  currentAd = IMAGE_ADS[Math.floor(Math.random() * IMAGE_ADS.length)];
  resumeTimerAfterAd = timerInterval !== null;
  if (resumeTimerAfterAd) stopTimer();

  adNumberEl.textContent = `AD #${adCount}`;
  adNameEl.textContent = currentAd.name;
  adImageEl.src = currentAd.image;
  adImageEl.alt = currentAd.name;
  adBreakEl.hidden = false;
  skipSeconds = 8;
  skipAdButton.disabled = true;
  skipAdButton.textContent = `SKIP IN ${skipSeconds}`;

  skipCountdown = window.setInterval(() => {
    skipSeconds--;
    skipAdButton.textContent = `SKIP IN ${skipSeconds}`;
    if (skipSeconds <= 0) unlockSkipButton();
  }, 1000);

}

function closeAd() {
  if (!adPlaying) return;
  adPlaying = false;
  adBreakEl.hidden = true;
  unlockSkipButton();
  movesSinceAd = 0;
  movesUntilAd = randomAdInterval();
  if (resumeTimerAfterAd && !gameOver) startTimer();
  resumeTimerAfterAd = false;
}

function recordMove() {
  if (gameOver) return;
  movesSinceAd++;
  if (movesSinceAd >= movesUntilAd) showAd();
}

skipAdButton.addEventListener("click", closeAd);

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
  if (gameOver || adPlaying || cell.flagged) return;
  if (!minesPlaced) {
    placeMines(cell);
    startTimer();
  }
  if (cell.revealed) {
    if (chord(cell) && !gameOver) recordMove();
    return;
  }
  if (reveal(cell) && !gameOver) recordMove();
}

function onRightClick(cell) {
  if (gameOver || adPlaying || cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  paintCell(cell);
  updateCounters();
  recordMove();
}

function reveal(cell) {
  if (cell.revealed || cell.flagged) return false;
  cell.revealed = true;
  paintCell(cell);
  if (cell.mine) {
    loseGame();
    return true;
  }
  revealedCount++;
  if (cell.adjacentMines === 0) {
    for (const neighbour of neighbours(cell)) reveal(neighbour);
  }
  checkWin();
  return true;
}

function chord(cell) {
  if (cell.adjacentMines === 0) return false;
  const around = neighbours(cell);
  const flaggedCount = around.filter((n) => n.flagged).length;
  const targets = around.filter((n) => !n.revealed && !n.flagged);
  if (flaggedCount !== cell.adjacentMines || targets.length === 0) return false;
  for (const neighbour of targets) {
    reveal(neighbour);
    if (gameOver) break;
  }
  return true;
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
  movesSinceAd = 0;
  movesUntilAd = randomAdInterval();
  if (adPlaying) closeAd();
  stopTimer();
  resetButton.textContent = "🙂";
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
