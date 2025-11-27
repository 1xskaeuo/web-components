// ============================================
// VILA EYSK - AUTHENTICATION SYSTEM
// Firebase Integration
// ============================================

class AuthSystem {
    constructor() {
        this.auth = null;
        this.database = null;
        this.googleProvider = null;
        this.facebookProvider = null;
        this.initializeFirebase();
    }

    // ========================================
    // FIREBASE INITIALIZATION
    // ========================================
    
    initializeFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK не загружен');
            }

            // Firebase конфигурация
            const firebaseConfig = {
                apiKey: "AIzaSyAnSLyg8LsmCP3EcpmL6DvarTlP02nLpGI",
                authDomain: "project-14b49.firebaseapp.com",
                databaseURL: "https://project-14b49-default-rtdb.firebaseio.com",
                projectId: "project-14b49",
                storageBucket: "project-14b49.firebasestorage.app",
                messagingSenderId: "592957164246",
                appId: "1:592957164246:web:cb05f0e70b16ab1d64d777"
            };

            console.log('🔄 Инициализация Firebase...');

            // Инициализация
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.auth = firebase.auth();
            this.database = firebase.database();
            
            // Провайдеры
            this.googleProvider = new firebase.auth.GoogleAuthProvider();
            this.facebookProvider = new firebase.auth.FacebookAuthProvider();

            console.log('✅ Firebase инициализирован');

            // Настройка UI и проверка авторизации
            this.setupUI();
            this.checkAuthState();

        } catch (error) {
            console.error('❌ Ошибка Firebase:', error);
            this.showNotification('Ошибка подключения к серверу', 'error');
        }
    }

    // ========================================
    // UI SETUP
    // ========================================

    setupUI() {
        this.setupParticles();
        this.setupForms();
    }

    setupParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        particlesContainer.innerHTML = '';

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particlesContainer.appendChild(particle);
        }
    }

    setupForms() {
        // Форма входа
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            const passwordInput = document.getElementById('registerPassword');
            if (passwordInput) {
                passwordInput.addEventListener('input', (e) => 
                    this.checkPasswordStrength(e.target.value)
                );
            }
        }

        // Социальные кнопки
        document.querySelectorAll('.social-btn.google').forEach(btn => {
            btn.addEventListener('click', () => this.handleGoogleLogin());
        });

        document.querySelectorAll('.social-btn.facebook').forEach(btn => {
            btn.addEventListener('click', () => this.handleFacebookLogin());
        });
    }

    // ========================================
    // AUTHENTICATION STATE (ИСПРАВЛЕНО ✅)
    // ========================================

    checkAuthState() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ Пользователь уже авторизован:', user.email);
                
                // Если на странице логина - перенаправляем
                const currentPage = window.location.pathname;
                if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
                    console.log('🔄 Перенаправление в личный кабинет...');
                    // ✅ ПРАВИЛЬНО: account.html в той же папке html/
                    window.location.replace('account.html');
                }
            } else {
                console.log('ℹ️ Пользователь не авторизован');
                
                // Если на странице account.html - перенаправляем на login
                const currentPage = window.location.pathname;
                if (currentPage.includes('account.html')) {
                    console.log('🔄 Перенаправление на страницу входа...');
                    // ✅ ПРАВИЛЬНО: login.html в той же папке html/
                    window.location.replace('login.html');
                }
            }
        });
    }

    // ========================================
    // AUTHENTICATION METHODS (ИСПРАВЛЕНО ✅)
    // ========================================

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, 'Вход...');

        try {
            // Установка persistence (запоминание сессии)
            const persistence = rememberMe ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            await this.auth.setPersistence(persistence);

            // Вход
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('✅ Успешный вход:', user.email);
            this.showNotification('Добро пожаловать!', 'success');
            
            // ✅ ПРАВИЛЬНО: Перенаправление в account.html (та же папка html/)
            setTimeout(() => {
                window.location.replace('account.html');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showNotification(this.getAuthErrorMessage(error), 'error');
            this.setButtonNormal(submitBtn, originalText);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone')?.value.trim() || '';
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Валидация
        if (!firstName || !lastName) {
            this.showNotification('Введите имя и фамилию', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, 'Создание аккаунта...');

        try {
            // Создание пользователя
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Обновление профиля
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });

            // Создание профиля в базе данных
            await this.createUserProfile(user.uid, {
                firstName,
                lastName,
                email,
                phone,
                photoURL: user.photoURL
            });

            console.log('✅ Регистрация успешна:', user.email);
            this.showNotification('Аккаунт создан! Добро пожаловать!', 'success');
            
            // ✅ ПРАВИЛЬНО: Перенаправление в account.html (та же папка html/)
            setTimeout(() => {
                window.location.replace('account.html');
            }, 1000);

        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            this.showNotification(this.getAuthErrorMessage(error), 'error');
            this.setButtonNormal(submitBtn, originalText);
        }
    }

    async handleGoogleLogin() {
        try {
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;

            console.log('✅ Google вход:', user.email);

            // Проверяем, есть ли профиль в базе
            await this.ensureUserProfile(user);

            this.showNotification('Вход через Google выполнен!', 'success');
            
            // ✅ ПРАВИЛЬНО: Перенаправление в account.html (та же папка html/)
            setTimeout(() => {
                window.location.replace('account.html');
            }, 1000);

        } catch (error) {
            console.error('❌ Ошибка Google:', error);
            
            if (error.code !== 'auth/popup-closed-by-user') {
                this.showNotification(this.getAuthErrorMessage(error), 'error');
            }
        }
    }

    async handleFacebookLogin() {
        try {
            const result = await this.auth.signInWithPopup(this.facebookProvider);
            const user = result.user;

            console.log('✅ Facebook вход:', user.email);

            await this.ensureUserProfile(user);

            this.showNotification('Вход через Facebook выполнен!', 'success');
            
            // ✅ ПРАВИЛЬНО: Перенаправление в account.html (та же папка html/)
            setTimeout(() => {
                window.location.replace('account.html');
            }, 1000);

        } catch (error) {
            console.error('❌ Ошибка Facebook:', error);
            
            if (error.code !== 'auth/popup-closed-by-user') {
                this.showNotification(this.getAuthErrorMessage(error), 'error');
            }
        }
    }

    // ========================================
    // DATABASE METHODS
    // ========================================

    async createUserProfile(uid, userData) {
        const profileData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            photoURL: userData.photoURL || null,
            registeredAt: firebase.database.ServerValue.TIMESTAMP,
            stats: {
                totalStays: 0,
                totalNights: 0,
                totalSpent: 0,
                totalSaved: 0,
                loyaltyLevel: 'guest',
                loyaltyPoints: 0
            },
            favorites: [],
            bookings: []
        };

        await this.database.ref('users/' + uid).set(profileData);
        console.log('✅ Профиль создан в базе данных');
    }

    async ensureUserProfile(user) {
        const userRef = this.database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            const nameParts = user.displayName ? user.displayName.split(' ') : ['User'];
            
            await this.createUserProfile(user.uid, {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
                photoURL: user.photoURL
            });
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const levels = [
            { message: 'Слабый', color: '#ff4444' },
            { message: 'Слабый', color: '#ff4444' },
            { message: 'Средний', color: '#ffa500' },
            { message: 'Хороший', color: '#4CAF50' },
            { message: 'Отличный', color: '#4CAF50' }
        ];

        const level = levels[strength] || levels[0];

        strengthIndicator.innerHTML = `
            <div class="strength-bar" style="background: ${level.color}; width: ${strength * 20}%; height: 4px; border-radius: 2px; transition: all 0.3s;"></div>
            <span style="color: ${level.color}; font-size: 12px; margin-top: 5px; display: block;">${level.message} пароль</span>
        `;
    }

    getAuthErrorMessage(error) {
        const messages = {
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-email': 'Неверный формат email',
            'auth/user-disabled': 'Аккаунт заблокирован',
            'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
            'auth/email-already-in-use': 'Email уже используется',
            'auth/weak-password': 'Слишком слабый пароль',
            'auth/popup-closed-by-user': 'Окно входа закрыто',
            'auth/popup-blocked': 'Всплывающее окно заблокировано браузером',
            'auth/network-request-failed': 'Ошибка сети. Проверьте подключение',
            'auth/invalid-credential': 'Неверные учетные данные'
        };

        return messages[error.code] || error.message;
    }

    setButtonLoading(button, text) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }

    setButtonNormal(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: '#4CAF50',
            error: '#ff4444',
            info: '#2196F3'
        };

        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: colors[type],
            color: 'white',
            borderRadius: '10px',
            zIndex: '10000',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease',
            fontSize: '14px',
            fontWeight: '500'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = event.target.closest('button');
    if (!button) return;
    
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск системы аутентификации...');
    window.authSystem = new AuthSystem();
});

// ========================================
// STYLES
// ========================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }

    .particle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        animation: float linear infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
    }
`;
document.head.appendChild(style);