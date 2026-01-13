import { COLOR, Piece, getOppColor } from './Piece.js';
import { Pos } from './Pos.js'

export class Rook extends Piece {
    getSymbol() {
        return this.color === COLOR.WHITE ? '♖' : '♜';
    }

    getPossibleMoves(board, pos){
        return board.getOrthogonalMoves(pos, getOppColor(this.color));
    }
}

export class Knight extends Piece {
    getSymbol() {
        return this.color === COLOR.WHITE ? '♘' : '♞';
    }

    
    getPossibleMoves(board, pos) {
        const moves = [];
        const oppColor = getOppColor(this.color);

        const deltas = [
            new Pos( 2,  1), new Pos( 2, -1),
            new Pos(-2,  1), new Pos(-2, -1),
            new Pos( 1,  2), new Pos( 1, -2),
            new Pos(-1,  2), new Pos(-1, -2),
        ];

        for (const d of deltas) {
            const target = pos.add(d);
            if (!target.isValid()) continue;

            const piece = board.getPiece(target.getRow(), target.getCol());
            if (!piece || piece.color === oppColor) {
                moves.push(target);
            }
        }
        return moves;
    }
}

export class Bishop extends Piece {
    getSymbol() {
        return this.color === COLOR.WHITE ? '♗' : '♝';
    }

    getPossibleMoves(board, pos){
        return board.getDiagonalMoves(pos, getOppColor(this.color));
    }
}

export class Queen extends Piece {
    getSymbol() {
        return this.color === COLOR.WHITE ? '♕' : '♛';
    }

    getPossibleMoves(board, pos) {
        const oppColor = getOppColor(this.color);
        const diagonalMoves = board.getDiagonalMoves(pos, oppColor);
        const orthogonalMoves = board.getOrthogonalMoves(pos, oppColor);

        return [...diagonalMoves, ...orthogonalMoves];
    }
}

export class King extends Piece {
    getSymbol() {
        return this.color === COLOR.WHITE ? '♔' : '♚';
    }

    getPossibleMoves(board, pos) {
        const moves = [];
        const oppColor = getOppColor(this.color);
        const deltas = [
            new Pos( 1,  1), new Pos( 1,  0),
            new Pos( 1, -1), new Pos( 0,  1),
            new Pos( 0, -1), new Pos(-1,  1),
            new Pos(-1,  0), new Pos(-1, -1),
        ];
        board.grid[pos.getRow()][pos.getCol()] = null;

        for (const d of deltas) {
            const target = pos.add(d);
            const piece = board.getPiece(target.getRow(), target.getCol());
            if (target.isValid() && (piece == null || piece.getColor() === oppColor)){
                if (!board.isChecked(target, oppColor)){
                    moves.push(target);
                }
            }
        }
        board.grid[pos.getRow()][pos.getCol()] = this;

        if (!this.getDidMove() && !board.isCheck()){
            // Right side castle.
            const oneRight = new Pos(pos.getRow(), pos.getCol() + 1);
            const twoRight = new Pos(pos.getRow(), pos.getCol() + 2);
            const canStepRight = moves.some(m => m.equals(oneRight));

            if (canStepRight &&
                board.getPiece(twoRight.getRow(), twoRight.getCol()) === null && 
                !board.isChecked(twoRight, oppColor)) {

                const rook = board.getPiece(pos.getRow(), pos.getCol() + 3);

                if (rook && !rook.getDidMove() && piece instanceof Rook) {
                    moves.push(twoRight);
                }
            }

            // Left side casle
            const oneLeft = new Pos(pos.getRow(), pos.getCol() - 1);
            const twoLeft = new Pos(pos.getRow(), pos.getCol() - 2);
            const threeLeft = new Pos(pos.getRow(), pos.getCol() - 3);
            const canStepLeft = moves.some(m => m.equals(oneLeft));

            if (canStepLeft &&
                board.getPiece(twoLeft.getRow(), twoLeft.getCol()) === null && 
                board.getPiece(threeLeft.getRow(), threeLeft.getCol()) === null && 
                !board.isChecked(twoLeft, oppColor)) {

                const rook = board.getPiece(pos.getRow(), pos.getCol() -4);

                if (rook && !rook.getDidMove()) {
                    moves.push(twoLeft);
                }
            }
        }

        return moves;
    }
}

export class WhitePawn extends Piece {
    constructor() {
        super(COLOR.WHITE);
    }

    getSymbol() {
        return '♙';
    }

    getPossibleMoves(board, pos) {
        const moves = [];

        const oneUp = pos.add(new Pos(-1, 0));
        if (oneUp.isValid() && !board.getPiece(oneUp.getRow(), oneUp.getCol())) {
            moves.push(oneUp);

            const twoUp = pos.add(new Pos(-2, 0));
            if (pos.row === 6 && !board.getPiece(twoUp.getRow(), twoUp.getCol())) {
                moves.push(twoUp);
            }
        }

        for (const dc of [-1, 1]) {
            const diag = pos.add(new Pos(-1, dc));
            if (!diag.isValid()) continue;

            const piece = board.getPiece(diag.getRow(), diag.getCol());
            if (piece && piece.color === COLOR.BLACK) {
                moves.push(diag);
            }

            // en passant
            if (pos.row === 3 && board.enpassantPos != null && diag.col === board.enpassantPos.getCol()) {
                moves.push(diag);
            }
        }

        return moves;
    }
}


export class BlackPawn extends Piece {
    constructor() {
        super(COLOR.BLACK);
    }

    getSymbol() {
        return '♟';
    }

    getPossibleMoves(board, pos) {
        const moves = [];

        const oneDown = pos.add(new Pos(1, 0));
        if (
            oneDown.isValid() &&
            !board.getPiece(oneDown.getRow(), oneDown.getCol())
        ) {
            moves.push(oneDown);

            const twoDown = pos.add(new Pos(2, 0));
            if (
                pos.row === 1 &&
                !board.getPiece(twoDown.getRow(), twoDown.getCol())
            ) {
                moves.push(twoDown);
            }
        }

        for (const dc of [-1, 1]) {
            const diag = pos.add(new Pos(1, dc));
            if (!diag.isValid()) continue;

            const piece = board.getPiece(diag.getRow(), diag.getCol());
            if (piece && piece.color === COLOR.WHITE) {
                moves.push(diag);
            }

            // en passant
            if (pos.row === 4 && board.enpassantPos != null && diag.col === board.enpassantPos.getCol()) {
                moves.push(diag);
            }
        }

        return moves;
    }
}