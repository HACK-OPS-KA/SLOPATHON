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
const captchaModal = document.getElementById("captcha-modal");
const captchaCard = captchaModal.querySelector(".captcha-card");
const captchaReasonEl = document.getElementById("captcha-reason");
const captchaFormEl = document.getElementById("captcha-form");
const captchaImageEl = document.getElementById("captcha-image");
const captchaInputEl = document.getElementById("captcha-input");
const captchaSubmitEl = document.getElementById("captcha-submit");
const captchaRefreshEl = document.getElementById("captcha-refresh");
const captchaStatusEl = document.getElementById("captcha-status");
const captchaNumberEl = document.getElementById("captcha-number");

let config = PRESETS.beginner;
let grid = [];
let minesPlaced = false;
let gameOver = false;
let flagsPlaced = 0;
let revealedCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let pendingCaptchaAction = null;
let captchaCount = 0;
let captchaAnswer = "";

const CAPTCHA_REASONS = {
  reveal: "Suspicious activity detected: trying to reveal a square.",
  flag: "Suspicious activity detected: right-clicking with intent to flag.",
  reset: "Suspicious activity detected: attempting to feel alive again.",
  difficulty: "Suspicious activity detected: changing the difficulty.",
  navigation: "Suspicious activity detected: trying to leave this page.",
  click: "Suspicious activity detected: clicking literally anything.",
  middle: "Suspicious activity detected: an advanced middle-click maneuver.",
};

function randomNumber(maximum) {
  if (window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] % maximum;
  }
  return Math.floor(Math.random() * maximum);
}

function loadFreshCaptcha() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const colors = ["#e50046", "#0057d9", "#087f23", "#8100b8", "#c24d00"];
  captchaAnswer = "";
  const letters = [];
  const noise = [];

  for (let index = 0; index < 5; index++) {
    const character = characters[randomNumber(characters.length)];
    captchaAnswer += character;
    const x = 34 + index * 56 + randomNumber(9);
    const y = 58 + randomNumber(17) - 8;
    const rotation = randomNumber(39) - 19;
    const color = colors[randomNumber(colors.length)];
    letters.push(
      `<text x="${x}" y="${y}" fill="${color}" transform="rotate(${rotation} ${x} ${y})">${character}</text>`,
    );
  }

  for (let index = 0; index < 9; index++) {
    const startY = randomNumber(90);
    const middleY = randomNumber(90);
    const endY = randomNumber(90);
    const color = colors[randomNumber(colors.length)];
    noise.push(
      `<path d="M0 ${startY} Q150 ${middleY} 300 ${endY}" stroke="${color}" stroke-width="${1 + randomNumber(3)}" fill="none" opacity=".7"/>`,
    );
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="90" viewBox="0 0 300 90">
      <rect width="300" height="90" fill="#f5f5f5"/>
      ${noise.join("")}
      <g font-family="Courier New, monospace" font-size="50" font-weight="900">
        ${letters.join("")}
      </g>
    </svg>
  `;
  captchaImageEl.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  captchaInputEl.value = "";
  captchaSubmitEl.disabled = false;
  captchaInputEl.focus();
}

function showCaptcha(action, reason = "click") {
  if (!captchaModal.hidden) return;
  pendingCaptchaAction = action;
  captchaCount++;
  captchaNumberEl.textContent = `#${String(captchaCount).padStart(4, "0")}`;
  captchaReasonEl.textContent = CAPTCHA_REASONS[reason] || CAPTCHA_REASONS.click;
  captchaStatusEl.textContent = "generated entirely inside ur browser";
  captchaStatusEl.className = "captcha-status";
  captchaCard.classList.remove("captcha-wrong");
  captchaModal.hidden = false;
  loadFreshCaptcha();
}

captchaFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  captchaSubmitEl.disabled = true;
  captchaStatusEl.textContent = "checking the deeply insecure browser memory...";
  captchaStatusEl.className = "captcha-status";

  const correct = captchaInputEl.value.trim() === captchaAnswer;
  captchaAnswer = "";

  if (correct) {
    const actionToRun = pendingCaptchaAction;
    pendingCaptchaAction = null;
    captchaStatusEl.textContent = "unfortunately correct. click authorized.";
    captchaStatusEl.className = "captcha-status good";
    captchaModal.hidden = true;
    if (actionToRun) actionToRun();
    return;
  }

  captchaStatusEl.textContent = "WRONG. answer destroyed. enjoy a completely new captcha.";
  captchaStatusEl.className = "captcha-status bad";
  captchaCard.classList.remove("captcha-wrong");
  void captchaCard.offsetWidth;
  captchaCard.classList.add("captcha-wrong");
  loadFreshCaptcha();
});

captchaRefreshEl.addEventListener("click", () => {
  captchaStatusEl.textContent = "fine. generating a different illegible disaster.";
  captchaStatusEl.className = "captcha-status";
  loadFreshCaptcha();
});

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
      button.addEventListener("click", () => {
        if (gameOver || cell.flagged) return;
        showCaptcha(() => onLeftClick(cell), "reveal");
      });
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        if (gameOver || cell.revealed) return;
        showCaptcha(() => onRightClick(cell), "flag");
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
