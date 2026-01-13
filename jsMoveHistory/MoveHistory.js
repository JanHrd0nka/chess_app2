export class MoveHistory {
    constructor(elementId) {
        this.history = [];
        this.currentIndex = -1;
        this.element = document.getElementById(elementId);
    }

    addMove(moveNumber) {
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push(moveNumber);
        this.currentIndex = this.history.length - 1;
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('move-table');

        for (let i = 0; i < this.history.length; i += 2) {
            const row = document.createElement('tr');

            const moveNumberCell = document.createElement('td');
            moveNumberCell.textContent = (i / 2 + 1) + ".";
            row.appendChild(moveNumberCell);

            const whiteMoveCell = document.createElement('td');
            whiteMoveCell.textContent = this.formatMove(this.history[i]);
            if (i === this.currentIndex) {
                whiteMoveCell.classList.add('current-move');
            }
            row.appendChild(whiteMoveCell);

            const blackMoveCell = document.createElement('td');
            if (this.history[i + 1] !== undefined) {
                blackMoveCell.textContent = this.formatMove(this.history[i + 1]);
                if (i + 1 === this.currentIndex) {
                    blackMoveCell.classList.add('current-move');
                }
            }
            row.appendChild(blackMoveCell);

            table.appendChild(row);
        }

        this.element.appendChild(table);
    }

    formatMove(moveNumber) {
        const startCol = Math.floor(moveNumber / 1000);          // colFrom
        const startRow = Math.floor((moveNumber % 1000) / 100);  // rowFrom
        const endCol   = Math.floor((moveNumber % 100) / 10);    // colTo
        const endRow   = moveNumber % 10;                        // rowTo

        return `${this.indexToFile(startCol)}${8 - startRow}-${this.indexToFile(endCol)}${8 - endRow}`;
    }

    indexToFile(col) {
        return String.fromCharCode('a'.charCodeAt(0) + col);
    }

    stepBack() {
        if (this.currentIndex >= 0) {
            this.currentIndex--;
            this.render();
            return true;
        }
        return false;
    }

    stepForward() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.render();
            return true;
        }
        return false;
    }

    goToStart() {
        if (this.currentIndex >= 0){
            this.currentIndex = -1;
            this.render();
            return true;
        }
        return false;
    }

    goToEnd() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex = this.history.length - 1;
            this.render();
            return true;
        }
        return false;
    }

    getMovesHistory(){
        return this.history;
    }

    getCurrentIndex(){
        return this.currentIndex;
    }
}
