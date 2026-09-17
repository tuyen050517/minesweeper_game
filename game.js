// ==========================================
// MINESWEEPER: DEATH FIELD
// LEVEL 1
// ==========================================

const ROWS = 9;
const COLS = 9;
const TOTAL_MINES = 10;

const PUZZLE_IMAGE = "img/tan.jpg";

let board = [];
let gameOver = false;
let gameWon = false;
let firstClick = true;

let flags = 0;
let seconds = 0;
let timerInterval = null;

// ==========================================
// LẤY CÁC PHẦN TỬ HTML
// ==========================================

const boardElement = document.getElementById("board");
const mineCountElement = document.getElementById("mine-count");
const flagCountElement = document.getElementById("flag-count");
const timerElement = document.getElementById("timer");

const restartButton = document.getElementById("restart-btn");

const modal = document.getElementById("game-modal");
const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalButton = document.getElementById("modal-button");

// ==========================================
// TẠO GAME
// ==========================================

function createGame() {
  // Dừng timer cũ
  clearInterval(timerInterval);
  timerInterval = null;

  // Reset dữ liệu
  board = [];

  gameOver = false;
  gameWon = false;
  firstClick = true;

  flags = 0;
  seconds = 0;

  // Reset giao diện
  mineCountElement.textContent = TOTAL_MINES;
  flagCountElement.textContent = flags;
  timerElement.textContent = seconds;

  modal.classList.add("hidden");

  boardElement.innerHTML = "";

  // Tạo grid 9 x 9
  boardElement.style.gridTemplateColumns = `repeat(${COLS}, 48px)`;

  // Tạo dữ liệu các ô
  for (let row = 0; row < ROWS; row++) {
    const boardRow = [];

    for (let col = 0; col < COLS; col++) {
      boardRow.push({
        row: row,
        col: col,

        mine: false,
        opened: false,
        flagged: false,

        number: 0,

        element: null,
      });
    }

    board.push(boardRow);
  }

  // Tạo HTML cho từng ô
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];

      const div = document.createElement("div");

      div.classList.add("cell");

      div.style.backgroundImage = `url("${PUZZLE_IMAGE}")`;
      div.style.backgroundSize = `${COLS * 48}px ${ROWS * 48}px`;
      div.style.backgroundPosition = `-${col * 48}px -${row * 48}px`;

      cell.element = div;

      // --------------------------
      // CHUỘT TRÁI
      // --------------------------

      div.addEventListener("click", function () {
        openCell(row, col);
      });

      // --------------------------
      // CHUỘT PHẢI
      // --------------------------

      div.addEventListener("contextmenu", function (event) {
        event.preventDefault();

        toggleFlag(row, col);
      });

      boardElement.appendChild(div);
    }
  }
}

// ==========================================
// TẠO MÌN
// ==========================================

function generateMines(safeRow, safeCol) {
  const forbidden = new Set();

  // Click đầu tiên + 8 ô xung quanh
  // sẽ không có mìn

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
          row: row,
          col: col,
        });
      }
    }
  }

  // Trộn vị trí
  shuffleArray(possiblePositions);

  // Đặt mìn
  for (let i = 0; i < TOTAL_MINES; i++) {
    const position = possiblePositions[i];

    board[position.row][position.col].mine = true;
  }

  calculateNumbers();
}

// ==========================================
// TRỘN ARRAY
// ==========================================

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================
// TÍNH SỐ MÌN XUNG QUANH
// ==========================================

function calculateNumbers() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
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

// ==========================================
// KIỂM TRA Ô CÓ NẰM TRONG BOARD
// ==========================================

