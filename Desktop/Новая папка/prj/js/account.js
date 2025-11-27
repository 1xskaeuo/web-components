// ============================================
// VILA EYSK - ACCOUNT MANAGER
// Полная рабочая версия с Firebase
// ============================================

console.log('🚀 Account.js загружен');

class AccountManager {
    constructor() {
        console.log('👤 Создание AccountManager...');
        
        // Firebase
        this.auth = null;
        this.database = null;
        this.currentFirebaseUser = null;
        
        // Демо-данные пользователя (будут заменены на реальные из Firebase)
        this.currentUser = {
            id: 'demo-user-123',
            firstName: 'Иван',
            lastName: 'Петров',
            email: 'ivan.petrov@example.com',
            phone: '+7 (999) 123-45-67',
            registeredAt: new Date('2024-01-15'),
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
        
        // Уровни лояльности
        this.loyaltyLevels = {
            guest: { name: 'Гость', visits: 0, discount: 0, icon: 'fa-user', color: '#95a5a6' },
            bronze: { name: 'Бронзовый', visits: 5, discount: 5, icon: 'fa-medal', color: '#cd7f32' },
            silver: { name: 'Серебряный', visits: 10, discount: 10, icon: 'fa-award', color: '#c0c0c0' },
            gold: { name: 'Золотой', visits: 20, discount: 15, icon: 'fa-star', color: '#ffd700' },
            platinum: { name: 'Платиновый', visits: 50, discount: 25, icon: 'fa-crown', color: '#e5e4e2' }
        };
    }

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ FIREBASE
    // ============================================

    initializeFirebase() {
        console.log('🔥 Инициализация Firebase в AccountManager...');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен!');
            this.showNotification('Ошибка: Firebase не доступен', 'error');
            return false;
        }

        try {
            // Получаем экземпляры Firebase
            this.auth = firebase.auth();
            this.database = firebase.database();
            
            console.log('✅ Firebase инициализирован в AccountManager');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            this.showNotification('Ошибка подключения к серверу', 'error');
            return false;
        }
    }

    // ============================================
    // ПРОВЕРКА АВТОРИЗАЦИИ
    // ============================================

