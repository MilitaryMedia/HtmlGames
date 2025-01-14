const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreElement = document.getElementById('scoreValue');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

// Game objects
const ballRadius = 8;
const paddleHeight = 15;
const paddleWidth = 100;
const brickRowCount = 5;
const brickColumnCount = 10;
const brickWidth = 50;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 25;

// Add at the top with other constants
const LEVELS = [
    // Level 1 - Basic pattern
    {
        brickRows: 3,
        brickCols: 8,
        brickColor: '#ff0000',
        ballSpeed: 4,
        paddleWidth: 100
    },
    // Level 2 - More bricks, faster ball
    {
        brickRows: 4,
        brickCols: 9,
        brickColor: '#ff6600',
        ballSpeed: 5,
        paddleWidth: 90
    },
    // Level 3 - Full grid, even faster
    {
        brickRows: 5,
        brickCols: 10,
        brickColor: '#ffff00',
        ballSpeed: 6,
        paddleWidth: 80
    }
];

let score = 0;
let gameOver = false;

let ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4
};

let paddle = {
    x: (canvas.width - paddleWidth) / 2,
    y: canvas.height - paddleHeight - 10
};

let bricks = [];
let currentLevel = 0;
let levelScore = 0;
let isTransitioning = false;

// Add new visual constants
const BRICK_COLORS = [
    ['#ff0000', '#cc0000'], // Level 1 - Red
    ['#ff6600', '#cc4400'], // Level 2 - Orange
    ['#ffff00', '#cccc00']  // Level 3 - Yellow
];

const PADDLE_GRADIENT = {
    start: '#4488ff',
    end: '#1155cc'
};

const BALL_COLOR = '#ffffff';
const BALL_GLOW = '#4488ff';

// Cache frequently used values
const width = canvas.width;
const height = canvas.height;

// Optimize gradients by pre-creating them
const backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
backgroundGradient.addColorStop(0, '#000000');
backgroundGradient.addColorStop(1, '#111111');

// Pre-create brick gradients for each level
const brickGradients = BRICK_COLORS.map(colors => {
    const gradient = ctx.createLinearGradient(0, 0, 0, brickHeight);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
});

// Pre-create paddle gradient
const paddleGradient = ctx.createLinearGradient(0, 0, 0, paddleHeight);
paddleGradient.addColorStop(0, PADDLE_GRADIENT.start);
paddleGradient.addColorStop(1, PADDLE_GRADIENT.end);

// Event listeners
document.addEventListener('mousemove', movePaddle);
restartBtn.addEventListener('click', restartGame);
backBtn.addEventListener('click', () => window.location.href = 'index.html');

function movePaddle(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddleWidth/2;
    }
}

function collisionDetection() {
    const level = LEVELS[currentLevel];
    let bricksRemaining = 0;
    
    for(let c = 0; c < level.brickCols; c++) {
        for(let r = 0; r < level.brickRows; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                bricksRemaining++;
                if(ball.x > b.x && ball.x < b.x + brickWidth && 
                   ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    break; // Exit after first collision
                }
            }
        }
    }
    
    if(bricksRemaining === 0 && !isTransitioning) {
        nextLevel();
    }
}

function drawBall() {
    ctx.save();
    ctx.shadowColor = BALL_GLOW;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = BALL_COLOR;
    ctx.fill();
    
    // Simplified shine effect
    ctx.beginPath();
    ctx.arc(ball.x - ballRadius/3, ball.y - ballRadius/3, ballRadius/3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
    ctx.restore();
}

function drawPaddle() {
    ctx.save();
    ctx.shadowColor = PADDLE_GRADIENT.start;
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddleHeight, 5);
    ctx.fillStyle = paddleGradient;
    ctx.fill();
    
    ctx.restore();
}

function drawBricks() {
    const level = LEVELS[currentLevel];
    ctx.save();
    ctx.shadowBlur = 5;
    
    for(let c = 0; c < level.brickCols; c++) {
        for(let r = 0; r < level.brickRows; r++) {
            if(bricks[c][r].status === 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.shadowColor = BRICK_COLORS[currentLevel][0];
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 3);
                ctx.fillStyle = brickGradients[currentLevel];
                ctx.fill();
            }
        }
    }
    
    ctx.restore();
}

function draw() {
    if (gameOver || isTransitioning) return;
    
    // Clear canvas with background
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw game elements
    drawBricks();
    drawBall();
    drawPaddle();
    
    // Score and level display
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Level: ' + (currentLevel + 1), 10, 25);
    ctx.fillText('Score: ' + score, width - 70, 25);
    
    // Ball movement and collision
    if(ball.x + ball.dx > width - ballRadius || ball.x + ball.dx < ballRadius) {
        ball.dx = -ball.dx;
    }
    
    if(ball.y + ball.dy < ballRadius) {
        ball.dy = -ball.dy;
    } else if(ball.y + ball.dy > height - ballRadius) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            let hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
            ball.dx = LEVELS[currentLevel].ballSpeed * hitPoint;
            ball.dy = -ball.dy;
        } else {
            gameOver = true;
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER!', width/2, height/2);
            return;
        }
    }
    
    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Collision detection
    collisionDetection();
    
    requestAnimationFrame(draw);
}

function restartGame() {
    score = 0;
    levelScore = 0;
    currentLevel = 0;
    gameOver = false;
    scoreElement.textContent = score;
    
    initLevel();
    draw();
}

function initLevel() {
    const level = LEVELS[currentLevel];
    
    // Reset ball and paddle
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = level.ballSpeed * (Math.random() < 0.5 ? 1 : -1);
    ball.dy = -level.ballSpeed;
    
    paddle.width = level.paddleWidth;
    paddle.x = (canvas.width - paddle.width) / 2;
    
    // Initialize bricks for current level
    bricks = [];
    for(let c = 0; c < level.brickCols; c++) {
        bricks[c] = [];
        for(let r = 0; r < level.brickRows; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
    
    levelScore = 0;
    isTransitioning = false;
}

function nextLevel() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    setTimeout(() => {
        currentLevel++;
        if (currentLevel < LEVELS.length) {
            initLevel();
            isTransitioning = false;
            draw();
        } else {
            gameOver = true;
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('YOU WIN!', width/2, height/2);
        }
    }, 1000);
}

// Initialize the game
initLevel();
draw(); 