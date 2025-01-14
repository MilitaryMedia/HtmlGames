const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreElement = document.getElementById('scoreValue');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Visual constants
const COLORS = {
    background: '#001a00',
    gridLines: '#003300',
    snakeGradient: ['#00ff00', '#008800'],
    foodGlow: '#ff3300',
    foodColor: '#ff0000'
};

// Pre-create gradients
const backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
backgroundGradient.addColorStop(0, '#001a00');
backgroundGradient.addColorStop(1, '#002200');

const snakeGradient = ctx.createLinearGradient(0, 0, gridSize, gridSize);
snakeGradient.addColorStop(0, COLORS.snakeGradient[0]);
snakeGradient.addColorStop(1, COLORS.snakeGradient[1]);

let snake = [
    { x: 10, y: 10 },
];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let gameOver = false;

document.addEventListener('keydown', handleKeyPress);
restartBtn.addEventListener('click', restartGame);
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

function handleKeyPress(e) {
    switch(e.key) {
        case 'ArrowUp':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
}

function gameLoop() {
    if (gameOver) return;
    
    setTimeout(() => {
        clearCanvas();
        moveSnake();
        drawFood();
        drawSnake();
        checkCollision();
        gameLoop();
    }, 100);
}

function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function drawSnake() {
    ctx.save();
    
    // Draw snake body segments
    for (let i = snake.length - 1; i >= 0; i--) {
        const segment = snake[i];
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, 5);
        
        // Head has different styling
        if (i === 0) {
            ctx.shadowColor = COLORS.snakeGradient[0];
            ctx.shadowBlur = 10;
            ctx.fillStyle = snakeGradient;
        } else {
            ctx.fillStyle = `rgba(0, ${Math.max(255 - (i * 15), 100)}, 0, 0.9)`;
        }
        ctx.fill();
        
        // Add eyes to head
        if (i === 0) {
            const eyeSize = 3;
            ctx.fillStyle = 'white';
            
            // Position eyes based on direction
            let eyeX1, eyeX2, eyeY1, eyeY2;
            if (dx === 1) { // Moving right
                eyeX1 = eyeX2 = x + gridSize - 8;
                eyeY1 = y + 6; eyeY2 = y + gridSize - 8;
            } else if (dx === -1) { // Moving left
                eyeX1 = eyeX2 = x + 6;
                eyeY1 = y + 6; eyeY2 = y + gridSize - 8;
            } else if (dy === 1) { // Moving down
                eyeY1 = eyeY2 = y + gridSize - 8;
                eyeX1 = x + 6; eyeX2 = x + gridSize - 8;
            } else { // Moving up or still
                eyeY1 = eyeY2 = y + 6;
                eyeX1 = x + 6; eyeX2 = x + gridSize - 8;
            }
            
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;
    
    ctx.save();
    
    // Add glow effect
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 15;
    
    // Draw apple shape
    ctx.beginPath();
    ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.foodColor;
    ctx.fill();
    
    // Add stem
    ctx.beginPath();
    ctx.moveTo(x + gridSize/2, y + gridSize/4);
    ctx.quadraticCurveTo(x + gridSize/2 + 3, y + gridSize/6, x + gridSize/2 + 3, y + gridSize/3);
    ctx.strokeStyle = '#663300';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add shine
    ctx.beginPath();
    ctx.arc(x + gridSize/3, y + gridSize/3, gridSize/8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    
    ctx.restore();
}

function draw() {
    // Draw background
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawSnake();
    drawFood();
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
    }
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Check if food spawned on snake
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generateFood();
    }
}

function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver = true;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
        }
    }
    
    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', canvas.width/4, canvas.height/2);
    }
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    dx = 0;
    dy = 0;
    score = 0;
    gameOver = false;
    scoreElement.textContent = score;
    gameLoop();
}

// Start the game
gameLoop(); 