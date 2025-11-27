class Profile {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        await this.loadUserStats();
        await this.loadGamesHistory();
        
        // Добавляем обработчики
        document.getElementById('logout-btn').addEventListener('click', this.logout);
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme);
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                this.displayUserInfo(user);
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            window.location.href = 'login.html';
        }
    }

    async loadUserStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.displayStats(stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadGamesHistory() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/user/games', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const games = await response.json();
                this.displayGamesHistory(games);
            }
        } catch (error) {
            console.error('Error loading games history:', error);
        }
    }

    displayUserInfo(user) {
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-joined').textContent = new Date(user.createdAt).toLocaleDateString('ru-RU');
    }

    displayStats(stats) {
        document.getElementById('total-games').textContent = stats.totalGames || 0;
        document.getElementById('best-score').textContent = stats.bestScore || 0;
        document.getElementById('avg-score').textContent = Math.round(stats.averageScore) || 0;
        document.getElementById('best-time').textContent = stats.bestTime || 0;
    }

    displayGamesHistory(games) {
        const historyContainer = document.getElementById('games-history');
        
        if (games.length === 0) {
            historyContainer.innerHTML = '<p>Пока нет сыгранных игр</p>';
            return;
        }

        historyContainer.innerHTML = games.map(game => `
            <div class="game-record ${game.score > 50 ? 'win' : ''}">
                <div class="game-info">
                    <div class="game-stat">
                        <div class="label">Счет</div>
                        <div class="value">${game.score}</div>
                    </div>
                    <div class="game-stat">
                        <div class="label">Время</div>
                        <div class="value">${game.time}с</div>
                    </div>
                    <div class="game-stat">
                        <div class="label">Дата</div>
                        <div class="value">${new Date(game.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Profile();
}); 