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

let snake = [];
let dir = { dr: 0, dc: 1 };
let dirName = "right";
let fruit = null;
let score = 0;
let paused = true;
let tickInterval = null;
const TICK_MS = 170;

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
      button.tabIndex = -1;
      const glyph = document.createElement("span");
      glyph.className = "glyph";
      button.appendChild(glyph);
      cell.element = button;
      cell.glyphEl = glyph;
      boardEl.appendChild(button);
    }
  }
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

function key(pos) {
  return pos.row + "," + pos.col;
}

function randomCell() {
  const r = Math.floor(Math.random() * config.rows);
  const c = Math.floor(Math.random() * config.cols);
  return grid[r][c];
}

function spawnFruit() {
  const occupied = new Set(snake.map(key));
  const candidates = [];
  for (const cells of grid) {
    for (const cell of cells) {
      if (!cell.mine && !occupied.has(key(cell))) candidates.push(cell);
    }
  }
  if (!candidates.length) {
    fruit = null;
    return;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  fruit = { row: pick.row, col: pick.col };
}

function revealArea(startCell) {
  const stack = [startCell];
  while (stack.length) {
    const cell = stack.pop();
    if (cell.revealed) continue;
    cell.revealed = true;
    if (cell.adjacentMines === 0 && !cell.mine) {
      for (const neighbour of neighbours(cell)) {
        if (!neighbour.revealed && !neighbour.mine) stack.push(neighbour);
      }
    }
  }
}

function render() {
  const snakeCells = new Set(snake.map(key));
  const headKey = snake.length ? key(snake[0]) : null;
  for (const cells of grid) {
    for (const cell of cells) {
      const el = cell.element;
      el.className = "cell";
      delete el.dataset.dir;
      let glyph = "";
      let value = "";
      if (cell.revealed) {
        el.classList.add("revealed");
        if (cell.mine) {
          glyph = "💣";
        } else if (cell.adjacentMines > 0) {
          glyph = String(cell.adjacentMines);
          value = String(cell.adjacentMines);
        }
      }
      if (cell.exploded) glyph = "💥";
      if (fruit && cell.row === fruit.row && cell.col === fruit.col) glyph = "🍎";
      const cellKey = key(cell);
      if (snakeCells.has(cellKey)) {
        el.classList.add("snake");
        if (cellKey === headKey) {
          el.classList.add("snake-head");
          el.dataset.dir = dirName;
        }
      }
      el.dataset.value = value;
      cell.glyphEl.textContent = glyph;
    }
  }
}

function updateHud() {
  mineCounterEl.textContent = String(score).padStart(3, "0");
  const head = snake[0];
  const headCell = head ? grid[head.row][head.col] : null;
  const nearby =
    headCell && headCell.revealed && !headCell.mine ? headCell.adjacentMines : 0;
  timerEl.textContent = String(nearby).padStart(3, "0");
}

function die() {
  gameOver = true;
  clearInterval(tickInterval);
  tickInterval = null;
  for (const cells of grid) {
    for (const cell of cells) {
      if (cell.mine) cell.revealed = true;
    }
  }
  resetButton.textContent = "😵";
  render();
  updateHud();
}

function step() {
  const head = snake[0];
  const nr = (head.row + dir.dr + config.rows) % config.rows;
  const nc = (head.col + dir.dc + config.cols) % config.cols;
  const target = grid[nr][nc];
  const growing = fruit && nr === fruit.row && nc === fruit.col;
  const body = growing ? snake : snake.slice(0, snake.length - 1);
  const hitsSelf = body.some((s) => s.row === nr && s.col === nc);

  if (target.mine) {
    target.revealed = true;
    target.exploded = true;
    die();
    return;
  }
  if (hitsSelf) {
    die();
    return;
  }

  snake.unshift({ row: nr, col: nc });
  revealArea(target);
  if (growing) {
    score++;
    spawnFruit();
  } else {
    snake.pop();
  }
  render();
  updateHud();
}

function startLoop() {
  clearInterval(tickInterval);
  tickInterval = setInterval(step, TICK_MS);
}

function newGame() {
  config = PRESETS[difficultyEl.value];
  clearInterval(tickInterval);
  tickInterval = null;
  gameOver = false;
  paused = true;
  score = 0;
  dir = { dr: 0, dc: 1 };
  dirName = "right";
  createGrid();
  renderBoard();
  const start = randomCell();
  placeMines(start);
  snake = [{ row: start.row, col: start.col }];
  revealArea(start);
  spawnFruit();
  resetButton.textContent = "🙂";
  render();
  updateHud();
}

const DIRS = {
  ArrowUp: { dr: -1, dc: 0, name: "up" },
  ArrowDown: { dr: 1, dc: 0, name: "down" },
  ArrowLeft: { dr: 0, dc: -1, name: "left" },
  ArrowRight: { dr: 0, dc: 1, name: "right" },
  w: { dr: -1, dc: 0, name: "up" },
  s: { dr: 1, dc: 0, name: "down" },
  a: { dr: 0, dc: -1, name: "left" },
  d: { dr: 0, dc: 1, name: "right" },
};

document.addEventListener("keydown", (event) => {
  const next = DIRS[event.key];
  if (!next) return;
  event.preventDefault();
  if (gameOver) return;
  if (snake.length > 1 && next.dr === -dir.dr && next.dc === -dir.dc) return;
  dir = { dr: next.dr, dc: next.dc };
  dirName = next.name;
  if (paused) {
    paused = false;
    startLoop();
  }
});

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