function isInsideBoard(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// ==========================================
// MỞ Ô
// ==========================================

function openCell(row, col) {
  if (gameOver || gameWon) {
    return;
  }

  const cell = board[row][col];

  // Không mở ô đã cắm cờ
  if (cell.flagged) {
    return;
  }

  // Không mở lại ô đã mở
  if (cell.opened) {
    return;
  }

  // ======================================
  // CLICK ĐẦU TIÊN
  // ======================================

  if (firstClick) {
    generateMines(row, col);

    firstClick = false;

    startTimer();
  }

  // ======================================
  // DÍNH MÌN
  // ======================================

  if (cell.mine) {
    cell.opened = true;

    cell.element.classList.add("opened", "mine");

    cell.element.textContent = "💣";

    loseGame();

    return;
  }

  // ======================================
  // MỞ Ô AN TOÀN
  // ======================================

  floodOpen(row, col);

  checkWin();
}

// ==========================================
// MỞ LAN Ô TRỐNG
// ==========================================

function floodOpen(row, col) {
  if (!isInsideBoard(row, col)) {
    return;
  }

  const cell = board[row][col];

  if (cell.opened || cell.flagged || cell.mine) {
    return;
  }

  // Đánh dấu đã mở
  cell.opened = true;

  cell.element.classList.add("opened");

  // Nếu có số
  if (cell.number > 0) {
    cell.element.textContent = cell.number;

    cell.element.dataset.number = cell.number;

    return;
  }

  // Nếu bằng 0 thì mở lan
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }

      floodOpen(row + dr, col + dc);
    }
  }
}

// ==========================================
// CẮM / GỠ CỜ
// ==========================================

function toggleFlag(row, col) {
  if (gameOver || gameWon || firstClick) {
    return;
  }

  const cell = board[row][col];

  if (cell.opened) {
    return;
  }

  // ------------------------------
  // GỠ CỜ
  // ------------------------------

  if (cell.flagged) {
    cell.flagged = false;

    flags--;

    cell.element.textContent = "";

    cell.element.classList.remove("flagged");
  }

  // ------------------------------
  // CẮM CỜ
  // ------------------------------
  else {
    // Không cho cắm quá số mìn
    if (flags >= TOTAL_MINES) {
      return;
    }

    cell.flagged = true;

    flags++;

    cell.element.textContent = "🚩";

    cell.element.classList.add("flagged");
  }

  flagCountElement.textContent = flags;
}

// ==========================================
// TIMER
// ==========================================

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(function () {
    seconds++;

    timerElement.textContent = seconds;
  }, 1000);
}

// ==========================================
// THUA
// ==========================================

function loseGame() {
  gameOver = true;

  clearInterval(timerInterval);

  revealAllMines();

  // Hiện modal sau một chút
  setTimeout(function () {
    modalIcon.textContent = "💥";

    modalTitle.textContent = "BOOM!";

    modalMessage.textContent = `Bạn sống được ${seconds} giây. Thử lại nào!`;

    modalButton.textContent = "🔄 THỬ LẠI";

    modal.classList.remove("hidden");
  }, 500);
}

// ==========================================
// HIỆN TẤT CẢ MÌN
// ==========================================

function revealAllMines() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];

      if (cell.mine) {
        cell.element.classList.add("opened", "mine");

        cell.element.textContent = "💣";
      }
    }
  }
}

// ==========================================
// KIỂM TRA THẮNG
// ==========================================

function checkWin() {
  let openedSafeCells = 0;

  const totalSafeCells = ROWS * COLS - TOTAL_MINES;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
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

// ==========================================
// THẮNG
// ==========================================

function winGame() {
  gameWon = true;

  clearInterval(timerInterval);

  // Cắm cờ tự động vào tất cả mìn
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];

      if (cell.mine) {
        cell.flagged = true;

        cell.element.textContent = "🚩";

        cell.element.classList.add("flagged");
      }
    }
  }

  flags = TOTAL_MINES;

  flagCountElement.textContent = flags;

  setTimeout(function () {
    modalIcon.textContent = "🏆";

    modalTitle.textContent = "CHIẾN THẮNG!";

    modalMessage.textContent = `Bạn đã phá bãi mìn trong ${seconds} giây!`;

    modalButton.textContent = "🎮 CHƠI LẠI";

    modal.classList.remove("hidden");
  }, 300);
}

// ==========================================
// BUTTON
// ==========================================

restartButton.addEventListener("click", createGame);

modalButton.addEventListener("click", createGame);

// ==========================================
// CHẶN MENU CHUỘT PHẢI TRÊN BOARD
// ==========================================

boardElement.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

// ==========================================
// KHỞI ĐỘNG GAME
// ==========================================

createGame();
