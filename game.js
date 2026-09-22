// ============================================================
// MINESWEEPER: DEATH FIELD
// CAMPAIGN 10 LEVELS
// ============================================================

const PUZZLE_IMAGE = "img/tan.jpg";

const LEVELS = [
  {
    level: 1,
    name: "TÂN BINH",
    rows: 9,
    cols: 9,
    mines: 10,
    stars: 1,
    target3: 45,
    target2: 90,
  },
  {
    level: 2,
    name: "BÃI MÌN",
    rows: 10,
    cols: 10,
    mines: 15,
    stars: 1,
    target3: 65,
    target2: 120,
  },
  {
    level: 3,
    name: "NGUY HIỂM",
    rows: 11,
    cols: 11,
    mines: 22,
    stars: 2,
    target3: 85,
    target2: 150,
  },
  {
    level: 4,
    name: "MÊ CUNG",
    rows: 12,
    cols: 12,
    mines: 30,
    stars: 2,
    target3: 110,
    target2: 190,
  },
  {
    level: 5,
    name: "ÁC MỘNG",
    rows: 13,
    cols: 13,
    mines: 40,
    stars: 3,
    target3: 140,
    target2: 230,
  },
  {
    level: 6,
    name: "TỬ ĐỊA",
    rows: 14,
    cols: 14,
    mines: 50,
    stars: 3,
    target3: 175,
    target2: 280,
  },
  {
    level: 7,
    name: "ĐỊA NGỤC",
    rows: 15,
    cols: 15,
    mines: 62,
    stars: 4,
    target3: 210,
    target2: 330,
  },
  {
    level: 8,
    name: "TUYỆT VỌNG",
    rows: 16,
    cols: 16,
    mines: 75,
    stars: 4,
    target3: 250,
    target2: 390,
  },
  {
    level: 9,
    name: "DEATH FIELD",
    rows: 18,
    cols: 18,
    mines: 95,
    stars: 5,
    target3: 310,
    target2: 470,
  },
  {
    level: 10,
    name: "FINAL BOSS",
    rows: 20,
    cols: 20,
    mines: 125,
    stars: 5,
    target3: 400,
    target2: 600,
  },
];

const STORAGE_KEY = "deathFieldProgressV1";

let currentLevel = 1;
let unlockedLevel = 1;

let board = [];

let gameOver = false;
let gameWon = false;
let firstClick = true;

let flags = 0;
let seconds = 0;
let timerInterval = null;

let bestTimes = {};
let levelStars = {};

// ============================================================
// HTML
// ============================================================

const boardElement = document.getElementById("board");

const mineCountElement = document.getElementById("mine-count");
const flagCountElement = document.getElementById("flag-count");
const timerElement = document.getElementById("timer");
const bestTimeElement = document.getElementById("best-time");

const levelNumberElement = document.getElementById("level-number");
const levelNameElement = document.getElementById("level-name");
const levelDifficultyElement = document.getElementById("level-difficulty");

const restartButton = document.getElementById("restart-btn");

const toggleLevelsButton = document.getElementById("toggle-levels-btn");

const levelsButton = document.getElementById("levels-btn");

const levelSelector = document.getElementById("level-selector");

const levelButtons = document.querySelectorAll(".level-btn");

// MODAL

const modal = document.getElementById("game-modal");

const modalIcon = document.getElementById("modal-icon");

const modalTitle = document.getElementById("modal-title");

const modalMessage = document.getElementById("modal-message");

const modalStars = document.getElementById("modal-stars");

const modalStats = document.getElementById("modal-stats");

const resultTime = document.getElementById("result-time");

const resultBest = document.getElementById("result-best");

const modalButton = document.getElementById("modal-button");

const nextLevelButton = document.getElementById("next-level-btn");

const modalLevelsButton = document.getElementById("modal-levels-btn");