    checkAuth() {
        console.log('🔒 Проверка авторизации...');
        
        if (!this.auth) {
            console.error('❌ Firebase Auth не инициализирован');
            this.redirectToLogin();
            return;
        }

        // Показываем loader
        this.showLoader('Проверка авторизации...');

        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ Пользователь авторизован:', user.email);
                this.currentFirebaseUser = user;
                
                // Загружаем данные пользователя из базы
                await this.loadUserData(user.uid);
                
                // Обновляем UI
                this.hideLoader();
                this.renderUI();
                this.showNotification('Добро пожаловать, ' + this.currentUser.firstName + '!', 'success');
                
            } else {
                console.log('❌ Пользователь не авторизован');
                this.redirectToLogin();
            }
        });
    }

    // ============================================
    // ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ (ИСПРАВЛЕНО)
    // ============================================

    async loadUserData(uid) {
        console.log('📥 Загрузка данных пользователя из Firebase...');
        
        try {
            const userRef = this.database.ref('users/' + uid);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                console.log('✅ Данные загружены из Firebase:', userData);
                
                // ИСПРАВЛЕНО: Преобразуем объект бронирований в массив
                let bookingsArray = [];
                if (userData.bookings) {
                    // Если bookings - это объект с ключами (из Firebase)
                    if (typeof userData.bookings === 'object' && !Array.isArray(userData.bookings)) {
                        bookingsArray = Object.values(userData.bookings);
                        console.log('✅ Преобразовано объект бронирований в массив:', bookingsArray.length);
                    } else {
                        bookingsArray = userData.bookings;
                    }
                }
                
                console.log('📊 Найдено бронирований:', bookingsArray.length);
                
                // Обновляем текущего пользователя РЕАЛЬНЫМИ данными
                this.currentUser = {
                    id: uid,
                    firstName: userData.firstName || userData.name || this.currentFirebaseUser.displayName?.split(' ')[0] || 'Пользователь',
                    lastName: userData.lastName || this.currentFirebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                    email: userData.email || this.currentFirebaseUser.email,
                    phone: userData.phone || '',
                    registeredAt: userData.registeredAt ? new Date(userData.registeredAt) : new Date(),
                    stats: this.calculateStatsFromBookings(bookingsArray),
                    favorites: userData.favorites || [],
                    bookings: bookingsArray
                };
                
                console.log('✅ Профиль обновлен:', {
                    имя: this.currentUser.firstName,
                    бронирований: this.currentUser.bookings.length,
                    статус: this.currentUser.stats.loyaltyLevel
                });
                
            } else {
                console.log('ℹ️ Данные пользователя не найдены, создаем новый профиль...');
                await this.createUserProfile(uid);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.showNotification('Ошибка загрузки данных пользователя', 'error');
        }
    }

    // ============================================
    // РАСЧЕТ СТАТИСТИКИ ИЗ БРОНИРОВАНИЙ (НОВОЕ)
    // ============================================

    calculateStatsFromBookings(bookings) {
        console.log('📊 Расчет статистики из бронирований...');
        
        if (!bookings || bookings.length === 0) {
            return {
                totalStays: 0,
                totalNights: 0,
                totalSpent: 0,
                totalSaved: 0,
                loyaltyLevel: 'guest',
                loyaltyPoints: 0
            };
        }
        
        // Фильтруем только завершенные бронирования
        const completedBookings = bookings.filter(b => 
            b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_in'
        );
        
        const totalStays = completedBookings.length;
        const totalNights = completedBookings.reduce((sum, b) => sum + (b.nights || 0), 0);
        const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        
        // Рассчитываем скидки
        const totalSaved = completedBookings.reduce((sum, b) => {
            if (!b.discount || b.discount === 0) return sum;
            const originalPrice = b.totalPrice / (1 - b.discount / 100);
            return sum + (originalPrice - b.totalPrice);
        }, 0);
        
        // Определяем уровень лояльности
        const loyaltyLevel = this.calculateLoyaltyLevel(totalStays);
        const loyaltyPoints = totalStays * 100;
        
        const stats = {
            totalStays,
            totalNights,
            totalSpent: Math.round(totalSpent),
            totalSaved: Math.round(totalSaved),
            loyaltyLevel,
            loyaltyPoints
        };
        
        console.log('✅ Статистика рассчитана:', stats);
        return stats;
    }

    // ============================================
    // СОЗДАНИЕ ПРОФИЛЯ В БАЗЕ
    // ============================================

    async createUserProfile(uid) {
        console.log('📝 Создание нового профиля в базе...');
        
        try {
            const user = this.currentFirebaseUser;
            const nameParts = user.displayName ? user.displayName.split(' ') : ['Пользователь'];
            
            const profileData = {
                firstName: nameParts[0] || 'Пользователь',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
                photoURL: user.photoURL || null,
                registeredAt: Date.now(),
                stats: {
                    totalStays: 0,
                    totalNights: 0,
                    totalSpent: 0,
                    totalSaved: 0,
                    loyaltyLevel: 'guest',
                    loyaltyPoints: 0
                },
                favorites: [],
                bookings: {}
            };

            await this.database.ref('users/' + uid).set(profileData);
            console.log('✅ Профиль создан в Firebase');
            
            // Обновляем локальные данные
            this.currentUser = {
                id: uid,
                ...profileData,
                bookings: [],
                registeredAt: new Date()
            };
            
        } catch (error) {
            console.error('❌ Ошибка создания профиля:', error);
        }
    }

    // ============================================
    // ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ ВХОДА (ИСПРАВЛЕНО ✅)
    // ============================================

    redirectToLogin() {
        console.log('🔄 Перенаправление на страницу входа...');
        this.showLoader('Требуется авторизация...');
        
        setTimeout(() => {
            // ✅ ИСПРАВЛЕНО: login.html находится в той же папке html/
            window.location.replace('login.html');
        }, 1500);
    }

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================

    init() {
        console.log('✅ Инициализация AccountManager...');
        
        // Инициализируем Firebase
        if (!this.initializeFirebase()) {
            this.showNotification('Ошибка инициализации Firebase', 'error');
            return;
        }
        
        // Проверяем авторизацию
        this.checkAuth();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        console.log('✅ Инициализация завершена');
    }

    // ============================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================

    setupEventListeners() {
        console.log('🎮 Настройка событий...');
        
        // 1. КНОПКА ВЫХОДА
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
            console.log('✅ Кнопка выхода подключена');
        }

        // 2. ФОРМА РЕДАКТИРОВАНИЯ ПРОФИЛЯ
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile(e);
            });
            console.log('✅ Форма редактирования подключена');
        }

        // 3. ФИЛЬТРЫ БРОНИРОВАНИЙ
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.target.dataset.filter || e.target.closest('.filter-tab').dataset.filter;
                
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.closest('.filter-tab').classList.add('active');
                
                this.filterBookings(filter);
            });
        });

        // 4. КНОПКА РЕДАКТИРОВАНИЯ АВАТАРА
        const editAvatarBtn = document.querySelector('.edit-avatar');
        if (editAvatarBtn) {
            editAvatarBtn.addEventListener('click', () => {
                this.showNotification('Функция загрузки фото будет доступна в следующей версии', 'info');
            });
        }

        // 5. ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ПО КЛИКУ НА ОВЕРЛЕЙ
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                    closeEditProfile();
                }
            });
        }

        console.log('✅ Все обработчики событий подключены');
    }

    // ============================================
    // РЕНДЕРИНГ UI
    // ============================================

    renderUI() {
        console.log('🎨 Рендеринг UI...');
        this.renderProfile();
        this.renderStats();
        this.renderLoyaltyCard();
        this.renderBookings();
        this.renderFavorites();
        console.log('✅ UI отрисован');
    }

    renderProfile() {
        console.log('👤 Рендеринг профиля...');
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const memberSince = document.getElementById('memberSince');
        const userAvatar = document.getElementById('userAvatar');

        if (userName) {
            userName.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }

        if (userEmail) {
            userEmail.innerHTML = `<i class="fas fa-envelope"></i> ${this.currentUser.email}`;
        }

        if (memberSince) {
            const date = new Date(this.currentUser.registeredAt);
            memberSince.textContent = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        }

        if (userAvatar) {
            if (this.currentFirebaseUser && this.currentFirebaseUser.photoURL) {
                userAvatar.src = this.currentFirebaseUser.photoURL;
            } else {
                const name = `${this.currentUser.firstName}+${this.currentUser.lastName}`;
                userAvatar.src = `https://ui-avatars.com/api/?name=${name}&background=C9A961&color=fff&size=200`;
            }
        }
    }

    renderStats() {
        console.log('📊 Рендеринг статистики...');
        
        const stats = this.currentUser.stats;
        
        this.setElementText('totalStays', stats.totalStays);
        this.setElementText('totalNights', stats.totalNights);
        this.setElementText('totalSpent', this.formatPrice(stats.totalSpent));
        this.setElementText('totalSaved', this.formatPrice(stats.totalSaved));
    }

    renderLoyaltyCard() {
        console.log('🏆 Рендеринг карты лояльности...');
        
        const stats = this.currentUser.stats;
        const currentLevel = this.loyaltyLevels[stats.loyaltyLevel];
        const nextLevelKey = this.getNextLevel(stats.loyaltyLevel);
        const nextLevel = nextLevelKey ? this.loyaltyLevels[nextLevelKey] : null;

        const loyaltyStatus = document.getElementById('loyaltyStatus');
        if (loyaltyStatus) {
            loyaltyStatus.textContent = `Статус: ${currentLevel.name}`;
            loyaltyStatus.style.color = currentLevel.color;
        }

        const loyaltyBadge = document.getElementById('loyaltyBadge');
        if (loyaltyBadge) {
            loyaltyBadge.innerHTML = `<i class="fas ${currentLevel.icon}"></i>`;
            loyaltyBadge.style.background = `linear-gradient(135deg, ${currentLevel.color}, ${this.adjustColor(currentLevel.color, -20)})`;
        }

        const currentVisits = stats.totalStays;
        const nextLevelVisits = nextLevel ? nextLevel.visits : currentLevel.visits;
        const progress = nextLevel ? (currentVisits / nextLevelVisits) * 100 : 100;

        this.setElementText('currentVisits', currentVisits);
        this.setElementText('nextLevelVisits', nextLevelVisits);
        
        const progressBar = document.getElementById('loyaltyProgress');
        if (progressBar) {
            progressBar.style.width = Math.min(progress, 100) + '%';
            progressBar.style.background = `linear-gradient(90deg, ${currentLevel.color}, ${this.adjustColor(currentLevel.color, 20)})`;
        }

        this.setElementText('currentDiscount', currentLevel.discount + '%');
        this.setElementText('bonusPoints', stats.loyaltyPoints + ' баллов');

        document.querySelectorAll('.level-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.level === stats.loyaltyLevel) {
                item.classList.add('active');
            }
        });
    }

    renderBookings(filter = 'all') {
        console.log('📅 Рендеринг бронирований, фильтр:', filter);
        console.log('📊 Всего бронирований в памяти:', this.currentUser.bookings.length);
        
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) {
            console.error('❌ Элемент bookingsList не найден!');
            return;
        }

        let bookings = [...this.currentUser.bookings];
        
        console.log('📋 Бронирования ДО фильтрации:', bookings);

        if (filter !== 'all') {
            bookings = bookings.filter(b => {
                console.log(`Фильтр: ${b.id} - статус: ${b.status}, фильтр: ${filter}`);
                return b.status === filter;
            });
        }
        
        console.log('📋 Бронирования ПОСЛЕ фильтрации:', bookings.length);

        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Нет бронирований</h3>
                    <p>У вас пока нет бронирований</p>
                    <a href="../index.html#booking" class="btn-primary">
                        Забронировать номер
                    </a>
                </div>
            `;
            return;
        }

        bookingsList.innerHTML = bookings.map(booking => {
            // Определяем статус для отображения
            const displayStatus = booking.status || 'confirmed';
            
            return `
                <div class="booking-card ${displayStatus}">
                    <div class="booking-header">
                        <div>
                            <h3>${booking.roomName || booking.roomType || 'Номер'}</h3>
                            <p class="booking-id">ID: ${booking.id}</p>
                        </div>
                        <span class="booking-status status-${displayStatus}">
                            ${this.getStatusText(displayStatus)}
                        </span>
                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar-check"></i>
                            <div>
                                <strong>Заезд</strong>
                                <p>${this.formatDate(booking.checkIn)}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar-times"></i>
                            <div>
                                <strong>Выезд</strong>
                                <p>${this.formatDate(booking.checkOut)}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-moon"></i>
                            <div>
                                <strong>Ночей</strong>
                                <p>${booking.nights}</p>
                            </div>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <strong>Гостей</strong>
                                <p>${booking.guests}</p>
                            </div>
                        </div>
                    </div>
                    <div class="booking-footer">
                        <div class="booking-price">
                            ${booking.discount && booking.discount > 0 ? `
                                <span class="discount-badge">-${booking.discount}%</span>
                            ` : ''}
                            <strong>${this.formatPrice(booking.totalPrice)}</strong>
                        </div>
                        <div class="booking-actions">
                            ${displayStatus === 'confirmed' || displayStatus === 'upcoming' ? `
                                <button class="btn-secondary" onclick="accountManager.cancelBooking('${booking.id}')">
                                    <i class="fas fa-times"></i> Отменить
                                </button>
                            ` : ''}
                            ${displayStatus === 'completed' || displayStatus === 'cancelled' ? `
                                <button class="btn-primary" onclick="accountManager.rebookRoom('${booking.id}')">
                                    <i class="fas fa-redo"></i> Забронировать снова
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Отрисовано бронирований:', bookings.length);
    }

    renderFavorites() {
        console.log('❤️ Рендеринг избранного...');
        
        const favoritesGrid = document.getElementById('favoriteRooms');
        if (!favoritesGrid) return;

        const favorites = this.currentUser.favorites;

        const roomImages = {
            'Стандарт': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop',
            'Люкс': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
            'Семейный': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop'
        };

        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart-broken"></i>
                    <h3>Нет избранных номеров</h3>
                    <p>Добавьте номера в избранное для быстрого доступа</p>
                </div>
            `;
            return;
        }

        favoritesGrid.innerHTML = favorites.map(room => `
            <div class="favorite-room-card">
                <img src="${roomImages[room]}" alt="${room}" onerror="this.src='https://via.placeholder.com/400x300?text=${room}'">
                <div class="favorite-overlay">
                    <h4>${room}</h4>
                    <button class="btn-primary" onclick="window.location.href='../index.html#booking'">
                        <i class="fas fa-calendar-check"></i>
                        Забронировать
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // ДЕЙСТВИЯ
    // ============================================

    filterBookings(filter) {
        console.log('🔍 Фильтр бронирований:', filter);
        this.renderBookings(filter);
    }

    async cancelBooking(bookingId) {
        console.log('❌ Отмена бронирования:', bookingId);
        
        if (!confirm('Вы уверены, что хотите отменить это бронирование?')) {
            return;
        }

        const booking = this.currentUser.bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            
            // Обновляем в Firebase
            if (this.database && this.currentFirebaseUser) {
                try {
                    await this.database.ref('users/' + this.currentFirebaseUser.uid + '/bookings/' + bookingId).update({
                        status: 'cancelled'
                    });
                    await this.database.ref('bookings/' + bookingId).update({
                        status: 'cancelled'
                    });
                } catch (error) {
                    console.error('Ошибка обновления в Firebase:', error);
                }
            }
            
            this.currentUser.stats = this.calculateStatsFromBookings(this.currentUser.bookings);
            this.renderBookings();
            this.renderStats();
            this.renderLoyaltyCard();
            this.showNotification('��ронирование успешно отменено', 'success');
        }
    }

    rebookRoom(bookingId) {
        console.log('🔄 Повторное бронирование:', bookingId);
        
        const booking = this.currentUser.bookings.find(b => b.id === bookingId);
        if (booking) {
            localStorage.setItem('rebookData', JSON.stringify({
                roomType: booking.roomType,
                guests: booking.guests,
                nights: booking.nights
            }));
            
            this.showNotification('Перенаправление на страницу бронирования...', 'info');
            setTimeout(() => {
                // ✅ ИСПРАВЛЕНО: переход из /html/account.html в /index.html#booking
                window.location.href = '../index.html#booking';
            }, 1000);
        }
    }

    async saveProfile(e) {
        console.log('💾 Сохранение профиля...');

        const firstName = document.getElementById('editFirstName').value.trim();
        const lastName = document.getElementById('editLastName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();

        if (!firstName || !lastName || !email || !phone) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Пожалуйста, введите корректный email', 'error');
            return;
        }

        this.showLoader('Сохранение...');

        try {
            // Обновляем в Firebase
            if (this.database && this.currentFirebaseUser) {
                await this.database.ref('users/' + this.currentFirebaseUser.uid).update({
                    firstName,
                    lastName,
                    email,
                    phone
                });
            }

            // Обновляем локально
            this.currentUser.firstName = firstName;
            this.currentUser.lastName = lastName;
            this.currentUser.email = email;
            this.currentUser.phone = phone;

            this.hideLoader();
            this.renderProfile();
            closeEditProfile();
            
            this.showNotification('Профиль успешно обновлен!', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            this.hideLoader();
            this.showNotification('Ошибка при сохранении профиля', 'error');
        }
    }

    // ============================================
    // ВЫХОД ИЗ АККАУНТА (ИСПРАВЛЕНО ✅)
    // ============================================

    logout() {
        console.log('🚪 Выход из аккаунта...');
        
        const confirmLogout = confirm('Вы действительно хотите выйти из аккаунта?');
        
        if (!confirmLogout) {
            console.log('❌ Выход отменен пользователем');
            return;
        }
        
        // Показываем loader
        this.showLoader('Выход из системы...');
        
        // Проверяем наличие Firebase
        if (!this.auth) {
            console.error('❌ Firebase Auth не инициализирован!');
            this.showNotification('Ошибка: Firebase не доступен', 'error');
            this.hideLoader();
            return;
        }
        
        // Выполняем выход из Firebase
        this.auth.signOut()
            .then(() => {
                console.log('✅ Выход из Firebase выполнен');
                
                // Очищаем все данные
                localStorage.clear();
                sessionStorage.clear();
                
                // Очищаем cookies
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c.replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                
                console.log('✅ Все данные очищены');
                
                // ✅ ИСПРАВЛЕНО: Перенаправление из /html/account.html в /index.html
                setTimeout(() => {
                    this.hideLoader();
                    console.log('🔄 Перенаправление на главную страницу...');
                    window.location.replace('../index.html');
                }, 800);
            })
            .catch((error) => {
                console.error('❌ Ошибка при выходе:', error);
                this.hideLoader();
                this.showNotification('Ошибка при выходе: ' + error.message, 'error');
            });
    }

    // ============================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================

    calculateLoyaltyLevel(visits) {
        if (visits >= 50) return 'platinum';
        if (visits >= 20) return 'gold';
        if (visits >= 10) return 'silver';
        if (visits >= 5) return 'bronze';
        return 'guest';
    }

    getNextLevel(currentLevel) {
        const levels = ['guest', 'bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    getStatusText(status) {
        const statuses = {
            upcoming: 'Предстоящее',
            completed: 'Завершено',
            cancelled: 'Отменено',
            confirmed: 'Подтверждено',
            checked_in: 'Активно',
            active: 'Активно'
        };
        return statuses[status] || 'Подтверждено';
    }

    getFilterName(filter) {
        const names = {
            upcoming: 'предстоящих',
            completed: 'завершенных',
            cancelled: 'отмененных',
            confirmed: 'подтвержденных'
        };
        return names[filter] || '';
    }

    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    // ============================================
    // UI КОМПОНЕНТЫ
    // ============================================

    showLoader(text = 'Загрузка...') {
        let loader = document.getElementById('pageLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'pageLoader';
            loader.innerHTML = `
                <div class="loader-content">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${text}</p>
                </div>
            `;
            Object.assign(loader.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: '10000',
                backdropFilter: 'blur(5px)'
            });
            
            const loaderContent = loader.querySelector('.loader-content');
            Object.assign(loaderContent.style, {
                textAlign: 'center',
                color: 'white',
                fontSize: '24px'
            });
            
            document.body.appendChild(loader);
        } else {
            loader.querySelector('p').textContent = text;
        }
        loader.style.display = 'flex';
    }

    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]:`, message);
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#ff9800'
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
            borderRadius: '8px',
            zIndex: '10001',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease',
            minWidth: '300px',
            maxWidth: '500px',
            fontSize: '15px',
            fontWeight: '500'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3500);
    }
}

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
// ============================================

