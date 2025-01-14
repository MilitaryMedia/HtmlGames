const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

const BLOCK_SIZE = 30;
const ROWS = 20;
const COLS = 10;

const COLORS = [
    null,
    '#FF0000', // I - Red
    '#00FF00', // J - Green
    '#0000FF', // L - Blue
    '#FFFF00', // O - Yellow
    '#00FFFF', // S - Cyan
    '#FF00FF', // T - Magenta
    '#FFA500'  // Z - Orange
];

// Tetromino shapes in their upright position
const SHAPES = [
    [],
    [[0, 0, 0, 0],
     [1, 1, 1, 1],
     [0, 0, 0, 0],
     [0, 0, 0, 0]], // I

    [[2, 0, 0],
     [2, 2, 2],
     [0, 0, 0]], // J

    [[0, 0, 3],
     [3, 3, 3],
     [0, 0, 0]], // L

    [[4, 4],
     [4, 4]], // O

    [[0, 5, 5],
     [5, 5, 0],
     [0, 0, 0]], // S

    [[0, 6, 0],
     [6, 6, 6],
     [0, 0, 0]], // T

    [[7, 7, 0],
     [0, 7, 7],
     [0, 0, 0]]  // Z
];

let board = createBoard();
let score = 0;
let lines = 0;
let level = 1;
let gameOver = false;
let dropInterval = 1000;
let lastDrop = 0;
let piece = null;
let nextPiece = null;
let isPlaying = false;

function createBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

function drawBlock(x, y, color, ctx = canvas.getContext('2d'), size = BLOCK_SIZE) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size - 1, size - 1);
    
    // Add 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(x * size, y * size, size - 1, 2); // Top highlight
    ctx.fillRect(x * size, y * size, 2, size - 1); // Left highlight
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x * size + size - 3, y * size, 2, size - 1); // Right shadow
    ctx.fillRect(x * size, y * size + size - 3, size - 1, 2); // Bottom shadow
}

function draw() {
    // Clear canvases
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(x, y, COLORS[value]);
            }
        });
    });
    
    // Draw current piece
    if (piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(x + piece.x, y + piece.y, COLORS[value]);
                }
            });
        });
    }
    
    // Draw next piece
    if (nextPiece) {
        const offsetX = 1;
        const offsetY = 1;
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(x + offsetX, y + offsetY, COLORS[value], nextCtx);
                }
            });
        });
    }
}

function createPiece(shape = null) {
    const shapeIndex = shape ?? Math.floor(Math.random() * 7) + 1;
    const newShape = SHAPES[shapeIndex].map(row => [...row]); // Deep copy
    return {
        shape: newShape,
        x: Math.floor((COLS - newShape[0].length) / 2),
        y: 0
    };
}

function collides(piece, board) {
    return piece.shape.some((row, dy) => {
        return row.some((value, dx) => {
            if (!value) return false;
            const newX = piece.x + dx;
            const newY = piece.y + dy;
            return newX < 0 || 
                   newX >= COLS || 
                   newY >= ROWS || 
                   (newY >= 0 && board[newY][newX]);
        });
    });
}

function rotate(piece, dir = 1) {
    // Create a new rotated shape
    const newShape = piece.shape.map((row, i) => 
        row.map((_, j) => 
            dir > 0 
                ? piece.shape[piece.shape.length - 1 - j][i]
                : piece.shape[j][piece.shape.length - 1 - i]
        )
    );
    
    const newPiece = {
        ...piece,
        shape: newShape
    };
    
    // Wall kick
    let offset = 0;
    while (collides(newPiece, board)) {
        newPiece.x += offset;
        offset = offset > 0 ? -(offset + 1) : -(offset - 1);
        if (Math.abs(offset) > piece.shape[0].length) {
            return; // Can't rotate
        }
    }
    
    piece.shape = newPiece.shape;
    piece.x = newPiece.x;
}

function merge(piece, board) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + piece.y][x + piece.x] = value;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++; // Check the same row again
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += [40, 100, 300, 1200][linesCleared - 1] * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
    }
}

function gameLoop(time = 0) {
    if (!isPlaying || gameOver) return;
    
    const deltaTime = time - lastDrop;
    
    if (deltaTime > dropInterval) {
        piece.y++;
        if (collides(piece, board)) {
            piece.y--;
            merge(piece, board);
            clearLines();
            piece = nextPiece;
            nextPiece = createPiece();
            
            if (collides(piece, board)) {
                gameOver = true;
                isPlaying = false;
                startBtn.style.display = 'none';
                restartBtn.style.display = 'block';
                return;
            }
        }
        lastDrop = time;
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

function handleKeyPress(e) {
    if (!isPlaying || gameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            piece.x--;
            if (collides(piece, board)) piece.x++;
            break;
        case 'ArrowRight':
            piece.x++;
            if (collides(piece, board)) piece.x--;
            break;
        case 'ArrowDown':
            piece.y++;
            if (collides(piece, board)) {
                piece.y--;
                merge(piece, board);
                clearLines();
                piece = nextPiece;
                nextPiece = createPiece();
                if (collides(piece, board)) {
                    gameOver = true;
                    isPlaying = false;
                    startBtn.style.display = 'none';
                    restartBtn.style.display = 'block';
                }
            }
            lastDrop = performance.now();
            break;
        case 'ArrowUp':
            rotate(piece);
            break;
        case ' ':
            while (!collides(piece, board)) {
                piece.y++;
                score += 1;
            }
            piece.y--;
            scoreElement.textContent = score;
            break;
    }
    draw();
}

function startGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    isPlaying = true;
    dropInterval = 1000;
    piece = createPiece();
    nextPiece = createPiece();
    
    scoreElement.textContent = score;
    linesElement.textContent = lines;
    levelElement.textContent = level;
    
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    
    lastDrop = performance.now();
    gameLoop();
}

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
backBtn.addEventListener('click', () => window.location.href = 'index.html');

// Initial draw
draw(); 