// ============================================================
// PROGRESS
// ============================================================

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    const data = JSON.parse(saved);

    unlockedLevel = Math.min(10, Math.max(1, Number(data.unlockedLevel) || 1));

    bestTimes = data.bestTimes || {};

    levelStars = data.levelStars || {};
  } catch (error) {
    console.warn("Không đọc được tiến độ:", error);

    unlockedLevel = 1;
    bestTimes = {};
    levelStars = {};
  }
}

function saveProgress() {
  const data = {
    unlockedLevel,
    bestTimes,
    levelStars,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============================================================
// LEVEL HELPERS
// ============================================================

function getLevelData() {
  return LEVELS[currentLevel - 1];
}

function getDifficultyText(levelData) {
  return "⭐".repeat(levelData.stars);
}

// ============================================================
// CELL SIZE
// ============================================================

function calculateCellSize() {
  const level = getLevelData();

  /*
       PC:
       Board nhỏ giữ 48px như game cũ.

       Board lớn tự thu nhỏ để không thành
       một bảng khổng lồ.
    */

  const availableWidth = Math.min(window.innerWidth - 30, 900);

  const maxSizeByScreen = Math.floor((availableWidth - 12) / level.cols);

  let size = Math.min(48, maxSizeByScreen);

  /*
       Không nhỏ quá mức này.
       Nếu màn hình quá nhỏ, wrapper sẽ cuộn.
    */

  size = Math.max(26, size);

  return size;
}

// ============================================================
// CREATE GAME
// ============================================================

function createGame() {
  clearInterval(timerInterval);

  timerInterval = null;

  const level = getLevelData();

  const ROWS = level.rows;

  const COLS = level.cols;

  board = [];

  gameOver = false;
  gameWon = false;
  firstClick = true;

  flags = 0;
  seconds = 0;

  // UI

  mineCountElement.textContent = level.mines;

  flagCountElement.textContent = 0;

  timerElement.textContent = 0;

  levelNumberElement.textContent = level.level;

  levelNameElement.textContent = level.name;

  levelDifficultyElement.textContent = getDifficultyText(level);

  const best = bestTimes[currentLevel];

  bestTimeElement.textContent = best ? `${best}s` : "--";

  // Modal reset

  modal.classList.add("hidden");

  modalStars.classList.add("hidden");

  modalStats.classList.add("hidden");

  nextLevelButton.classList.add("hidden");

  // Board reset

  boardElement.innerHTML = "";

  const cellSize = calculateCellSize();

  document.documentElement.style.setProperty("--cell-size", `${cellSize}px`);

  boardElement.style.gridTemplateColumns = `repeat(${COLS}, ${cellSize}px)`;

  /*
       QUAN TRỌNG:
       Đây là kích thước toàn bộ ảnh ghép.
    */

  const imageWidth = COLS * cellSize;

  const imageHeight = ROWS * cellSize;

  // DATA

  for (let row = 0; row < ROWS; row++) {
    const boardRow = [];

    for (let col = 0; col < COLS; col++) {
      boardRow.push({
        row,
        col,

        mine: false,

        opened: false,

        flagged: false,

        number: 0,

        element: null,
      });
    }

    board.push(boardRow);
  }

  // HTML CELLS

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];

      const div = document.createElement("div");

      div.classList.add("cell");

      // ============================
      // ẢNH GHÉP
      // ============================

      div.style.backgroundImage = `url("${PUZZLE_IMAGE}")`;

      div.style.backgroundSize = `${imageWidth}px ${imageHeight}px`;

      div.style.backgroundPosition = `-${col * cellSize}px -${row * cellSize}px`;

      cell.element = div;

      // CLICK TRÁI

      div.addEventListener("click", function () {
        handleLeftClick(row, col);
      });

      // CLICK PHẢI

      div.addEventListener("contextmenu", function (event) {
        event.preventDefault();

        toggleFlag(row, col);
      });

      boardElement.appendChild(div);
    }
  }

  updateLevelSelector();
}