function openEditProfile() {
    console.log('📝 Открытие формы редактирования...');
    
    if (!window.accountManager) {
        console.error('❌ accountManager не найден!');
        alert('Ошибка: AccountManager не инициализирован');
        return;
    }
    
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        console.error('❌ Модальное окно не найдено!');
        return;
    }
    
    const user = accountManager.currentUser;
    
    document.getElementById('editFirstName').value = user.firstName;
    document.getElementById('editLastName').value = user.lastName;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Модальное окно открыто');
}

function closeEditProfile() {
    console.log('❌ Закрытие формы редактирования...');
    
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('✅ Модальное окно закрыто');
    }
}

// Делаем функции глобальными
window.openEditProfile = openEditProfile;
window.closeEditProfile = closeEditProfile;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

let accountManager;

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, создание AccountManager...');
    
    // Проверяем загрузку Firebase
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase не загружен!');
        alert('Ошибка: Firebase SDK не загружен. Пожалуйста, обновите страницу.');
        return;
    }
    
    // Инициализируем Firebase приложение
    const firebaseConfig = {
        apiKey: "AIzaSyAnSLyg8LsmCP3EcpmL6DvarTlP02nLpGI",
        authDomain: "project-14b49.firebaseapp.com",
        databaseURL: "https://project-14b49-default-rtdb.firebaseio.com",
        projectId: "project-14b49",
        storageBucket: "project-14b49.firebasestorage.app",
        messagingSenderId: "592957164246",
        appId: "1:592957164246:web:cb05f0e70b16ab1d64d777"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase приложение инициализировано');
    }
    
    // Создаём AccountManager
    accountManager = new AccountManager();
    window.accountManager = accountManager;
    
    // Инициализируем
    accountManager.init();
});

console.log('✅ Скрипт account.js полностью загружен и готов к работе');