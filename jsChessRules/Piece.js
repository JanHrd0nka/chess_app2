export const COLOR = Object.freeze({
  WHITE: Symbol("white"),
  BLACK: Symbol("black")
});

export function getOppColor(color){
     return color === COLOR.WHITE ? COLOR.BLACK : COLOR.WHITE;
}

export class Piece {
    constructor(color) {
        this.color = color;
        this.didMove = false;
    }

    setColor(color){
        this.color = color;
    }

    getColor(){
        return this.color;
    }

    getSymbol() {
        throw "getSymbol must be implemented";
    }

    getPossibleMoves(_board, _pos) {
        throw "getPossibleMoves must be implemented";
    }

    getDidMove(){
        return this.didMove;
    }

    setDidMove(){
        this.didMove = true;
    }
}