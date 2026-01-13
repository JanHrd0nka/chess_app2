import { Pos } from './Pos.js'
import { COLOR, getOppColor } from './Piece.js';
import { Rook, Knight, Bishop, Queen, King, WhitePawn, BlackPawn } from './PieceTypes.js';

export const GAME_STATE = Object.freeze({
  WHITE_WON: Symbol("WhiteWon"),
  BLACK_WON: Symbol("BlackWon"),
  DRAW : Symbol("Draw")
});

export class Board {
    constructor() {
        this.resetBoard();
    }

    resetBoard() {
        this.playerMove = COLOR.WHITE;
        this.selectedPiece = null;
        this.enpassantPos = null;
        this.promotePiece = null;
        this.lastMove = null;
        this.kingPos = {
            [COLOR.WHITE]: null,
            [COLOR.BLACK]: null
        };
        this.checkPos1 = null;
        this.checkPos2 = null;
        this.movesBuffer = null;
        this.gameState = null;
        this.grid = this.createEmptyBoard();
        this.initPieces();
    }

    createEmptyBoard() {
        const board = [];
        for (let row = 0; row < 8; row++) {
            const rowArray = [];
            for (let col = 0; col < 8; col++) {
                rowArray.push(null);
            }
            board.push(rowArray);
        }
        return board;
    }

    setBoard(movesHistory, currentIndex){
        this.resetBoard();
        for (let i = 0; i <= currentIndex; i++) {
            const move = movesHistory[i];

            const colFrom = Math.floor(move / 1000);
            const rowFrom = Math.floor((move % 1000) / 100);
            const colTo   = Math.floor((move % 100) / 10);
            const rowTo   = move % 10;

            this.selectPiece(rowFrom, colFrom)
            if (!this.makeMove(rowTo, colTo)){
                throw new Error ("Invalid move from history");
            }
        }
    }

    initPieces() {
        this.grid[7][0] = new Rook(COLOR.WHITE);
        this.grid[7][1] = new Knight(COLOR.WHITE);
        this.grid[7][2] = new Bishop(COLOR.WHITE);
        this.grid[7][3] = new Queen(COLOR.WHITE);
        this.grid[7][4] = new King(COLOR.WHITE);
        this.grid[7][5] = new Bishop(COLOR.WHITE);
        this.grid[7][6] = new Knight(COLOR.WHITE);
        this.grid[7][7] = new Rook(COLOR.WHITE);
        for (let col = 0; col < 8; col++) this.grid[6][col] = new WhitePawn();
        this.kingPos[COLOR.WHITE] = new Pos(7, 4);

        this.grid[0][0] = new Rook(COLOR.BLACK);
        this.grid[0][1] = new Knight(COLOR.BLACK);
        this.grid[0][2] = new Bishop(COLOR.BLACK);
        this.grid[0][3] = new Queen(COLOR.BLACK);
        this.grid[0][4] = new King(COLOR.BLACK);
        this.grid[0][5] = new Bishop(COLOR.BLACK);
        this.grid[0][6] = new Knight(COLOR.BLACK);
        this.grid[0][7] = new Rook(COLOR.BLACK);
        for (let col = 0; col < 8; col++) this.grid[1][col] = new BlackPawn();
        this.kingPos[COLOR.BLACK] = new Pos(0, 4);
    }

    getPiece(row, col) {
        if (row == null || col == null || row < 0 || row > 7 || col < 0 || col > 7) 
            return null;
        return this.grid[row][col];
    }

    getLinedPositions(startPos, dirPos, colorToReplace) {
        const positions = [];

        let pos = startPos.add(dirPos);

        while (pos.isValid()) {
            const piece = this.getPiece(pos.getRow(), pos.getCol());

            if (piece) {
                if (piece.color === colorToReplace) {
                    positions.push(pos);
                }
                break;
            }

            positions.push(pos);
            pos = pos.add(dirPos);
        }

        return positions;
    }

    getDiagonalMoves(pos, colorToReplace) {
        return [
            ...this.getLinedPositions(pos, new Pos( 1,  1), colorToReplace),
            ...this.getLinedPositions(pos, new Pos( 1, -1), colorToReplace),
            ...this.getLinedPositions(pos, new Pos(-1,  1), colorToReplace),
            ...this.getLinedPositions(pos, new Pos(-1, -1), colorToReplace),
        ];
    }