// ============================================================
// LEFT CLICK
// ============================================================

function handleLeftClick(row, col) {
  if (gameOver || gameWon) {
    return;
  }

  const cell = board[row][col];

  /*
       Nếu click một ô số đã mở,
       thử CHORD.
    */

  if (cell.opened) {
    if (cell.number > 0) {
      chordOpen(row, col);
    }

    return;
  }

  openCell(row, col);
}

// ============================================================
// GENERATE MINES
// ============================================================

function generateMines(safeRow, safeCol) {
  const level = getLevelData();

  const ROWS = level.rows;

  const COLS = level.cols;

  const forbidden = new Set();

  /*
       Click đầu + 8 ô xung quanh
       luôn an toàn.
    */

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = safeRow + dr;

      const col = safeCol + dc;

      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        forbidden.add(`${row},${col}`);
      }
    }
  }

  const possiblePositions = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!forbidden.has(`${row},${col}`)) {
        possiblePositions.push({
          row,
          col,
        });
      }
    }
  }

  shuffleArray(possiblePositions);

  for (let i = 0; i < level.mines; i++) {
    const position = possiblePositions[i];

    board[position.row][position.col].mine = true;
  }

  calculateNumbers();
}

// ============================================================
// SHUFFLE
// ============================================================

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============================================================
// CALCULATE NUMBERS
// ============================================================

function calculateNumbers() {
  const level = getLevelData();

  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const cell = board[row][col];

      if (cell.mine) {
        continue;
      }

      let count = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue;
          }

          const newRow = row + dr;

          const newCol = col + dc;

          if (isInsideBoard(newRow, newCol) && board[newRow][newCol].mine) {
            count++;
          }
        }
      }

      cell.number = count;
    }
  }
}

// ============================================================
// INSIDE BOARD
// ============================================================

function isInsideBoard(row, col) {
  const level = getLevelData();

  return row >= 0 && row < level.rows && col >= 0 && col < level.cols;
}

// ============================================================
// OPEN CELL
// ============================================================

function openCell(row, col) {
  if (gameOver || gameWon || !isInsideBoard(row, col)) {
    return;
  }

  const cell = board[row][col];

  if (cell.flagged || cell.opened) {
    return;
  }

  // FIRST CLICK

  if (firstClick) {
    generateMines(row, col);

    firstClick = false;

    startTimer();
  }

  // MINE

  if (cell.mine) {
    cell.opened = true;

    cell.element.classList.add("opened", "mine");

    cell.element.textContent = "💣";

    loseGame();

    return;
  }

  floodOpen(row, col);

  checkWin();
}

// ============================================================
// FLOOD OPEN
// ============================================================

function floodOpen(row, col) {
  if (!isInsideBoard(row, col)) {
    return;
  }

  const cell = board[row][col];

  if (cell.opened || cell.flagged || cell.mine) {
    return;
  }

  cell.opened = true;

  cell.element.classList.add("opened");

  if (cell.number > 0) {
    cell.element.textContent = cell.number;

    cell.element.dataset.number = cell.number;

    return;
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }

      floodOpen(row + dr, col + dc);
    }
  }
}

// ============================================================
// CHORD OPEN
//
// Click vào số đã mở.
// Nếu số cờ xung quanh = con số,
// tự mở những ô còn lại.
// ============================================================

function chordOpen(row, col) {
  if (gameOver || gameWon || firstClick) {
    return;
  }

  const center = board[row][col];

  if (!center.opened || center.number <= 0) {
    return;
  }

  let nearbyFlags = 0;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }

      const nr = row + dr;

      const nc = col + dc;

      if (isInsideBoard(nr, nc) && board[nr][nc].flagged) {
        nearbyFlags++;
      }
    }
  }

  if (nearbyFlags !== center.number) {
    return;
  }

  /*
       Nếu người chơi cắm cờ sai,
       chord có thể mở trúng mìn.
    */

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }

      const nr = row + dr;

      const nc = col + dc;

      if (!isInsideBoard(nr, nc)) {
        continue;
      }

      const cell = board[nr][nc];

      if (cell.opened || cell.flagged) {
        continue;
      }

      if (cell.mine) {
        cell.opened = true;

        cell.element.classList.add("opened", "mine");

        cell.element.textContent = "💣";

        loseGame();

        return;
      }

      floodOpen(nr, nc);
    }
  }

  checkWin();
}

