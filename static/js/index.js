const ARROWS = [
  { key: "ArrowUp", x: 0, y: -1 },
  { key: "ArrowDown", x: 0, y: 1 },
  { key: "ArrowLeft", x: -1, y: 0 },
  { key: "ArrowRight", x: 1, y: 0 },
];

//DRAWER

class Drawer {
  constructor() {
    this.boardView = document.querySelector("#board");
    this.scoreView = document.querySelector("#score");
    this.logView = document.querySelector("#log");
  }

  drawScore(board) {
    this.scoreView.innerHTML = board.scoreSum;
  }

  drawLogs(logs) {
    this.logView.innerHTML = "";
    const clogs = [...logs].reverse();
    clogs.forEach((log) => {
      let newDiv = document.createElement("div");
      newDiv.addEventListener("click", () => {
        game.setBoard(log);
      });
      newDiv.className = "output";
      newDiv.className += game.selectedLog == log ? " selected-Log" : "";
      newDiv.innerHTML = log.text;
      this.logView.appendChild(newDiv);
    });
  }

  drawBoard(board) {
    this.boardView.innerHTML = "";
    this.boardView.style.gridTemplateColumns = `repeat(${board.width}, 1fr)`;
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        let newDiv = document.createElement("div");
        newDiv.className = "card section ";
        newDiv.className +=
          board.actualBoardArray[x][y].value != 0 ? "showed " : "hidden ";
        newDiv.className += board.actualBoardArray[x][y].new ? "new " : "";
        newDiv.innerHTML = board.actualBoardArray[x][y].value;
        this.boardView.appendChild(newDiv);
      }
    }
  }

  drawGameOver() {
    this.boardView.style.gridTemplateColumns = "1fr";
    this.boardView.innerHTML =
      '<div class="centered"> GAME OVER... </div> <div class="centered"> press any key to restart </div>';
  }
}

// BOARD

class Board {
  constructor(width, height) {
    this.height = height;
    this.width = width;
    this.actualBoardArray = [];
    this.emptyPositions = [];
    this.scoreSum = 0;
    this.setupBoard();
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  deleteEmpty(position) {
    if (this.emptyPositions.length > 0) {
      return this.emptyPositions.splice(position, 1);
    }
  }

  addNewNumber() {
    if (this.emptyPositions.length > 0) {
      const random = this.getRandomInt(0, this.emptyPositions.length);
      const position = this.emptyPositions[random];
      this.actualBoardArray[position.x][position.y].value =
        Math.random() < 0.4 ? 4 : 2;
      this.actualBoardArray[position.x][position.y].new = true;
      this.deleteEmpty(random);
    }
  }

  setEmptyPositions() {
    this.emptyPositions = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.actualBoardArray[x][y].value == 0) {
          this.emptyPositions.push({ x, y });
        } else {
          this.actualBoardArray[x][y].new = false;
        }
      }
    }
  }

  getBoardCard(x, y, direction, boardArray) {
    const ax = x + direction.x;
    const ay = y + direction.y;
    return ax > -1 && ax < this.width && ay > -1 && ay < this.height
      ? boardArray[ax][ay]
      : null;
  }

  moveUntilColision(x, y, direction, boardArray) {
    const actual = this.getBoardCard(x, y, { x: 0, y: 0 }, boardArray);
    const next = this.getBoardCard(x, y, direction, boardArray);
    if (next && next.value === 0) {
      next.value = actual.value;
      actual.value = 0;
      return this.moveUntilColision(
        x + direction.x,
        y + direction.y,
        direction,
        boardArray
      );
    } else if (next && next.value === actual.value && !next.matched) {
      actual.value = 0;
      next.value = next.value * 2;
      next.matched = true;
      return next.value;
    }
    return 0;
  }

  setBoard(boardArray, direction) {
    for (let x = this.width - 1; x >= 0; x--) {
      for (let y = this.height - 1; y >= 0; y--) {
        this.scoreSum += this.moveUntilColision(x, y, direction, boardArray);
      }
    }
    return boardArray;
  }

  unMatchAll() {
    for (let x = this.width - 1; x >= 0; x--) {
      for (let y = this.height - 1; y >= 0; y--) {
        this.actualBoardArray[x][y].matched = false;
      }
    }
  }

  getArray(direction, intoarray) {
    const array = [...intoarray];
    if (direction.x < 0) {
      return array.reverse();
    }
    if (direction.y < 0) {
      array.forEach((a) => {
        a.reverse();
      });
      return array;
    }
    return array;
  }

  getDirection(direction) {
    return direction.x < 0 || direction.y < 0
      ? { x: direction.x * -1, y: direction.y * -1 }
      : direction;
  }

  move(direction, callback) {
    this.actualBoardArray = this.getArray(
      direction,
      this.setBoard(
        this.getArray(direction, this.actualBoardArray),
        this.getDirection(direction)
      )
    );
    this.unMatchAll();
    this.setEmptyPositions();
    this.addNewNumber();
    return callback();
  }

  hasMovements(x, y) {
    const o = this.actualBoardArray;
    const condition1 =
      x > 0
        ? o[x - 1][y].value === 0 || o[x - 1][y].value === o[x][y].value
        : false;
    const condition2 =
      x < this.width - 1
        ? o[x + 1][y].value === 0 || o[x + 1][y].value === o[x][y].value
        : false;
    const condition3 =
      y > 0
        ? o[x][y - 1].value === 0 || o[x][y - 1].value === o[x][y].value
        : false;
    const condition4 =
      y < this.height - 1
        ? o[x][y + 1].value === 0 || o[x][y + 1].value === o[x][y].value
        : false;
    return condition1 || condition2 || condition3 || condition4;
  }

  canContinue() {
    for (let x = this.width - 1; x >= 0; x--) {
      for (let y = this.height - 1; y >= 0; y--) {
        if (this.hasMovements(x, y)) {
          console.log();
          return true;
        }
      }
    }
    return false;
  }

  setupBoard() {
    for (let x = 0; x < this.width; x++) {
      this.actualBoardArray[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.actualBoardArray[x][y] = new BoardCard(0);
        this.emptyPositions.push({ x, y });
      }
    }
    this.addNewNumber();
    this.addNewNumber();
  }
}