    getOrthogonalMoves(pos, colorToReplace) {
        return [
            ...this.getLinedPositions(pos, new Pos( 1,  0), colorToReplace),
            ...this.getLinedPositions(pos, new Pos(-1,  0), colorToReplace),
            ...this.getLinedPositions(pos, new Pos( 0,  1), colorToReplace),
            ...this.getLinedPositions(pos, new Pos( 0, -1), colorToReplace),
        ];
    }


    getPromotes (row, col){
        if (this.selectedPiece != null){
            const piece = this.getPiece(this.selectedPiece.getRow(), this.selectedPiece.getCol());
            if (piece) {
                const moves = piece.getPossibleMoves(this, this.selectedPiece);
                const canPromote = moves.some(m => m.row === row && m.col === col);
                if (canPromote){
                    if (row === 0 && piece instanceof WhitePawn) return ['♕', '♖', '♗', '♘'];
                    if (row === 7 && piece instanceof BlackPawn) return ['♛', '♜', '♝', '♞'];
                }
            }
        }
        return null;
    }

    setPromote (symbol){
        switch (symbol) {
            case '♕': this.promotePiece = new Queen(COLOR.WHITE); break;
            case '♖': this.promotePiece = new Rook(COLOR.WHITE); break;
            case '♗': this.promotePiece = new Bishop(COLOR.WHITE); break;
            case '♘': this.promotePiece = new Knight(COLOR.WHITE); break;
            case '♛': this.promotePiece = new Queen(COLOR.BLACK); break;
            case '♜': this.promotePiece = new Rook(COLOR.BLACK); break;
            case '♝': this.promotePiece = new Bishop(COLOR.BLACK); break;
            case '♞': this.promotePiece = new Knight(COLOR.BLACK); break;
        }
    }

    selectPiece(row, col){
        this.selectedPiece = null;
        const piece = this.getPiece(row, col);
        if (piece && piece.getColor() === this.playerMove){
            this.selectedPiece = new Pos (row, col);
            this.movesBuffer = this.getMoves(new Pos(row, col));
        }
    }

    getSelectedPieceMoves(){
        if (this.movesBuffer){        
            return this.movesBuffer.map(pos => ({
                row: pos.getRow(),
                col: pos.getCol()
            }));
        }
        return null;
    }

    getMoves(piecePos){
        if (piecePos != null && piecePos.isValid()){ 
            const row = piecePos.getRow();
            const col = piecePos.getCol();
            const piece = this.getPiece(row, col);
            if (piece){
                if (this.checkPos1 && this.checkPos2 && !(piece instanceof King)){
                    return null;
                }
                let moves = piece.getPossibleMoves(this ,piecePos);
                if (moves && !(piece instanceof King)){
                    const kingPos = this.kingPos[piece.getColor()];
                    // If checked, piece can only block check or take checking figure.
                    const checkPos = this.checkPos1 ? this.checkPos1 : this.checkPos2;
                    if (checkPos){
                        const validSquares = [];
                        validSquares.push(checkPos);

                        const attacker = this.getPiece(checkPos.getRow(), checkPos.getCol());

                        if (attacker instanceof Bishop || attacker instanceof Rook || attacker instanceof Queen) {
                            const dRow = Math.sign(checkPos.getRow() - kingPos.getRow());
                            const dCol = Math.sign(checkPos.getCol() - kingPos.getCol());

                            let p = kingPos.add(new Pos(dRow, dCol));
                            while (!p.equals(checkPos)) {
                                validSquares.push(p);
                                p = p.add(new Pos(dRow, dCol));
                            }
                        }
                        moves = moves.filter(m =>
                            validSquares.some(v => v.equals(m)));
                    }                    
                    // Check if piece is pinned.
                    const dRow = piecePos.getRow() - kingPos.getRow();
                    const dCol = piecePos.getCol() - kingPos.getCol();

                    const isSameRow = dRow === 0;
                    const isSameCol = dCol === 0;
                    const isDiagonal = Math.abs(dRow) === Math.abs(dCol);

                    if (isSameRow || isSameCol || isDiagonal) {
                        const stepRow = Math.sign(dRow);
                        const stepCol = Math.sign(dCol);
                        let p = piecePos.add(new Pos(stepRow, stepCol));
                        while (p.isValid()) {
                            const other = this.getPiece(p.getRow(), p.getCol());
                            if (other) {
                                if (other.getColor() != piece.getColor()){
                                    if (other instanceof Queen || 
                                        (other instanceof Rook && (stepRow === 0 || stepCol === 0)) ||
                                        (other instanceof Bishop && stepRow != 0 && stepCol != 0)){
                                        // Might be pinned.
                                        const backStepRow = stepRow * -1;
                                        const backStepCol = stepCol * -1;
                                        let backP = new Pos (p.getRow() + backStepRow, p.getCol() + backStepCol);
                                        while (backP.isValid()){
                                            if (backP.equals(piecePos)){
                                                backP = backP.add(new Pos(backStepRow, backStepCol));
                                                continue;
                                            }
                                            if (backP.equals(this.kingPos[piece.getColor()])){
                                                // Is pinned.
                                                const validSquares = [];
                                                validSquares.push(p);
                                                let square = p.add(new Pos(-stepRow, -stepCol));
                                                while (!square.equals(kingPos)){
                                                    validSquares.push(square);
                                                    square = square.add(new Pos(-stepRow, -stepCol));
                                                }
                                                moves = moves.filter(m =>
                                                    validSquares.some(v => v.equals(m)));
                                                    break;
                                                }
                                            if (this.getPiece(backP.getRow(), backP.getCol())){
                                                break;
                                            }
                                            backP = backP.add(new Pos(backStepRow, backStepCol));
                                        }
                                    }
                                }
                                break;
                            }
                            p = p.add(new Pos(stepRow, stepCol));
                        }
                    }
                }
                return moves;
            }
        }
        return null;
    }