// ============================================================
// FLAG
// ============================================================

function toggleFlag(row, col) {
  if (gameOver || gameWon || firstClick) {
    return;
  }

  const level = getLevelData();

  const cell = board[row][col];

  if (cell.opened) {
    return;
  }

  if (cell.flagged) {
    cell.flagged = false;

    flags--;

    cell.element.textContent = "";

    cell.element.classList.remove("flagged");
  } else {
    if (flags >= level.mines) {
      return;
    }

    cell.flagged = true;

    flags++;

    cell.element.textContent = "🚩";

    cell.element.classList.add("flagged");
  }

  flagCountElement.textContent = flags;
}

// ============================================================
// TIMER
// ============================================================

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(function () {
    seconds++;

    timerElement.textContent = seconds;
  }, 1000);
}

// ============================================================
// LOSE
// ============================================================

function loseGame() {
  gameOver = true;

  clearInterval(timerInterval);

  revealAllMines();

  setTimeout(function () {
    modalIcon.textContent = "💥";

    modalTitle.textContent = "BOOM!";

    modalStars.classList.add("hidden");

    modalStats.classList.add("hidden");

    modalMessage.textContent = `Bạn sống được ${seconds} giây ở màn ${currentLevel}.`;

    modalButton.textContent = "🔄 THỬ LẠI";

    nextLevelButton.classList.add("hidden");

    modal.classList.remove("hidden");
  }, 450);
}

// ============================================================
// REVEAL MINES
// ============================================================

function revealAllMines() {
  const level = getLevelData();

  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const cell = board[row][col];

      if (cell.mine) {
        cell.element.classList.add("opened", "mine");

        cell.element.textContent = "💣";
      }
    }
  }
}

// ============================================================
// CHECK WIN
// ============================================================

function checkWin() {
  const level = getLevelData();

  let openedSafeCells = 0;

  const totalSafeCells = level.rows * level.cols - level.mines;

  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const cell = board[row][col];

      if (!cell.mine && cell.opened) {
        openedSafeCells++;
      }
    }
  }

  if (openedSafeCells === totalSafeCells) {
    winGame();
  }
}

// ============================================================
// STAR RATING
// ============================================================

function calculateStars() {
  const level = getLevelData();

  if (seconds <= level.target3) {
    return 3;
  }

  if (seconds <= level.target2) {
    return 2;
  }

  return 1;
}

// ============================================================
// WIN
// ============================================================

