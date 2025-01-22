document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const game = card.dataset.game;
        
        switch(game) {
            case 'snake':
                window.location.href = 'snake.html';
                break;
            case 'space-shooter':
                window.location.href = 'space-shooter.html';
                break;
            case 'breakout':
                window.location.href = 'breakout.html';
                break;
            case 'tetris':
                window.location.href = 'tetris.html';
                break;
        }
    });
}); 