    setChecks (previousPos, currentPos){
        this.checkPos1 = null;
        this.checkPos2 = null;
        // Normal check
        const piece = this.getPiece(currentPos.getRow(), currentPos.getCol());
        const moves = piece.getPossibleMoves(this, currentPos);
        const oppKingPos = this.kingPos[getOppColor(piece.getColor())];
        if (moves.some(m => m.equals(oppKingPos))){
            this.checkPos1 = currentPos;
            console.log(`Check! Figure ${piece.getSymbol()} at (${currentPos.getRow()}, ${currentPos.getCol()}) threatens king at (${this.kingPos[getOppColor(piece.getColor())].getRow()}, ${this.kingPos[getOppColor(piece.getColor())].getCol()})`);
        }

        // Discover check
        const dRow = previousPos.getRow() - oppKingPos.getRow();
        const dCol = previousPos.getCol() - oppKingPos.getCol();

        if (dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol)){
            const stepRow = Math.sign(dRow);
            const stepCol = Math.sign(dCol);

            let p = oppKingPos.add(new Pos(stepRow, stepCol));

            while (p.isValid()) {
                const blocker = this.getPiece(p.getRow(), p.getCol());

                if (blocker) {
                    const blockerMoves = blocker.getPossibleMoves(this, p);
                    if (blocker.getColor() === piece.getColor() && blockerMoves.some(m => m.equals(oppKingPos))) 
                    {
                        if (this.checkPos1 != null && !p.equals(this.checkPos1)){
                            this.checkPos2 = p;
                            console.log(`Discover check by ${blocker.getSymbol()} at ${p.getRow()},${p.getCol()}`);
                        }
                    }
                    break;
                }
                p = p.add(new Pos(stepRow, stepCol));
            }
        }
    }

    makeMove(row, col){
        if (this.selectedPiece != null){
            let piece = this.getPiece(this.selectedPiece.getRow(), this.selectedPiece.getCol());
            const isValid = this.movesBuffer && this.movesBuffer.some(m => m.getRow() === row && m.getCol() === col);
            this.movesBuffer = null;
            if (isValid){
                if (piece instanceof WhitePawn || piece instanceof BlackPawn){
                    if (this.enpassantPos != null && col === this.enpassantPos.getCol() && this.selectedPiece.getCol() != col){
                        this.grid[this.enpassantPos.getRow()][this.enpassantPos.getCol()] = null;
                    }
                    if (Math.abs(row - this.selectedPiece.getRow()) === 2){
                        this.enpassantPos = new Pos(row, col);
                    }
                    else{
                        this.enpassantPos = null;
                    }
                    if (row === 0 || row === 7){
                        piece = this.promotePiece;
                    }
                }
                else{
                    this.enpassantPos = null;
                    if (piece instanceof King){
                        const diff = col - this.kingPos[piece.getColor()].getCol();
                        const kingOldCol = this.kingPos[piece.getColor()].getCol();
                        // Set rook position after castle.
                        if (diff === 2){
                            this.grid[row][kingOldCol + 1] = this.grid[row][kingOldCol + 3];
                            this.grid[row][kingOldCol + 3] = null;
                        }
                        else if (diff === -2){
                            this.grid[row][kingOldCol - 1] = this.grid[row][kingOldCol - 4];
                            this.grid[row][kingOldCol - 4] = null;
                        }
                        this.kingPos[piece.getColor()] = new Pos(row, col);
                    }
                }
                piece.setDidMove();
                this.grid[row][col] = piece;
                this.grid[this.selectedPiece.getRow()][this.selectedPiece.getCol()] = null;
                this.setChecks(this.selectedPiece, new Pos(row, col));
                this.lastMove =
                    this.selectedPiece.getCol() * 1000 + // colFrom
                    this.selectedPiece.getRow() * 100  + // rowFrom
                    col * 10 +                           // colTo
                    row;                                 // rowTo
                this.selectedPiece = null;
                if (this.playerMove === COLOR.WHITE){
                    this.playerMove = COLOR.BLACK;
                }
                else{
                    this.playerMove = COLOR.WHITE;
                }
                this.checkGameState();
                return true;
            }
        }
        return false;
    }

    isChecked(pos, byColor) {
        // Pawn checks.
        const pawnDirs = byColor === COLOR.WHITE ? [new Pos(1,-1), new Pos(1,1)] : [new Pos(-1,-1), new Pos(-1,1)];
        for (const dir of pawnDirs) {
            const p = pos.add(dir);
            if (p.isValid()) {
                const piece = this.getPiece(p.getRow(), p.getCol());
                if (piece && piece.color === byColor && (piece instanceof WhitePawn || piece instanceof BlackPawn)) {
                    return true;
                }
            }
        }

        // King checks.
        const kingDirs = [
            new Pos(1,0), new Pos(-1,0), new Pos(0,1), new Pos(0,-1),
            new Pos(1,1), new Pos(1,-1), new Pos(-1,1), new Pos(-1,-1)
        ];
        for (const dir of kingDirs) {
            const p = pos.add(dir);
            if (p.isValid()) {
                const piece = this.getPiece(p.getRow(), p.getCol());
                if (piece && piece.color === byColor && piece instanceof King) {
                    return true;
                }
            }
        }

        const candidates = [];

        // Knight checks.
        const dummy = new Knight (getOppColor(byColor));        
        const knightMoves = dummy.getPossibleMoves(this, pos);        
        for (const move of knightMoves){
            candidates.push (move);
        }

        // Other checks.
        const directions = [
            new Pos( 1,  1),
            new Pos( 1, -1),
            new Pos(-1,  1),
            new Pos(-1, -1),
            new Pos( 1,  0),
            new Pos(-1,  0),
            new Pos( 0,  1),
            new Pos( 0, -1),
        ];

        for (const dir of directions) {
            const line = this.getLinedPositions(pos, dir, byColor);

            if (line.length > 0) {
                const lastPos = line[line.length - 1];
                candidates.push (lastPos);
            }
        }
        let result = false;

        for (const candidate of candidates){
            const piece = this.getPiece(candidate.getRow(), candidate.getCol());
            if (piece && !(piece instanceof WhitePawn) && !(piece instanceof BlackPawn)){
                piece.setColor(getOppColor(piece.getColor()));
                const moves = piece.getPossibleMoves(this, candidate);
                piece.setColor(getOppColor(piece.getColor()));
                const canCheck = moves.some(m => m.equals(pos));
                if (canCheck){
                    result = true;
                }
            }
        }

        return result;
    }

    checkGameState(){
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.grid[row][col];
                if (!piece || piece.getColor() !== this.playerMove)
                     continue;

                const moves = this.getMoves(new Pos(row, col));
                if (moves && moves.length > 0) {
                    return;
                }
            }
        }
        if (this.checkPos1 === null && this.checkPos2 === null){
            this.gameState = GAME_STATE.DRAW;
        }
        else if (this.playerMove === COLOR.WHITE){
            this.gameState = GAME_STATE.BLACK_WON;
        }
        else {
            this.GAME_STATE = GAME_STATE.WHITE_WON;
        }
    }

    isCheck(){
        return this.checkPos1 != null || this.checkPos2 != null;
    }

    getLastMove(){
        return this.lastMove;
    }

    getGameState(){
        return this.gameState;
    }
}