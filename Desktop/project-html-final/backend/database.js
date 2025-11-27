const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';

class Database {
    constructor() {
        this.users = [];
        this.games = [];
        this.init();
    }

    init() {
        // Создаем тестового пользователя для демонстрации
        this.createUser('demo', 'demo@example.com', bcrypt.hashSync('password', 10));
    }

    // User methods
    createUser(username, email, password) {
        const user = {
            id: this.users.length + 1,
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        this.users.push(user);
        return user;
    }

    getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    // Game methods

    saveGame(userId, score, time, level = 1) {
        const game = {
            id: this.games.length + 1,
            userId,
            score,
            time,
            level,
            date: new Date().toISOString()
        };
        this.games.push(game);
        return game;
    }

    getUserGames(userId) {
        return this.games
            .filter(game => game.userId === userId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10); // Последние 10 игр
    }

    getUserStats(userId) {
        const userGames = this.games.filter(game => game.userId === userId);

        if (userGames.length === 0) {
            return {
                totalGames: 0,
                bestScore: 0,
                averageScore: 0,
                bestTime: 0
            };
        }

        const totalGames = userGames.length;
        const bestScore = Math.max(...userGames.map(game => game.score));
        const averageScore = userGames.reduce((sum, game) => sum + game.score, 0) / totalGames;
        const bestTime = Math.min(...userGames.map(game => game.time));

        return {
            totalGames,
            bestScore,
            averageScore,
            bestTime: bestTime === Infinity ? 0 : bestTime
        };
    }

    // Token verification
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return this.getUserById(decoded.id);
        } catch (error) {
            return null;
        }
    }
}

module.exports = new Database();