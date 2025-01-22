class Minesweeper {
    constructor() {
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.board = [];
        this.mineLocations = new Set();
        this.flaggedCells = new Set();
        this.revealedCells = new Set();
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        
        this.initializeDOM();
        this.setDifficulty('beginner');
        this.setupEventListeners();
    }
    
    initializeDOM() {
        this.boardElement = document.getElementById('gameBoard');
        this.mineCountElement = document.getElementById('mineCount');
        this.timerElement = document.getElementById('timer');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.gameOverText = document.getElementById('gameOverText');
        this.finalTimeElement = document.getElementById('finalTime');
        
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.gameOverModal.style.display = 'none';
            this.newGame();
        });
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.difficulty-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });
    }
    
    setDifficulty(difficulty) {
        this.currentDifficulty = this.difficulties[difficulty];
        this.newGame();
    }
    
    newGame() {
        this.board = [];
        this.mineLocations.clear();
        this.flaggedCells.clear();
        this.revealedCells.clear();
        this.gameOver = false;
        this.firstClick = true;
        
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerElement.textContent = '0';
        
        this.createBoard();
        this.renderBoard();
        this.updateMineCount();
    }
    
    createBoard() {
        const { rows, cols } = this.currentDifficulty;
        
        // Initialize empty board
        for (let i = 0; i < rows; i++) {
            this.board[i] = new Array(cols).fill(0);
        }
    }
    
    placeMines(firstClickRow, firstClickCol) {
        const { rows, cols, mines } = this.currentDifficulty;
        
        while (this.mineLocations.size < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);
            const key = `${row},${col}`;
            
            // Don't place mine at first click or adjacent to it
            if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
                continue;
            }
            
            if (!this.mineLocations.has(key)) {
                this.mineLocations.add(key);
                this.board[row][col] = 'M';
                
                // Update adjacent cell numbers
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        
                        const newRow = row + i;
                        const newCol = col + j;
                        
                        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                            if (this.board[newRow][newCol] !== 'M') {
                                this.board[newRow][newCol]++;
                            }
                        }
                    }
                }
            }
        }
    }
    
    renderBoard() {
        const { rows, cols } = this.currentDifficulty;
        
        this.boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
        this.boardElement.innerHTML = '';
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    updateMineCount() {
        this.mineCountElement.textContent = 
            this.currentDifficulty.mines - this.flaggedCells.size;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }
    
    revealCell(row, col) {
        if (this.gameOver || this.flaggedCells.has(`${row},${col}`)) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        const cell = this.board[row][col];
        const key = `${row},${col}`;
        
        if (this.revealedCells.has(key)) return;
        
        this.revealedCells.add(key);
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('revealed');
        
        if (cell === 'M') {
            this.gameOver = true;
            cellElement.classList.add('mine');
            cellElement.textContent = '💣';
            this.revealAllMines();
            this.endGame(false);
            return;
        }
        
        if (cell > 0) {
            cellElement.textContent = cell;
            cellElement.dataset.number = cell;
        } else {
            // Reveal adjacent cells for empty cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    
                    const newRow = row + i;
                    const newCol = col + j;
                    
                    if (newRow >= 0 && newRow < this.currentDifficulty.rows &&
                        newCol >= 0 && newCol < this.currentDifficulty.cols) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
        
        // Check for win
        if (this.revealedCells.size + this.mineLocations.size === 
            this.currentDifficulty.rows * this.currentDifficulty.cols) {
            this.endGame(true);
        }
    }
    
    toggleFlag(row, col) {
        if (this.gameOver || this.revealedCells.has(`${row},${col}`)) return;
        
        const key = `${row},${col}`;
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (this.flaggedCells.has(key)) {
            this.flaggedCells.delete(key);
            cellElement.textContent = '';
            cellElement.classList.remove('flagged');
        } else {
            this.flaggedCells.add(key);
            cellElement.textContent = '🚩';
            cellElement.classList.add('flagged');
        }
        
        this.updateMineCount();
    }
    
    revealAllMines() {
        this.mineLocations.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cellElement.classList.add('revealed', 'mine');
            cellElement.textContent = '💣';
        });
    }
    
    endGame(won) {
        clearInterval(this.timerInterval);
        this.gameOver = true;
        
        this.gameOverText.textContent = won ? 'You Won! 🎉' : 'Game Over! 💣';
        this.finalTimeElement.textContent = this.timer;
        this.gameOverModal.style.display = 'flex';
    }
    
    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.revealCell(row, col);
        });
        
        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.toggleFlag(row, col);
        });
    }
}

// Start the game
const game = new Minesweeper(); 