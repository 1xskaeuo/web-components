// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ
// ============================================

const APP_CONFIG = {
    STARS_COUNT: 200,
    SHOOTING_STAR_INTERVAL: 15000,
    TIME_UPDATE_INTERVAL: 60000,
    PRICES: {
        standard: 15000,
        lux: 25000,
        family: 20000
    },
    ROOM_NAMES: {
        standard: 'Стандарт',
        lux: 'Люкс',
        family: 'Семейный'
    }
};

// Глобальное состояние приложения
const AppState = {
    autoTimeMode: true,
    shootingStarTimer: null,
    currentDate: new Date(),
    selectedDates: {
        checkin: null,
        checkout: null
    },
    selectedRoom: null,
    chatData: {
        step: null,
        name: null,
        email: null,
        phone: null,
        guests: null,
        roomType: null,
        price: 0,
        nights: 0
    }
};

// ============================================
// FIREBASE REALTIME DATABASE СИСТЕМА БРОНИРОВАНИЯ
// ============================================

class FirebaseBookingSystem {
    constructor() {
        this.auth = null;
        this.database = null;
        this.initialized = false;
        this.initFirebase();
    }

    initFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn('⚠️ Firebase не подключен');
                return;
            }

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
            }

            this.auth = firebase.auth();
            this.database = firebase.database();
            this.initialized = true;
            
            console.log('✅ Firebase Realtime Database готов');
            this.initializeRooms();
            
        } catch (error) {
            console.error('❌ Ошибка Firebase:', error);
        }
    }

    async initializeRooms() {
        if (!this.initialized) return;

        try {
            const roomsSnapshot = await this.database.ref('rooms').once('value');
            if (!roomsSnapshot.exists()) {
                const rooms = {
                    'standard': {
                        name: 'Стандарт',
                        price: 15000,
                        description: 'Уютный номер с видом на море',
                        capacity: 2,
                        amenities: ['WiFi', 'TV', 'Кондиционер', 'Сейф'],
                        available: true,
                        createdAt: Date.now()
                    },
                    'lux': {
                        name: 'Люкс',
                        price: 25000,
                        description: 'Роскошный номер с панорамным балконом',
                        capacity: 2,
                        amenities: ['WiFi', 'Smart TV', 'Джакузи', 'Мини-бар', 'Балкон'],
                        available: true,
                        createdAt: Date.now()
                    },
                    'family': {
                        name: 'Семейный',
                        price: 20000,
                        description: 'Просторный номер для семьи с детьми',
                        capacity: 4,
                        amenities: ['WiFi', 'TV', 'Кухонный уголок', 'Игровая зона'],
                        available: true,
                        createdAt: Date.now()
                    }
                };

                await this.database.ref('rooms').set(rooms);
                console.log('✅ Номера созданы в Firebase');
            }
        } catch (error) {
            console.error('❌ Ошибка создания номеров:', error);
        }
    }

    async createBooking(bookingData) {
        if (!this.initialized) {
            return this.createLocalBooking(bookingData);
        }

        try {
            const isAvailable = await this.checkRoomAvailability(
                bookingData.roomId,
                bookingData.checkIn,
                bookingData.checkOut
            );

            if (!isAvailable) {
                throw new Error('❌ Номер уже забронирован на выбранные даты');
            }

            const bookingId = this.generateBookingId();
            const nights = Utils.calculateNights(bookingData.checkIn, bookingData.checkOut);
            const totalPrice = nights * bookingData.pricePerNight;

            const booking = {
                id: bookingId,
                userId: bookingData.userId || 'guest',
                userEmail: bookingData.userEmail,
                userName: bookingData.userName,
                userPhone: bookingData.userPhone,
                roomId: bookingData.roomId,
                roomName: bookingData.roomName,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                nights: nights,
                guests: parseInt(bookingData.guests),
                pricePerNight: bookingData.pricePerNight,
                totalPrice: totalPrice,
                status: 'confirmed',
                paymentStatus: 'pending',
                createdAt: Date.now(),
                specialRequests: bookingData.specialRequests || ''
            };

            await this.database.ref('bookings/' + bookingId).set(booking);
            console.log('✅ Бронирование сохранено в Firebase:', bookingId);

            if (bookingData.userId && bookingData.userId !== 'guest') {
                await this.database.ref('users/' + bookingData.userId + '/bookings/' + bookingId).set(booking);
                console.log('✅ Бронирование добавлено в профиль пользователя');
            }
            
            return bookingId;

        } catch (error) {
            console.error('❌ Ошибка бронирования в Firebase:', error);
            throw error;
        }
    }

    createLocalBooking(bookingData) {
        const bookingId = this.generateBookingId();
        const nights = Utils.calculateNights(bookingData.checkIn, bookingData.checkOut);
        const totalPrice = nights * bookingData.pricePerNight;

        const booking = {
            id: bookingId,
            ...bookingData,
            nights: nights,
            totalPrice: totalPrice,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        const bookings = JSON.parse(localStorage.getItem('vila_eysk_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('vila_eysk_bookings', JSON.stringify(bookings));

        console.log('✅ Бронирование сохранено локально:', bookingId);
        return bookingId;
    }

    async checkRoomAvailability(roomId, checkIn, checkOut) {
        if (!this.initialized) {
            return this.checkLocalAvailability(roomId, checkIn, checkOut);
        }

        try {
            const bookingsSnapshot = await this.database.ref('bookings')
                .orderByChild('roomId')
                .equalTo(roomId)
                .once('value');

            if (!bookingsSnapshot.exists()) {
                console.log('✅ Номер свободен - нет бронирований');
                return true;
            }

            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            let isAvailable = true;
            
            bookingsSnapshot.forEach((childSnapshot) => {
                const booking = childSnapshot.val();
                
                if (booking.status !== 'confirmed' && booking.status !== 'checked_in') {
                    return;
                }

                const existingCheckIn = new Date(booking.checkIn);
                const existingCheckOut = new Date(booking.checkOut);

                const isOverlapping = (
                    (checkInDate >= existingCheckIn && checkInDate < existingCheckOut) || 
                    (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) || 
                    (checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
                );

                if (isOverlapping) {
                    console.warn('❌ Номер занят:', {
                        существующее: `${booking.checkIn} - ${booking.checkOut}`,
                        запрошенное: `${checkIn} - ${checkOut}`,
                        bookingId: booking.id
                    });
                    isAvailable = false;
                }
            });

            if (isAvailable) {
                console.log('✅ Номер свободен на выбранные даты');
            }

            return isAvailable;

        } catch (error) {
            console.error('❌ Ошибка проверки доступности:', error);
            return this.checkLocalAvailability(roomId, checkIn, checkOut);
        }
    }

    checkLocalAvailability(roomId, checkIn, checkOut) {
        const bookings = JSON.parse(localStorage.getItem('vila_eysk_bookings') || '[]');
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        const hasConflict = bookings.some(booking => {
            if (booking.roomId !== roomId || booking.status === 'cancelled') return false;
            
            const existingCheckIn = new Date(booking.checkIn);
            const existingCheckOut = new Date(booking.checkOut);
            
            return (
                (checkInDate >= existingCheckIn && checkInDate < existingCheckOut) ||
                (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) ||
                (checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
            );
        });

        return !hasConflict;
    }

    async getUserBookings(userId) {
        if (!this.initialized) {
            return [];
        }

        try {
            const snapshot = await this.database.ref('users/' + userId + '/bookings').once('value');
            
            if (!snapshot.exists()) {
                return [];
            }

            const bookings = [];
            snapshot.forEach((childSnapshot) => {
                bookings.push(childSnapshot.val());
            });

            bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            return bookings;

        } catch (error) {
            console.error('❌ Ошибка получения бронирований:', error);
            return [];
        }
    }

    generateBookingId() {
        return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
}

// ============================================
// УТИЛИТЫ
// ============================================

const Utils = {
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU');
    },

    formatDateFull(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    calculateNights(checkin, checkout) {
        const start = new Date(checkin);
        const end = new Date(checkout);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    },

    getRoomName(type) {
        return APP_CONFIG.ROOM_NAMES[type] || type;
    },

    getRoomPrice(type) {
        return APP_CONFIG.PRICES[type] || 0;
    },

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ Элемент #${id} не найден`);
        }
        return element;
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            background: type === 'success' ? '#4CAF50' : type === 'error' ? '#ff4444' : '#2196F3',
            color: 'white',
            borderRadius: '10px',
            zIndex: '10000',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            animation: 'slideInRight 0.3s ease'
        };
        
        Object.assign(notification.style, styles);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
};

// ============================================
// СИСТЕМА БРОНИРОВАНИЯ (UI)
// ============================================

const BookingManager = {
    bookingSystem: null,

    init() {
        this.bookingSystem = new FirebaseBookingSystem();
        this.setupEventListeners();
        this.setupBookingForm();
    },

    setupEventListeners() {
        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToBooking();
            });
        });

        document.querySelectorAll('.room-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const roomType = option.getAttribute('data-room-type');
                const roomName = option.querySelector('.room-type').textContent;
                const roomPrice = parseInt(option.querySelector('.room-price').textContent.replace(/\D/g, ''));
                this.selectRoom(roomType, roomName, roomPrice);
            });
        });

        const bookNowBtn = document.querySelector('.book-now-btn');
        if (bookNowBtn) {
            bookNowBtn.addEventListener('click', () => this.showBookingForm());
        }
    },

    setupBookingForm() {
        const bookingForm = Utils.getElement('finalBookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        }
    },

    scrollToBooking() {
        const bookingSection = Utils.getElement('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    selectRoom(type, name, price) {
        AppState.selectedRoom = { id: type, name: name, price: price };
        
        document.querySelectorAll('.room-option').forEach(room => {
            room.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-room-type="${type}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        this.updateTotalPrice();
    },

    updateTotalPrice() {
        const totalPriceElement = Utils.getElement('totalPrice');
        if (!totalPriceElement || !AppState.selectedRoom) return;

        if (AppState.selectedDates.checkin && AppState.selectedDates.checkout) {
            const nights = Utils.calculateNights(AppState.selectedDates.checkin, AppState.selectedDates.checkout);
            const total = nights * AppState.selectedRoom.price;
            totalPriceElement.textContent = Utils.formatPrice(total);
        } else {
            totalPriceElement.textContent = '0 ₽';
        }
    },

    async showBookingForm() {
        if (!AppState.selectedDates.checkin || !AppState.selectedDates.checkout) {
            Utils.showNotification('Пожалуйста, выберите даты заезда и выезда', 'error');
            return;
        }

        if (!AppState.selectedRoom) {
            Utils.showNotification('Пожалуйста, выберите номер', 'error');
            return;
        }

        if (this.bookingSystem.initialized && this.bookingSystem.auth) {
            const currentUser = this.bookingSystem.auth.currentUser;
            
            if (!currentUser) {
                sessionStorage.setItem('pendingBooking', JSON.stringify({
                    roomId: AppState.selectedRoom.id,
                    roomName: AppState.selectedRoom.name,
                    checkIn: AppState.selectedDates.checkin,
                    checkOut: AppState.selectedDates.checkout,
                    guests: document.getElementById('guestsSelect').value,
                    pricePerNight: AppState.selectedRoom.price
                }));
                
                Utils.showNotification('Пожалуйста, войдите в аккаунт для бронирования', 'info');
                setTimeout(() => {
                     window.location.href = '/login';
                }, 1500);
                return;
            }

            await this.createBookingForAuthUser(currentUser);
        } else {
            this.showBookingFormModal();
        }
    },

    async createBookingForAuthUser(user) {
        try {
            const userDataSnapshot = await this.bookingSystem.database.ref('users/' + user.uid).once('value');
            const userData = userDataSnapshot.val() || {};

            const formData = {
                userId: user.uid,
                userName: userData.name || user.displayName || 'Гость',
                userEmail: user.email,
                userPhone: userData.phone || '',
                roomId: AppState.selectedRoom.id,
                roomName: AppState.selectedRoom.name,
                checkIn: AppState.selectedDates.checkin,
                checkOut: AppState.selectedDates.checkout,
                guests: document.getElementById('guestsSelect').value,
                pricePerNight: AppState.selectedRoom.price,
                specialRequests: ''
            };

            Utils.showNotification('Создаем бронирование...', 'info');

            const bookingId = await this.bookingSystem.createBooking(formData);
            
            Utils.showNotification(`✅ Бронирование #${bookingId} успешно создано!`, 'success');
            this.showBookingConfirmation(bookingId, formData);
            this.resetBookingForm();

        } catch (error) {
            console.error('❌ Ошибка бронирования:', error);
            Utils.showNotification(error.message || 'Ошибка при бронировании', 'error');
        }
    },

    showBookingFormModal() {
        document.getElementById('reviewDates').textContent = 
            `${Utils.formatDateFull(AppState.selectedDates.checkin)} - ${Utils.formatDateFull(AppState.selectedDates.checkout)}`;
        document.getElementById('reviewRoom').textContent = 
            `Номер: ${AppState.selectedRoom.name}`;
        document.getElementById('reviewGuests').textContent = 
            `Гостей: ${document.getElementById('guestsSelect').value}`;
        
        const nights = Utils.calculateNights(AppState.selectedDates.checkin, AppState.selectedDates.checkout);
        const totalPrice = nights * AppState.selectedRoom.price;
        document.getElementById('reviewPrice').textContent = 
            `Стоимость: ${Utils.formatPrice(totalPrice)}`;

        document.getElementById('bookingFormOverlay').style.display = 'flex';
    },

    closeBookingForm() {
        document.getElementById('bookingFormOverlay').style.display = 'none';
    },

    async handleBookingSubmit(e) {
        e.preventDefault();

        const formData = {
            userName: document.getElementById('guestName').value,
            userEmail: document.getElementById('guestEmail').value,
            userPhone: document.getElementById('guestPhone').value,
            roomId: AppState.selectedRoom.id,
            roomName: AppState.selectedRoom.name,
            checkIn: AppState.selectedDates.checkin,
            checkOut: AppState.selectedDates.checkout,
            guests: document.getElementById('guestsSelect').value,
            pricePerNight: AppState.selectedRoom.price,
            specialRequests: ''
        };

        if (!formData.userName || !formData.userEmail || !formData.userPhone) {
            Utils.showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Бронируем...';
            submitBtn.disabled = true;

            const bookingId = await this.bookingSystem.createBooking(formData);
            
            Utils.showNotification(`Бронирование #${bookingId} успешно создано!`, 'success');
            
            this.closeBookingForm();
            this.resetBookingForm();
            this.showBookingConfirmation(bookingId, formData);

        } catch (error) {
            console.error('❌ Ошибка бронирования:', error);
            Utils.showNotification(error.message || 'Ошибка при бронировании', 'error');
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Подтвердить бронирование';
            submitBtn.disabled = false;
        }
    },

    resetBookingForm() {
        document.getElementById('finalBookingForm').reset();
        AppState.selectedDates.checkin = null;
        AppState.selectedDates.checkout = null;
        AppState.selectedRoom = null;
        
        document.querySelectorAll('.room-option').forEach(room => {
            room.classList.remove('selected');
        });
        
        document.getElementById('checkinDisplay').textContent = '--';
        document.getElementById('checkoutDisplay').textContent = '--';
        document.getElementById('nightsDisplay').textContent = '0';
        document.getElementById('totalPrice').textContent = '0 ₽';
        
        CalendarManager.renderCalendar();
    },

    showBookingConfirmation(bookingId, bookingData) {
        const nights = Utils.calculateNights(bookingData.checkIn, bookingData.checkOut);
        const totalPrice = nights * bookingData.pricePerNight;

        const wrapper = document.createElement('div');
        wrapper.className = 'confirmation-wrapper';
        
        wrapper.innerHTML = `
            <div class="confirmation-overlay" onclick="this.parentElement.remove()"></div>
            <div class="confirmation-modal">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="confirmation-title">🎉 Бронирование подтверждено!</h2>
                
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span class="detail-label">Номер бронирования:</span>
                        <span class="detail-value">${bookingId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Гость:</span>
                        <span class="detail-value">${bookingData.userName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${bookingData.userEmail}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Номер:</span>
                        <span class="detail-value">${bookingData.roomName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Даты:</span>
                        <span class="detail-value">${Utils.formatDate(bookingData.checkIn)} - ${Utils.formatDate(bookingData.checkOut)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Ночей:</span>
                        <span class="detail-value">${nights}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Гостей:</span>
                        <span class="detail-value">${bookingData.guests}</span>
                    </div>
                    <div class="detail-row total">
                        <span class="detail-label">Итоговая стоимость:</span>
                        <span class="detail-value">${Utils.formatPrice(totalPrice)}</span>
                    </div>
                </div>

                <p class="confirmation-note">
                    <i class="fas fa-envelope"></i> 
                    Подтверждение отправлено на ${bookingData.userEmail}
                </p>

                <button class="confirmation-btn" onclick="this.closest('.confirmation-wrapper').remove()">
                    <i class="fas fa-check"></i> Отлично!
                </button>
            </div>
        `;

        document.body.appendChild(wrapper);
    }
};

// ============================================
// УПРАВЛЕНИЕ ВРЕМЕНЕМ СУТОК
// ============================================

const TimeOfDayManager = {
    init() {
        this.setupEventListeners();
        this.update();
        this.startAutoUpdate();
    },

    setupEventListeners() {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const timeOfDay = btn.getAttribute('data-time');
                this.setTime(timeOfDay);
            });
        });
    },

    setTime(timeOfDay) {
        AppState.autoTimeMode = (timeOfDay === 'auto');
        this.update(timeOfDay);
    },

    update(forceTimeOfDay = null) {
        const now = new Date();
        const hour = now.getHours();
        const minutes = now.getMinutes();
        
        this.updateClock(hour, minutes);
        
        let timeOfDay = forceTimeOfDay;
        
        if (!forceTimeOfDay || forceTimeOfDay === 'auto') {
            timeOfDay = this.determineTimeOfDay(hour);
        }
        
        this.applyStyles(timeOfDay);
        this.updateWeatherIcon(timeOfDay);
        this.updateActiveButton(forceTimeOfDay || 'auto');
        this.manageStars(timeOfDay);
    },

    updateClock(hour, minutes) {
        const notchTime = Utils.getElement('notchTime');
        if (notchTime) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            notchTime.textContent = timeString;
        }
    },

    determineTimeOfDay(hour) {
        if (hour >= 5 && hour < 8) return 'morning';
        if (hour >= 8 && hour < 12) return 'day';
        if (hour >= 12 && hour < 16) return 'afternoon';
        if (hour >= 16 && hour < 18) return 'evening';
        if (hour >= 18 && hour < 20) return 'sunset';
        if (hour >= 20 && hour < 23) return 'night';
        return 'late-night';
    },

    applyStyles(timeOfDay) {
        document.body.classList.remove(
            'morning', 'day', 'afternoon', 'evening', 
            'sunset', 'night', 'late-night'
        );
        document.body.classList.add(timeOfDay);
    },

    updateWeatherIcon(timeOfDay) {
        const weatherIcon = document.querySelector('.notch-weather i');
        if (!weatherIcon) return;
        
        const icons = {
            morning: 'fas fa-sun',
            day: 'fas fa-sun',
            afternoon: 'fas fa-sun',
            evening: 'fas fa-cloud-sun',
            sunset: 'fas fa-cloud-sun',
            night: 'fas fa-moon',
            'late-night': 'fas fa-moon'
        };
        
        weatherIcon.className = icons[timeOfDay] || 'fas fa-sun';
    },

    updateActiveButton(timeOfDay) {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.time-btn[data-time="${timeOfDay}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    },

    manageStars(timeOfDay) {
        if (timeOfDay === 'night' || timeOfDay === 'late-night') {
            StarsManager.show();
            ShootingStarsManager.start();
        } else {
            StarsManager.hide();
            ShootingStarsManager.stop();
        }
    },

    startAutoUpdate() {
        setInterval(() => {
            if (AppState.autoTimeMode) {
                this.update();
            }
        }, APP_CONFIG.TIME_UPDATE_INTERVAL);
    }
};

// ============================================
// УПРАВЛЕНИЕ ЗВЕЗДАМИ
// ============================================

const StarsManager = {
    container: null,
    initialized: false,

    show() {
        if (!this.initialized) {
            this.init();
        }
        if (this.container) {
            this.container.style.display = 'block';
        }
    },

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    },

    init() {
        if (this.initialized) return;
        
        this.createContainer();
        this.createStars();
        this.initialized = true;
    },

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'stars-container';
        
        const styles = {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '1',
            overflow: 'hidden',
            display: 'none'
        };
        
        Object.assign(this.container.style, styles);
        
        const heroHeader = document.querySelector('.hero-header');
        if (heroHeader) {
            heroHeader.prepend(this.container);
        }
    },

    createStars() {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < APP_CONFIG.STARS_COUNT; i++) {
            const star = this.createStar();
            fragment.appendChild(star);
        }
        
        this.container.appendChild(fragment);
    },

    createStar() {
        const star = document.createElement('div');
        const size = Math.random() * 3;
        const duration = Math.random() * 5 + 2;
        
        star.className = 'star';
        
        const styles = {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${duration}s infinite alternate`,
            opacity: `${Math.random() * 0.7 + 0.3}`
        };
        
        Object.assign(star.style, styles);
        return star;
    }
};

// ============================================
// ПАДАЮЩИЕ ЗВЕЗДЫ
// ============================================

const ShootingStarsManager = {
    container: null,

    start() {
        if (AppState.shootingStarTimer) {
            clearInterval(AppState.shootingStarTimer);
        }
        
        this.container = Utils.getElement('shootingStarContainer');
        this.createShootingStar();
        
        AppState.shootingStarTimer = setInterval(() => {
            this.createShootingStar();
        }, APP_CONFIG.SHOOTING_STAR_INTERVAL);
    },

    stop() {
        if (AppState.shootingStarTimer) {
            clearInterval(AppState.shootingStarTimer);
            AppState.shootingStarTimer = null;
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    },

    createShootingStar() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        const starHead = document.createElement('div');
        starHead.className = 'star-head';
        starHead.style.animation = 'burnEffect 0.5s infinite alternate';
        
        const starTrail = document.createElement('div');
        starTrail.className = 'star-trail';
        
        const starGlow = document.createElement('div');
        starGlow.className = 'star-glow';
        starGlow.style.animation = 'glowPulse 0.5s infinite alternate';
        
        shootingStar.appendChild(starTrail);
        shootingStar.appendChild(starHead);
        shootingStar.appendChild(starGlow);
        
        const startX = Math.random() * 80 + 10;
        const startY = Math.random() * 20;
        const trailLength = Math.random() * 60 + 80;
        
        shootingStar.style.top = `${startY}%`;
        shootingStar.style.left = `${startX}%`;
        starTrail.style.width = `${trailLength}px`;
        
        this.container.appendChild(shootingStar);
        this.animateShootingStar(shootingStar, startX, startY);
    },

    animateShootingStar(shootingStar, startX, startY) {
        setTimeout(() => {
            shootingStar.style.opacity = '1';
            
            const endX = startX - Math.random() * 30 + 10;
            const endY = startY + Math.random() * 50 + 30;
            const duration = Math.random() * 2 + 2;
            const curveType = Math.floor(Math.random() * 3);
            
            shootingStar.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
            
            const transforms = [
                `translate(${endX - startX}vw, ${endY - startY}vh)`,
                `translate(${endX - startX}vw, ${endY - startY}vh) rotate(-${Math.random() * 10 + 5}deg)`,
                `translate(${endX - startX}vw, ${endY - startY}vh) rotate(-${Math.random() * 20 + 10}deg)`
            ];
            
            shootingStar.style.transform = transforms[curveType];
            
            setTimeout(() => {
                shootingStar.style.opacity = '0';
                setTimeout(() => {
                    if (shootingStar.parentNode) {
                        shootingStar.remove();
                    }
                }, 1000);
            }, duration * 1000 - 500);
        }, 100);
    }
};

// ============================================
// ЧАТ-БОТ
// ============================================

const ChatBot = {
    init() {
        this.setupEventListeners();
        setTimeout(() => {
            this.addMessage('Привет! 👋 Я помогу вам забронировать номер в отеле Vila Eysk. Напишите "Привет" чтобы начать!', 'bot');
        }, 1000);
    },

    setupEventListeners() {
        const chatToggle = Utils.getElement('chatBotToggle');
        const closeChat = Utils.getElement('closeChat');
        const chatContainer = Utils.getElement('chatBotContainer');
        const sendButton = Utils.getElement('sendMessage');
        const chatInput = Utils.getElement('chatInput');

        if (chatToggle && chatContainer) {
            chatToggle.addEventListener('click', () => {
                chatContainer.style.display = 'flex';
                if (chatInput) chatInput.focus();
            });
        }

        if (closeChat && chatContainer) {
            closeChat.addEventListener('click', () => {
                chatContainer.style.display = 'none';
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    },

    sendMessage() {
        const chatInput = Utils.getElement('chatInput');
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        chatInput.value = '';

        setTimeout(() => {
            this.handleResponse(message);
        }, 1000);
    },

    addMessage(text, sender) {
        const chatMessages = Utils.getElement('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageText = document.createElement('p');
        messageText.textContent = text;
        messageDiv.appendChild(messageText);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    handleResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = '';

        if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй')) {
            response = 'Приятно познакомиться! Как вас зовут?';
            AppState.chatData.step = 'name';
        } 
        else if (AppState.chatData.step === 'name') {
            AppState.chatData.name = userMessage;
            response = `Приятно познакомиться, ${userMessage}! На какое количество гостей нужен номер?`;
            AppState.chatData.step = 'guests';
        } 
        else if (AppState.chatData.step === 'guests') {
            AppState.chatData.guests = userMessage;
            response = 'Отлично! Выберите тип номера:\n1. Стандарт (15,000 ₽/ночь)\n2. Люкс (25,000 ₽/ночь)\n3. Семейный (20,000 ₽/ночь)';
            AppState.chatData.step = 'room_type';
        } 
        else if (AppState.chatData.step === 'room_type') {
            if (userMessage.includes('1') || lowerMessage.includes('стандарт')) {
                AppState.chatData.roomType = 'standard';
                AppState.chatData.price = APP_CONFIG.PRICES.standard;
            } else if (userMessage.includes('2') || lowerMessage.includes('люкс')) {
                AppState.chatData.roomType = 'lux';
                AppState.chatData.price = APP_CONFIG.PRICES.lux;
            } else if (userMessage.includes('3') || lowerMessage.includes('семей')) {
                AppState.chatData.roomType = 'family';
                AppState.chatData.price = APP_CONFIG.PRICES.family;
            }
            
            response = `Отличный выбор! Номер "${Utils.getRoomName(AppState.chatData.roomType)}". На сколько ночей хотите забронировать?`;
            AppState.chatData.step = 'nights';
        } 
        else if (AppState.chatData.step === 'nights') {
            AppState.chatData.nights = parseInt(userMessage);
            const totalPrice = AppState.chatData.nights * AppState.chatData.price;
            response = `Отлично! ${AppState.chatData.nights} ночей в номере "${Utils.getRoomName(AppState.chatData.roomType)}".\nОбщая стоимость: ${Utils.formatPrice(totalPrice)}\n\nДля завершения бронирования введите ваш email:`;
            AppState.chatData.step = 'email';
        } 
        else if (AppState.chatData.step === 'email') {
            AppState.chatData.email = userMessage;
            const totalPrice = AppState.chatData.nights * AppState.chatData.price;
            response = `Спасибо! Бронирование завершено! ✅\n\nДетали:\n👤 Имя: ${AppState.chatData.name}\n👥 Гости: ${AppState.chatData.guests}\n🏨 Номер: ${Utils.getRoomName(AppState.chatData.roomType)}\n🌙 Ночей: ${AppState.chatData.nights}\n💰 Стоимость: ${Utils.formatPrice(totalPrice)}\n\nМы отправили подтверждение на ${userMessage}`;
            
            this.autoFillBookingForm();
            AppState.chatData.step = 'complete';
        } 
        else {
            response = 'Извините, я не понял ваш вопрос. Могу помочь с бронированием номера! Напишите "Привет" чтобы начать.';
        }

        this.addMessage(response, 'bot');
    },

    autoFillBookingForm() {
        if (AppState.chatData.name) {
            document.getElementById('guestName').value = AppState.chatData.name;
        }
        if (AppState.chatData.email) {
            document.getElementById('guestEmail').value = AppState.chatData.email;
        }
        if (AppState.chatData.guests) {
            document.getElementById('guestsSelect').value = AppState.chatData.guests;
        }

        const bookingSection = Utils.getElement('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// ============================================
// КАЛЕНДАРЬ
// ============================================

const CalendarManager = {
    init() {
        this.renderCalendar();
        this.setupNavigation();
    },

    renderCalendar() {
        const calendarDays = Utils.getElement('calendarDays');
        const currentMonthEl = Utils.getElement('currentMonth');
        
        if (!calendarDays || !currentMonthEl) return;

        const year = AppState.currentDate.getFullYear();
        const month = AppState.currentDate.getMonth();

        currentMonthEl.textContent = AppState.currentDate.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        });

        calendarDays.innerHTML = '';

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < (firstDay.getDay() + 6) % 7; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarDays.appendChild(emptyDay);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day available';
            dayEl.textContent = day;

            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            dayEl.dataset.date = date.toISOString().split('T')[0];

            if (date < today) {
                dayEl.classList.add('past');
                dayEl.classList.remove('available');
            }

            if (date.getTime() === today.getTime()) {
                dayEl.classList.add('today');
            }

            if (AppState.selectedDates.checkin && dayEl.dataset.date === AppState.selectedDates.checkin) {
                dayEl.classList.add('selected');
            }
            if (AppState.selectedDates.checkout && dayEl.dataset.date === AppState.selectedDates.checkout) {
                dayEl.classList.add('selected');
            }

            dayEl.addEventListener('click', () => this.selectDate(dayEl.dataset.date));
            calendarDays.appendChild(dayEl);
        }
    },

    selectDate(date) {
        const dateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateObj < today) return;

        if (!AppState.selectedDates.checkin || (AppState.selectedDates.checkin && AppState.selectedDates.checkout)) {
            AppState.selectedDates.checkin = date;
            AppState.selectedDates.checkout = null;
        } else if (AppState.selectedDates.checkin && !AppState.selectedDates.checkout) {
            if (new Date(date) > new Date(AppState.selectedDates.checkin)) {
                AppState.selectedDates.checkout = date;
            } else {
                AppState.selectedDates.checkin = date;
                AppState.selectedDates.checkout = null;
            }
        }

        this.updateDateDisplay();
        this.renderCalendar();
        BookingManager.updateTotalPrice();
    },

    updateDateDisplay() {
        const checkinDisplay = Utils.getElement('checkinDisplay');
        const checkoutDisplay = Utils.getElement('checkoutDisplay');
        const nightsDisplay = Utils.getElement('nightsDisplay');

        if (checkinDisplay) {
            checkinDisplay.textContent = AppState.selectedDates.checkin 
                ? Utils.formatDate(AppState.selectedDates.checkin)
                : '--';
        }

        if (checkoutDisplay) {
            checkoutDisplay.textContent = AppState.selectedDates.checkout 
                ? Utils.formatDate(AppState.selectedDates.checkout)
                : '--';
        }

        if (nightsDisplay) {
            if (AppState.selectedDates.checkin && AppState.selectedDates.checkout) {
                const nights = Utils.calculateNights(AppState.selectedDates.checkin, AppState.selectedDates.checkout);
                nightsDisplay.textContent = nights;
            } else {
                nightsDisplay.textContent = '0';
            }
        }
    },

    setupNavigation() {
        const prevBtn = Utils.getElement('prevMonth');
        const nextBtn = Utils.getElement('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                AppState.currentDate.setMonth(AppState.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                AppState.currentDate.setMonth(AppState.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }
};

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML
// ============================================

function scrollToBooking() {
    BookingManager.scrollToBooking();
}

function selectRoom(type, name, price) {
    BookingManager.selectRoom(type, name, price);
}

function showBookingForm() {
    BookingManager.showBookingForm();
}

// ============================================
// UI МЕНЕДЖЕР
// ============================================

const UIManager = {
    init() {
        this.setupScrollAnimations();
        this.setupSmoothScroll();
        this.setupMobileMenu();
    },

    setupScrollAnimations() {
        const revealSections = () => {
            document.querySelectorAll('.reveal-section').forEach(sec => {
                const rect = sec.getBoundingClientRect();
                if (rect.top < window.innerHeight - 100) {
                    sec.classList.add('revealed');
                }
            });
        };

        window.addEventListener('scroll', revealSections);
        revealSections();
    },

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    },

    setupMobileMenu() {
        const mobileMenuToggle = Utils.getElement('mobileMenuToggle');
        const closeMenu = Utils.getElement('closeMenu');
        const mobileMenu = Utils.getElement('mobileMenu');

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.add('active');
            });
        }

        if (closeMenu && mobileMenu) {
            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        }

        if (mobileMenu) {
            document.querySelectorAll('#mobileMenu a').forEach(item => {
                item.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                });
            });
        }
    }
};

// ============================================
// ЯНДЕКС.КАРТЫ
// ============================================

const YandexMapManager = {
    init() {
        if (typeof ymaps === 'undefined') {
            console.warn('⚠️ Яндекс.Карты API не подключен');
            return;
        }

        ymaps.ready(() => {
            this.createMap();
        });
    },

    createMap() {
        const coordinates = [46.6947, 38.2751];

        const myMap = new ymaps.Map('yandex-map', {
            center: coordinates,
            zoom: 16,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl', 'routeButtonControl']
        }, {
            searchControlProvider: 'yandex#search'
        });

        const myPlacemark = new ymaps.Placemark(coordinates, {
            balloonContentHeader: '<strong style="font-size: 16px; color: #667eea;">Vila Eysk</strong>',
            balloonContentBody: '<p style="margin: 10px 0;">Премиум-отель на первой линии Азовского моря</p><p><em>ул. Шмидта, 145, Ейск</em></p>',
            balloonContentFooter: '<a href="tel:+7XXXXXXXXXX" style="color: #667eea; text-decoration: none;">📞 +7 (XXX) XXX-XX-XX</a>',
            hintContent: '📍 Vila Eysk - Премиум-отель'
        }, {
            preset: 'islands#blueCircleDotIconWithCaption',
            iconCaptionMaxWidth: '215'
        });

        myMap.geoObjects.add(myPlacemark);

        const myCircle = new ymaps.Circle([coordinates, 500], {
            balloonContent: "Радиус 500м от отеля Vila Eysk"
        }, {
            fillColor: "#667eea40",
            strokeColor: "#667eea",
            strokeOpacity: 0.8,
            strokeWidth: 2
        });

        myMap.geoObjects.add(myCircle);
        myPlacemark.balloon.open();

        console.log('✅ Яндекс.Карта успешно загружена! Адрес: ул. Шмидта, 145');
    }
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Инициализация Vila Eysk...');

    try {
        BookingManager.init();
        CalendarManager.init();
        TimeOfDayManager.init();
        ChatBot.init();
        UIManager.init();
        YandexMapManager.init();

        console.log('✅ Сайт Vila Eysk успешно загружен!');

    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        Utils.showNotification('Произошла ошибка при загрузке сайта', 'error');
    }
});

// Экспорт для консоли
window.BookingManager = BookingManager;
window.AppState = AppState;