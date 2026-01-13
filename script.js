import { Board, GAME_STATE } from './jsChessRules/Board.js';
import { MoveHistory } from './jsMoveHistory/MoveHistory.js';

const boardElement = document.getElementById('chessboard');
const moveHistoryUI = new MoveHistory('move-history');
const topStatus = document.getElementById('game-status-top');
const bottomStatus = document.getElementById('game-status-bottom');

const toStartBtn = document.getElementById('toStartBtn');
const stepBackBtn = document.getElementById('stepBackBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const toEndBtn = document.getElementById('toEndBtn');

const newGameBtn = document.getElementById('newGameBtn');
const loadGameBtn = document.getElementById('loadGameBtn');
const saveGameBtn = document.getElementById('saveGameBtn');

let board = new Board();

saveGameBtn.addEventListener('click', () => {
    const movesHistory = moveHistoryUI.getMovesHistory();

    if (!movesHistory || movesHistory.length === 0) {
        alert("No reason to save initial position.");
        return;
    }

    const fileContent = movesHistory.join(',');
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess_game.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

loadGameBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.click();

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result.trim();                
                const movesArray = content.split(',').map(num => parseInt(num, 10));
                if (movesArray.some(isNaN)) {
                    throw new Error("File contains invalid moves!");
                }
                moveHistoryUI.history = movesArray;
                moveHistoryUI.currentIndex = movesArray.length - 1;
                moveHistoryUI.render();
                board.setBoard(movesArray, movesArray.length - 1);
                renderBoard();
            } catch (err) {
                board.resetBoard();
                renderBoard();
                alert("Failed to load game: " + err.message);
            }
        };

        reader.readAsText(file);
    });
});

newGameBtn.addEventListener('click', () => {
    moveHistoryUI.history = [];
    moveHistoryUI.currentIndex = -1;
    moveHistoryUI.render();
    board.resetBoard();
    renderBoard();
    alert("New game started!");
});

toStartBtn.addEventListener('click', () => {
    if (moveHistoryUI.goToStart()) {
        handleHistoryMove(moveHistoryUI.getMovesHistory(), moveHistoryUI.getCurrentIndex());
    }
});

stepBackBtn.addEventListener('click', () => {
    if (moveHistoryUI.stepBack()) {
        handleHistoryMove(moveHistoryUI.getMovesHistory(), moveHistoryUI.getCurrentIndex());
    }
});

stepForwardBtn.addEventListener('click', () => {
    if (moveHistoryUI.stepForward()) {
        handleHistoryMove(moveHistoryUI.getMovesHistory(), moveHistoryUI.getCurrentIndex());
    }
});

toEndBtn.addEventListener('click', () => {
    if (moveHistoryUI.goToEnd()) {
        handleHistoryMove(moveHistoryUI.getMovesHistory(), moveHistoryUI.getCurrentIndex());
    }
});

function handleHistoryMove(movesHistory, currentIndex){
    board.setBoard(movesHistory, currentIndex);
    renderBoard();
}


function showPromotionOverlay(pieces) {
    return new Promise(resolve => {
        const overlay = document.getElementById('promotion-overlay');
        const buttonsDiv = document.getElementById('promotion-buttons');
        buttonsDiv.innerHTML = '';

        pieces.forEach(symbol => {
            const btn = document.createElement('button');
            btn.textContent = symbol;
            btn.addEventListener('click', () => {
                overlay.style.display = 'none';
                resolve(symbol);
            });
            buttonsDiv.appendChild(btn);
        });

        overlay.style.display = 'block';
    });
}

async function onClick(row, col){
    const promotes = board.getPromotes(row, col);
    if (promotes != null){
        renderBoard(false);
        const piece = await showPromotionOverlay (promotes);
        board.setPromote(piece);
    }
    if (board.makeMove(row, col)){
        const lastMove = board.getLastMove();
        moveHistoryUI.addMove(lastMove);
    }
    else{
        board.selectPiece(row, col);
    }
    renderBoard(true);
}

function renderBoard(interactive = true) {
    boardElement.innerHTML = "";   

    const gameState = board.getGameState();

    if (gameState != null){
        if (gameState === GAME_STATE.WHITE_WON){
            bottomStatus.textContent = "White won!";
            bottomStatus.style.display = "block";
            topStatus.style.display = "none";
        }
        else if (gameState === GAME_STATE.BLACK_WON){
            topStatus.textContent = "Black won!";
            topStatus.style.display = "block";
            bottomStatus.style.display = "none";
        }
        else{
            topStatus.textContent = "Draw!";
            bottomStatus.textContent = "Draw!";
            topStatus.style.display = "block";
            bottomStatus.style.display = "block";
        }
    }
    else{
        topStatus.style.display = "none";
        bottomStatus.style.display = "none";
    }

    const selectedMoves = board.getSelectedPieceMoves();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            let piece = board.getPiece(row, col);
            square.textContent = piece ? piece.getSymbol() : '';

            if (selectedMoves) {
                const isMove = selectedMoves.some(
                    m => m.row === row && m.col === col
                );
                if (isMove) {
                    square.classList.add('highlight');
                }
            }
        
            if (interactive){
                square.addEventListener('click', () => {
                    onClick(row, col);
                });
            }
            boardElement.appendChild(square);
        }
    }
}

renderBoard();