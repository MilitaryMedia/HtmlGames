const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

// Game objects
let player = {
    x: canvas.width / 2 - 40/2,
    y: canvas.height - 50 - 10,
    width: 40,
    height: 50,
    speed: 5
};

let bullets = [];
let enemies = [];
let score = 0;
let gameOver = false;
let keys = {};

// Event Listeners
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);
document.addEventListener('keypress', shootBullet);
restartBtn.addEventListener('click', restartGame);
backBtn.addEventListener('click', () => window.location.href = 'index.html');

// Add new constants for ship design
const SHIP_WIDTH = 40;
const SHIP_HEIGHT = 50;

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + SHIP_WIDTH/2, player.y + SHIP_HEIGHT/2);
    
    // Draw ship body
    ctx.beginPath();
    ctx.moveTo(0, -SHIP_HEIGHT/2);  // Top point
    ctx.lineTo(-SHIP_WIDTH/2, SHIP_HEIGHT/2);  // Bottom left
    ctx.lineTo(0, SHIP_HEIGHT/3);   // Bottom middle indent
    ctx.lineTo(SHIP_WIDTH/2, SHIP_HEIGHT/2);   // Bottom right
    ctx.closePath();
    
    // Create gradient for ship
    let gradient = ctx.createLinearGradient(0, -SHIP_HEIGHT/2, 0, SHIP_HEIGHT/2);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#008800');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add engine glow
    ctx.beginPath();
    ctx.moveTo(-SHIP_WIDTH/4, SHIP_HEIGHT/3);
    ctx.lineTo(0, SHIP_HEIGHT/2);
    ctx.lineTo(SHIP_WIDTH/4, SHIP_HEIGHT/3);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    
    ctx.restore();
}

function drawBullet(bullet) {
    ctx.save();
    
    // Create gradient for bullet
    let gradient = ctx.createRadialGradient(
        bullet.x + bullet.width/2, bullet.y + bullet.height/2, 0,
        bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2
    );
    gradient.addColorStop(0, '#ffff00');
    gradient.addColorStop(1, '#ff6600');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
        bullet.x + bullet.width/2, 
        bullet.y + bullet.height/2, 
        bullet.width/2, 
        bullet.height, 
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    ctx.restore();
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    
    // Draw enemy ship body
    ctx.beginPath();
    ctx.moveTo(0, enemy.height/2);  // Bottom point
    ctx.lineTo(-enemy.width/2, -enemy.height/2);  // Top left
    ctx.lineTo(0, -enemy.height/6);   // Top middle indent
    ctx.lineTo(enemy.width/2, -enemy.height/2);   // Top right
    ctx.closePath();
    
    // Create gradient for enemy
    let gradient = ctx.createLinearGradient(0, -enemy.height/2, 0, enemy.height/2);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#880000');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add engine glow
    ctx.beginPath();
    ctx.moveTo(-enemy.width/4, -enemy.height/3);
    ctx.lineTo(0, -enemy.height/2);
    ctx.lineTo(enemy.width/4, -enemy.height/3);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    
    ctx.restore();
}

function shootBullet(e) {
    if (e.code === 'Space' && !gameOver) {
        bullets.push({
            x: player.x + SHIP_WIDTH/2 - 2,
            y: player.y,
            width: 4,
            height: 12,
            speed: 7
        });
    }
}

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function createEnemy() {
    if (Math.random() < 0.02 && !gameOver) {
        enemies.push({
            x: Math.random() * (canvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            speed: 2
        });
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Check collision with player
        if (checkCollision(enemies[i], player)) {
            gameOver = true;
        }
        
        // Check collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(enemies[i], bullets[j])) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                scoreElement.textContent = score;
                break;
            }
        }
        
        // Remove enemies that pass the bottom
        if (enemies[i] && enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add starfield effect
    drawStars();
    
    // Draw player
    drawPlayer();
    
    // Draw bullets
    bullets.forEach(bullet => drawBullet(bullet));
    
    // Draw enemies
    enemies.forEach(enemy => drawEnemy(enemy));
    
    // Draw game over
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over!', canvas.width/4, canvas.height/2);
    }
}

// Add starfield effect
const stars = Array(100).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2
}));

function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Move stars down slowly
        star.y += 0.5;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function gameLoop() {
    if (!gameOver) {
        movePlayer();
        createEnemy();
        updateBullets();
        updateEnemies();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    player.x = canvas.width / 2 - SHIP_WIDTH/2;
    bullets = [];
    enemies = [];
    score = 0;
    gameOver = false;
    scoreElement.textContent = score;
}

// Start the game
gameLoop(); 