function winGame() {
  if (gameWon) {
    return;
  }

  gameWon = true;

  clearInterval(timerInterval);

  const level = getLevelData();

  // AUTO FLAG MINES

  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      const cell = board[row][col];

      if (cell.mine) {
        cell.flagged = true;

        cell.element.textContent = "🚩";

        cell.element.classList.add("flagged");
      }
    }
  }

  flags = level.mines;

  flagCountElement.textContent = flags;

  // STARS

  const stars = calculateStars();

  const oldStars = Number(levelStars[currentLevel] || 0);

  if (stars > oldStars) {
    levelStars[currentLevel] = stars;
  }

  // BEST TIME

  const oldBest = Number(bestTimes[currentLevel] || 0);

  if (oldBest === 0 || seconds < oldBest) {
    bestTimes[currentLevel] = seconds;
  }

  // UNLOCK NEXT

  if (currentLevel < 10 && unlockedLevel < currentLevel + 1) {
    unlockedLevel = currentLevel + 1;
  }

  saveProgress();

  updateLevelSelector();

  bestTimeElement.textContent = `${bestTimes[currentLevel]}s`;

  setTimeout(function () {
    modalIcon.textContent = currentLevel === 10 ? "👑" : "🏆";

    modalTitle.textContent =
      currentLevel === 10 ? "FINAL BOSS HẠ GỤC!" : "CHIẾN THẮNG!";

    modalStars.textContent = "⭐".repeat(stars);

    modalStars.classList.remove("hidden");

    modalStats.classList.remove("hidden");

    resultTime.textContent = `${seconds}s`;

    resultBest.textContent = `${bestTimes[currentLevel]}s`;

    if (currentLevel < 10) {
      modalMessage.textContent = `Màn ${currentLevel + 1} đã được mở khóa!`;

      nextLevelButton.classList.remove("hidden");
    } else {
      modalMessage.textContent = "Bạn đã vượt qua toàn bộ Death Field!";

      nextLevelButton.classList.add("hidden");
    }

    modalButton.textContent = "🔄 CHƠI LẠI";

    modal.classList.remove("hidden");
  }, 350);
}

// ============================================================
// LEVEL SELECTOR
// ============================================================

function updateLevelSelector() {
  levelButtons.forEach(function (button) {
    const levelNumber = Number(button.dataset.level);

    const numberSpan = button.querySelector("span");

    const small = button.querySelector("small");

    button.classList.remove("active");

    if (levelNumber > unlockedLevel) {
      button.classList.add("locked");

      numberSpan.textContent = "🔒";
    } else {
      button.classList.remove("locked");

      if (levelNumber === 10) {
        numberSpan.textContent = "☠️";
      } else {
        numberSpan.textContent = levelNumber;
      }

      const stars = Number(levelStars[levelNumber] || 0);

      if (stars > 0) {
        small.textContent = `${LEVELS[levelNumber - 1].name} ${"⭐".repeat(stars)}`;
      } else {
        small.textContent = LEVELS[levelNumber - 1].name;
      }
    }

    if (levelNumber === currentLevel) {
      button.classList.add("active");
    }
  });
}

// ============================================================
// SELECT LEVEL
// ============================================================

function selectLevel(levelNumber) {
  if (levelNumber < 1 || levelNumber > 10) {
    return;
  }

  if (levelNumber > unlockedLevel) {
    return;
  }

  currentLevel = levelNumber;

  levelSelector.classList.add("hidden");

  modal.classList.add("hidden");

  createGame();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ============================================================
// SHOW / HIDE LEVEL MENU
// ============================================================

function toggleLevelSelector() {
  levelSelector.classList.toggle("hidden");
}

function showLevelSelector() {
  modal.classList.add("hidden");

  levelSelector.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ============================================================
// BUTTON EVENTS
// ============================================================

restartButton.addEventListener("click", createGame);

modalButton.addEventListener("click", createGame);

nextLevelButton.addEventListener("click", function () {
  if (currentLevel < 10) {
    currentLevel++;

    createGame();
  }
});

toggleLevelsButton.addEventListener("click", toggleLevelSelector);

levelsButton.addEventListener("click", toggleLevelSelector);

modalLevelsButton.addEventListener("click", showLevelSelector);

levelButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const levelNumber = Number(button.dataset.level);

    selectLevel(levelNumber);
  });
});

// ============================================================
// DISABLE CONTEXT MENU
// ============================================================

boardElement.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

// ============================================================
// RESIZE
//
// Khi đổi kích thước cửa sổ,
// tạo lại bàn nếu game CHƯA bắt đầu.
//
// Không reset giữa lúc đang chơi.
// ============================================================

window.addEventListener("resize", function () {
  if (firstClick) {
    createGame();
  }
});

// ============================================================
// START
// ============================================================

loadProgress();

updateLevelSelector();

createGame();
