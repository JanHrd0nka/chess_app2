export class Pos {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        }

    getRow(){
        return this.row;
    }

    getCol(){
        return this.col;
    }

    add (pos){
        return new Pos(this.row + pos.row, this.col + pos.col);
    }

    equals(other) {
        return this.row === other.row && this.col === other.col;
    }

    isValid() {
        return this.row != null && this.col != null && this.row >= 0 && this.row < 8 && this.col >= 0 && this.col < 8;
    }
}