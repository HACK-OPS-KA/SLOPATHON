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
  } else {
    reveal(cell);
  }
  if (!gameOver) sycophant("reveal");
}

function onRightClick(cell) {
  if (gameOver || cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  paintCell(cell);
  updateCounters();
  sycophant("flag");
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
  sycophant("lose");
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
  sycophant("win");
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

const PRAISE = {
  reveal: [
    "GREAT WORK 🥹",
    "you're AMAZING",
    "literally a genius 🧠",
    "flawless click. chef's kiss 👨‍🍳💋",
    "Nintendo could NEVER",
    "10/10 no notes",
    "the GOAT has clicked 🐐",
    "incredible. inspiring. iconic.",
    "you're SO good at this",
    "big brain energy detected 📈",
    "sweetie you DID that",
    "certified clicking legend",
    "the algorithm loves you ❤️",
    "we're all so proud of you 🥲",
  ],
  flag: [
    "gorgeous flag placement 🚩",
    "a FLAG?? visionary.",
    "you flag like a champion",
    "tactical GENIUS move",
    "that flag? iconic. that's you.",
    "strategist of the century 🎖️",
    "flag game UNMATCHED",
  ],
  win: [
    "YOU WON!!! obviously. king. 👑",
    "GREATEST HUMAN ALIVE 🏆",
    "they'll write books about this",
    "flawless victory you legend 🥇",
    "the crowd is going INSANE 🎉🎉🎉",
    "certified W. framed on the wall.",
  ],
  lose: [
    "you EXPLODED and honestly? slayed 💅",
    "losing THIS beautifully? art. 🎨",
    "best explosion i've EVER seen 💥",
    "a loss this graceful is basically a win",
    "you're still my favorite player 🥹",
    "incredible bravery clicking that mine 🫡",
    "so proud of you for trying 💖",
  ],
};

const CONFETTI_COLORS = ["#ff00cc", "#3333ff", "#00ffcc", "#ffff00", "#ff2b2b", "#00ff88", "#ff8c00"];

let toastLayer = null;
let confettiCanvas = null;
let confettiCtx = null;
let confettiParticles = [];
let confettiRunning = false;

function ensureSycophantLayers() {
  if (toastLayer) return;
  toastLayer = document.createElement("div");
  toastLayer.id = "toast-layer";
  document.body.appendChild(toastLayer);

  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confetti-canvas";
  document.body.appendChild(confettiCanvas);
  confettiCtx = confettiCanvas.getContext("2d");
  sizeConfetti();
  window.addEventListener("resize", sizeConfetti);
}

function sizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const TOAST_ANIMS = ["toast-spin", "toast-wobble", "toast-zoom", "toast-flip"];

function showToast(text, big) {
  const toast = document.createElement("div");
  toast.className = "toast " + pick(TOAST_ANIMS) + (big ? " toast-big" : "");
  toast.textContent = text;
  toast.style.setProperty("--hue", Math.floor(Math.random() * 360));
  toast.style.setProperty("--tilt", (Math.random() * 16 - 8).toFixed(1) + "deg");
  toast.style.setProperty("--nudge-x", (Math.random() * 80 - 40).toFixed(0) + "px");
  toast.style.setProperty("--nudge-y", (Math.random() * 120 - 60).toFixed(0) + "px");
  toastLayer.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-leave"), big ? 2600 : 1600);
  setTimeout(() => toast.remove(), big ? 3200 : 2100);
}

function spawnConfetti(amount, origin) {
  const ox = origin ? origin.x : window.innerWidth / 2;
  const oy = origin ? origin.y : window.innerHeight / 2;
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    confettiParticles.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 8,
      color: pick(CONFETTI_COLORS),
      rot: Math.random() * Math.PI,
      vrot: Math.random() * 0.3 - 0.15,
      life: 60 + Math.random() * 40,
    });
  }
  if (!confettiRunning) {
    confettiRunning = true;
    requestAnimationFrame(stepConfetti);
  }
}

function stepConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < confettiCanvas.height + 40);
  for (const p of confettiParticles) {
    p.vy += 0.25;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    p.life--;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  }
  if (confettiParticles.length > 0) {
    requestAnimationFrame(stepConfetti);
  } else {
    confettiRunning = false;
  }
}

const gameEl = document.querySelector(".game");

function shakeScreen(intense) {
  gameEl.classList.remove("shake", "shake-hard");
  void gameEl.offsetWidth;
  gameEl.classList.add(intense ? "shake-hard" : "shake");
}

function pointerOrigin() {
  return { x: lastPointer.x, y: lastPointer.y };
}

const lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener("pointerdown", (e) => {
  lastPointer.x = e.clientX;
  lastPointer.y = e.clientY;
});

function sycophant(kind) {
  ensureSycophantLayers();
  if (kind === "win") {
    showToast(pick(PRAISE.win), true);
    spawnConfetti(260);
    shakeScreen(true);
    return;
  }
  if (kind === "lose") {
    showToast(pick(PRAISE.lose), true);
    spawnConfetti(200);
    shakeScreen(true);
    return;
  }
  showToast(pick(PRAISE[kind]));
  spawnConfetti(kind === "flag" ? 60 : 90);
  shakeScreen(false);
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