class BoardCard {
  constructor(value) {
    this.value = value;
    this.matched = false;
    this.new = true;
  }
}

//GAME

class Game {
  constructor() {
    this.reset();
    window.addEventListener("keyup", this.keyPressed);
  }

  keyPressed(event) {
    if (game.gameOver) {
      game.reset();
    } else {
      const arrow = ARROWS.find((a) => a.key == event.key);
      arrow ? game.move(arrow) : void 0;
    }
  }

  reset() {
    this.boardObj = new Board(4, 4);
    this.drawer = new Drawer();
    this.actualscore = 0;
    this.logs = [];
    this.selectedLog = null;
    this.gameOver = false;
    this.draw();
  }

  draw() {
    this.drawer.drawBoard(this.boardObj);
    this.drawer.drawScore(this.boardObj);
    this.drawer.drawLogs(this.logs);
  }

  move(arrow) {
    document.querySelector("#msj").style.opacity = 0;
    this.boardObj.move(arrow, () => {
      this.setLog(arrow);
    });
    if (!this.boardObj.canContinue()) {
      this.drawer.drawGameOver();
      this.gameOver = true;
      return;
    }
    this.draw();
  }

  setLog(arrow) {
    const achieve = this.boardObj.scoreSum - this.actualscore;
    const nBoard = new Board(4, 4);
    this.assign(nBoard, this.boardObj);
    this.logs.push(
      new Log(
        "player 1 press " + arrow.key + " and achieve " + achieve + " points ",
        nBoard
      )
    );
    this.actualscore = this.boardObj.scoreSum;
  }

  setBoard(log) {
    this.selectedLog = log;
    this.actualscore = log.board.scoreSum;
    this.assign(this.boardObj, log.board);
    this.draw();
  }

  assign(receiver, seed) {
    Object.assign(receiver, JSON.parse(JSON.stringify(seed)));
    return receiver;
  }
}

class Log {
  constructor(text, board) {
    this.text = text;
    this.board = board;
  }
}

//INIT

var game;
window.onload = function () {
  game = new Game();
};
