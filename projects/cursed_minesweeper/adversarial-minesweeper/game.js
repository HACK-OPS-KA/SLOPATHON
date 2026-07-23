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
const battlePanelEl = document.getElementById("battle-panel");
const turnLightEl = document.getElementById("turn-light");
const turnTitleEl = document.getElementById("turn-title");
const battleStatusEl = document.getElementById("battle-status");
const turnCountEl = document.getElementById("turn-count");

let config = PRESETS.beginner;
let grid = [];
let minesPlaced = false;
let gameOver = false;
let flagsPlaced = 0;
let revealedCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let botThinking = false;
let botTimer = null;
let turnNumber = 0;

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
        attackedByBot: false,
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
  button.classList.toggle("bot-miss", cell.revealed && cell.attackedByBot && !cell.mine);
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
  if (gameOver || botThinking || cell.flagged) return;
  if (!minesPlaced) {
    placeMines(cell);
    startTimer();
  }
  let acted = false;
  if (cell.revealed) {
    acted = chord(cell);
  } else {
    acted = reveal(cell, "player");
  }
  if (acted && !gameOver) beginBotTurn();
}

function onRightClick(cell) {
  if (gameOver || botThinking || cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  paintCell(cell);
  updateCounters();
  if (minesPlaced) beginBotTurn();
}

function reveal(cell, actor = "player") {
  if (cell.revealed || cell.flagged) return false;
  cell.revealed = true;
  paintCell(cell);
  if (cell.mine) {
    if (actor === "bot") {
      botWins(cell);
    } else {
      loseGame();
    }
    return true;
  }
  revealedCount++;
  if (cell.adjacentMines === 0) {
    for (const neighbour of neighbours(cell)) reveal(neighbour, actor);
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
    reveal(neighbour, "player");
    if (gameOver) break;
  }
  return true;
}

function setBattleStatus(title, message, mode) {
  turnTitleEl.textContent = title;
  battleStatusEl.textContent = message;
  turnLightEl.className = `turn-light ${mode}`;
  battlePanelEl.className = `battle-panel ${mode}`;
}

function mineProbability(cell) {
  let bestProbability = 0;
  let evidence = 0;

  for (const neighbour of neighbours(cell)) {
    if (!neighbour.revealed || neighbour.mine || neighbour.adjacentMines === 0) continue;
    const around = neighbours(neighbour);
    const knownFlags = around.filter((nearby) => nearby.flagged).length;
    const unknown = around.filter((nearby) => !nearby.revealed && !nearby.flagged);
    if (!unknown.includes(cell) || unknown.length === 0) continue;
    const remainingMines = Math.max(0, neighbour.adjacentMines - knownFlags);
    bestProbability = Math.max(bestProbability, remainingMines / unknown.length);
    evidence++;
  }

  return bestProbability * 100 + evidence * 2 + Math.random();
}

function chooseBotTarget() {
  const candidates = [];
  for (const cells of grid) {
    for (const cell of cells) {
      if (!cell.revealed && !cell.flagged) candidates.push(cell);
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function beginBotTurn() {
  if (gameOver) return;
  botThinking = true;
  turnNumber++;
  turnCountEl.textContent = `TURN ${turnNumber}`;
  boardEl.classList.add("bot-turn");
  setBattleStatus("BOT TURN", "The machine is guessing wildly with zero strategy...", "bot");

  botTimer = window.setTimeout(() => {
    const target = chooseBotTarget();
    if (!target) {
      botThinking = false;
      boardEl.classList.remove("bot-turn");
      checkWin();
      if (!gameOver) {
        setBattleStatus(
          "YOUR TURN",
          "Every covered square is flagged, so the bot has no legal target.",
          "player",
        );
      }
      return;
    }

    target.element.classList.add("bot-target");
    battleStatusEl.textContent = `Bot attacks row ${target.row + 1}, column ${target.col + 1}!`;

    botTimer = window.setTimeout(() => {
      target.element.classList.remove("bot-target");
      target.attackedByBot = true;
      reveal(target, "bot");
      botThinking = false;
      boardEl.classList.remove("bot-turn");

      if (!gameOver) {
        setBattleStatus(
          "YOUR TURN",
          "The bot missed. Make a move before it develops object permanence.",
          "player",
        );
      }
    }, 650);
  }, 700);
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
  setBattleStatus("BOT WINS", "You clicked a mine. The machine accepts this victory.", "lost");
}

function botWins(cell) {
  gameOver = true;
  stopTimer();
  for (const cells of grid) {
    for (const boardCell of cells) {
      if (boardCell.mine) {
        boardCell.revealed = true;
        paintCell(boardCell);
      }
    }
  }
  cell.element.classList.add("bot-hit");
  resetButton.textContent = "🤖";
  setBattleStatus(
    "BOT WINS",
    `The bot found a mine at row ${cell.row + 1}, column ${cell.col + 1}. Humanity is over.`,
    "lost",
  );
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
  setBattleStatus("YOU WIN", "Every safe square is open. The bot has been publicly owned.", "won");
}

function newGame() {
  config = PRESETS[difficultyEl.value];
  minesPlaced = false;
  gameOver = false;
  flagsPlaced = 0;
  revealedCount = 0;
  secondsElapsed = 0;
  botThinking = false;
  turnNumber = 0;
  window.clearTimeout(botTimer);
  botTimer = null;
  stopTimer();
  resetButton.textContent = "🙂";
  turnCountEl.textContent = "TURN 0";
  setBattleStatus("YOUR TURN", "Reveal a square to begin the battle.", "player");
  boardEl.classList.remove("bot-turn");
  createGrid();
  renderBoard();
}

resetButton.addEventListener("click", newGame);
difficultyEl.addEventListener("change", newGame);

newGame();
