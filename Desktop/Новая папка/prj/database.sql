-- -- =============================================
-- -- VILA EYSK - ПРЕМИУМ СИСТЕМА БРОНИРОВАНИЯ
-- -- =============================================

-- -- Создаем базу с крутым названием
-- CREATE DATABASE vila_eysk_premium;

-- \c vila_eysk_premium;

-- -- ==================== ОСНОВНЫЕ ТАБЛИЦЫ ====================

-- -- Таблица категорий номеров (для гибкости)
-- CREATE TABLE room_categories (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL UNIQUE,
--     description TEXT,
--     base_price INTEGER NOT NULL,
--     max_capacity INTEGER NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица номеров с расширенными параметрами
-- CREATE TABLE rooms (
--     id SERIAL PRIMARY KEY,
--     category_id INTEGER REFERENCES room_categories(id),
--     room_number VARCHAR(10) UNIQUE NOT NULL,
--     floor INTEGER NOT NULL,
--     view_type VARCHAR(50) CHECK (view_type IN ('sea', 'garden', 'pool', 'mountain')),
--     size_sqm INTEGER,
--     balcony BOOLEAN DEFAULT false,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица тарифов (динамическое ценообразование)
-- CREATE TABLE rate_plans (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     category_id INTEGER REFERENCES room_categories(id),
--     start_date DATE NOT NULL,
--     end_date DATE NOT NULL,
--     price_per_night INTEGER NOT NULL,
--     min_stay INTEGER DEFAULT 1,
--     max_stay INTEGER DEFAULT 30,
--     includes_breakfast BOOLEAN DEFAULT false,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица гостей (CRM система)
-- CREATE TABLE guests (
--     id SERIAL PRIMARY KEY,
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     email VARCHAR(150) UNIQUE NOT NULL,
--     phone VARCHAR(20),
--     passport_number VARCHAR(50),
--     date_of_birth DATE,
--     country VARCHAR(100),
--     preferences JSONB, -- Любимые номера, питание и т.д.
--     loyalty_points INTEGER DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица бронирований (основная)
-- CREATE TABLE bookings (
--     id SERIAL PRIMARY KEY,
--     booking_reference VARCHAR(20) UNIQUE NOT NULL,
--     guest_id INTEGER REFERENCES guests(id),
--     room_id INTEGER REFERENCES rooms(id),
--     rate_plan_id INTEGER REFERENCES rate_plans(id),
    
--     -- Даты
--     check_in DATE NOT NULL,
--     check_out DATE NOT NULL,
--     actual_check_in TIMESTAMP,
--     actual_check_out TIMESTAMP,
    
--     -- Гости
--     adults_count INTEGER NOT NULL DEFAULT 1,
--     children_count INTEGER DEFAULT 0,
--     children_ages JSONB, -- Возрасты детей [2, 5, 7]
    
--     -- Финансы
--     total_price INTEGER NOT NULL,
--     deposit_paid INTEGER DEFAULT 0,
--     payment_status VARCHAR(20) DEFAULT 'pending',
    
--     -- Статус
--     status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, checked_in, checked_out, cancelled
--     special_requests TEXT,
--     source VARCHAR(50) DEFAULT 'website', -- website, booking.com, phone, walk_in
    
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица занятости (для быстрого поиска)
-- CREATE TABLE room_occupancy (
--     id SERIAL PRIMARY KEY,
--     room_id INTEGER REFERENCES rooms(id),
--     booking_id INTEGER REFERENCES bookings(id),
--     date DATE NOT NULL,
--     status VARCHAR(20) DEFAULT 'occupied' -- occupied, blocked, out_of_service
-- );

-- -- Таблица платежей
-- CREATE TABLE payments (
--     id SERIAL PRIMARY KEY,
--     booking_id INTEGER REFERENCES bookings(id),
--     amount INTEGER NOT NULL,
--     payment_method VARCHAR(50) NOT NULL, -- card, cash, transfer
--     payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     transaction_id VARCHAR(100),
--     status VARCHAR(20) DEFAULT 'completed',
--     notes TEXT
-- );

-- -- Таблица услуг отеля (дополнительные)
-- CREATE TABLE hotel_services (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     description TEXT,
--     price INTEGER NOT NULL,
--     category VARCHAR(50), -- spa, restaurant, transfer, etc
--     is_active BOOLEAN DEFAULT true
-- );

-- -- Таблица заказов услуг
-- CREATE TABLE service_orders (
--     id SERIAL PRIMARY KEY,
--     booking_id INTEGER REFERENCES bookings(id),
--     service_id INTEGER REFERENCES hotel_services(id),
--     quantity INTEGER DEFAULT 1,
--     order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     scheduled_time TIMESTAMP,
--     status VARCHAR(20) DEFAULT 'ordered', -- ordered, in_progress, completed, cancelled
--     total_price INTEGER NOT NULL
-- );

-- -- ==================== ЗАПОЛНЯЕМ ДАННЫМИ ====================

-- -- Категории номеров
-- INSERT INTO room_categories (name, description, base_price, max_capacity) VALUES
-- ('Стандарт', 'Комфортабельный номер с видом на сад', 15000, 2),
-- ('Стандарт Премиум', 'Номер с видом на море и балконом', 18000, 2),
-- ('Люкс', 'Просторный номер с гостиной зоной', 25000, 3),
-- ('Семейный Люкс', 'Двухкомнатный номер для семьи', 30000, 4),
-- ('Президентский Люкс', 'Эксклюзивный номер с приватным бассейном', 50000, 2);

-- -- Номера
-- INSERT INTO rooms (category_id, room_number, floor, view_type, size_sqm, balcony) VALUES
-- (1, '101', 1, 'garden', 25, false),
-- (1, '102', 1, 'garden', 25, false),
-- (2, '201', 2, 'sea', 30, true),
-- (2, '202', 2, 'sea', 30, true),
-- (3, '301', 3, 'sea', 45, true),
-- (4, '401', 4, 'sea', 60, true),
-- (5, '501', 5, 'sea', 120, true);

-- -- Тарифы (сезонные цены)
-- INSERT INTO rate_plans (name, category_id, start_date, end_date, price_per_night, includes_breakfast) VALUES
-- ('Стандартный', 1, '2024-01-01', '2024-12-31', 15000, false),
-- ('Стандартный', 2, '2024-01-01', '2024-12-31', 18000, true),
-- ('Летний пик', 1, '2024-06-01', '2024-08-31', 20000, false),
-- ('Летний пик', 2, '2024-06-01', '2024-08-31', 25000, true),
-- ('Зимний', 1, '2024-12-01', '2025-02-28', 12000, false);

-- -- Услуги отеля
-- INSERT INTO hotel_services (name, description, price, category) VALUES
-- ('SPA-массаж', 'Расслабляющий массаж 60 минут', 3000, 'spa'),
-- ('Трансфер из аэропорта', 'Комфортабельный автомобиль', 2000, 'transfer'),
-- ('Романтический ужин', 'Ужин при свечах на берегу моря', 5000, 'restaurant'),
-- ('Экскурсия по городу', 'Обзорная экскурсия с гидом', 2500, 'excursion'),
-- ('Завтрак в номер', 'Континентальный завтрак', 1500, 'restaurant');

-- -- ==================== СЛОЖНЫЕ ИНДЕКСЫ ====================

-- -- Для быстрого поиска доступных номеров
-- CREATE INDEX idx_room_occupancy_date ON room_occupancy(date);
-- CREATE INDEX idx_room_occupancy_room_date ON room_occupancy(room_id, date);
-- CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
-- CREATE INDEX idx_bookings_status ON bookings(status);
-- CREATE INDEX idx_guests_email ON guests(email);

-- -- ==================== СИСТЕМНЫЕ ФУНКЦИИ ====================

-- -- Функция для генерации номера бронирования
-- CREATE OR REPLACE FUNCTION generate_booking_reference() 
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.booking_reference := 'VE' || to_char(CURRENT_DATE, 'YYMMDD') || LPAD(NEW.id::text, 4, '0');
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Триггер для автоматической генерации номера брони
-- CREATE TRIGGER trg_generate_booking_ref
--     BEFORE INSERT ON bookings
--     FOR EACH ROW
--     EXECUTE FUNCTION generate_booking_reference();

-- -- Функция для проверки доступности номера
-- CREATE OR REPLACE FUNCTION check_room_availability(
--     p_room_id INTEGER,
--     p_check_in DATE,
--     p_check_out DATE
-- ) RETURNS BOOLEAN AS $$
-- DECLARE
--     overlapping_count INTEGER;
-- BEGIN
--     SELECT COUNT(*) INTO overlapping_count
--     FROM room_occupancy 
--     WHERE room_id = p_room_id 
--     AND date BETWEEN p_check_in AND (p_check_out - INTERVAL '1 day')
--     AND status = 'occupied';
    
--     RETURN overlapping_count = 0;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Функция для расчета стоимости
-- CREATE OR REPLACE FUNCTION calculate_booking_total(
--     p_room_id INTEGER,
--     p_rate_plan_id INTEGER,
--     p_check_in DATE,
--     p_check_out DATE,
--     p_adults INTEGER,
--     p_children INTEGER
-- ) RETURNS INTEGER AS $$
-- DECLARE
--     nights INTEGER;
--     rate_price INTEGER;
--     total INTEGER;
-- BEGIN
--     -- Считаем количество ночей
--     nights := p_check_out - p_check_in;
    
--     -- Получаем цену из тарифа
--     SELECT price_per_night INTO rate_price
--     FROM rate_plans 
--     WHERE id = p_rate_plan_id;
    
--     -- Базовая стоимость
--     total := nights * rate_price;
    
--     -- Доплата за дополнительных гостей
--     IF p_adults > 2 THEN
--         total := total + (p_adults - 2) * 1000 * nights;
--     END IF;
    
--     IF p_children > 0 THEN
--         total := total + p_children * 500 * nights;
--     END IF;
    
--     RETURN total;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ==================== ПРОЦЕДУРА БРОНИРОВАНИЯ ====================

-- CREATE OR REPLACE PROCEDURE create_booking(
--     p_guest_email VARCHAR,
--     p_guest_first_name VARCHAR,
--     p_guest_last_name VARCHAR,
--     p_guest_phone VARCHAR,
--     p_room_id INTEGER,
--     p_rate_plan_id INTEGER,
--     p_check_in DATE,
--     p_check_out DATE,
--     p_adults_count INTEGER,
--     p_children_count INTEGER DEFAULT 0,
--     p_children_ages JSONB DEFAULT NULL,
--     p_special_requests TEXT DEFAULT NULL,
--     OUT p_booking_id INTEGER,
--     OUT p_booking_reference VARCHAR,
--     OUT p_total_price INTEGER
-- ) AS $$
-- DECLARE
--     v_guest_id INTEGER;
--     v_room_available BOOLEAN;
--     v_rate_price INTEGER;
--     v_nights INTEGER;
-- BEGIN
--     -- Проверяем доступность номера
--     v_room_available := check_room_availability(p_room_id, p_check_in, p_check_out);
--     IF NOT v_room_available THEN
--         RAISE EXCEPTION 'Номер недоступен на выбранные даты';
--     END IF;

--     -- Находим или создаем гостя
--     SELECT id INTO v_guest_id FROM guests WHERE email = p_guest_email;
--     IF v_guest_id IS NULL THEN
--         INSERT INTO guests (first_name, last_name, email, phone)
--         VALUES (p_guest_first_name, p_guest_last_name, p_guest_email, p_guest_phone)
--         RETURNING id INTO v_guest_id;
--     END IF;

--     -- Рассчитываем стоимость
--     SELECT calculate_booking_total(
--         p_room_id, p_rate_plan_id, p_check_in, p_check_out, 
--         p_adults_count, p_children_count
--     ) INTO p_total_price;

--     -- Создаем бронирование
--     INSERT INTO bookings (
--         guest_id, room_id, rate_plan_id, check_in, check_out,
--         adults_count, children_count, children_ages, special_requests, total_price
--     ) VALUES (
--         v_guest_id, p_room_id, p_rate_plan_id, p_check_in, p_check_out,
--         p_adults_count, p_children_count, p_children_ages, p_special_requests, p_total_price
--     ) RETURNING id, booking_reference INTO p_booking_id, p_booking_reference;

--     -- Заполняем таблицу занятости
--     INSERT INTO room_occupancy (room_id, booking_id, date)
--     SELECT p_room_id, p_booking_id, generate_series(
--         p_check_in, 
--         p_check_out - INTERVAL '1 day', 
--         INTERVAL '1 day'
--     )::date;

--     COMMIT;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ==================== ВИДЫ ДЛЯ ОТЧЕТОВ ====================

-- -- Вид доступных номеров
-- CREATE VIEW available_rooms AS
-- SELECT 
--     r.id,
--     r.room_number,
--     rc.name as category_name,
--     rc.base_price,
--     r.view_type,
--     r.ballet,
--     r.size_sqm
-- FROM rooms r
-- JOIN room_categories rc ON r.category_id = rc.id
-- WHERE r.id NOT IN (
--     SELECT DISTINCT room_id 
--     FROM room_occupancy 
--     WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
--     AND status = 'occupied'
-- );

-- -- Вид текущих бронирований
-- CREATE VIEW current_bookings AS
-- SELECT 
--     b.booking_reference,
--     g.first_name || ' ' || g.last_name as guest_name,
--     r.room_number,
--     rc.name as room_category,
--     b.check_in,
--     b.check_out,
--     b.total_price,
--     b.status
-- FROM bookings b
-- JOIN guests g ON b.guest_id = g.id
-- JOIN rooms r ON b.room_id = r.id
-- JOIN room_categories rc ON r.category_id = rc.id
-- WHERE b.check_out >= CURRENT_DATE
-- ORDER BY b.check_in;





-- -- ==================== ТЕСТОВЫЕ ДАННЫЕ ====================






-- -- =============================================
-- -- СИСТЕМА АВТОРИЗАЦИИ И УПРАВЛЕНИЯ АККАУНТАМИ
-- -- =============================================

-- -- Таблица пользователей (для авторизации)
-- CREATE TABLE users (
--     id SERIAL PRIMARY KEY,
--     guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
--     email VARCHAR(150) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     photo_url VARCHAR(500),
--     is_active BOOLEAN DEFAULT true,
--     email_verified BOOLEAN DEFAULT false,
--     verification_token VARCHAR(100),
--     reset_token VARCHAR(100),
--     reset_token_expires TIMESTAMP,
--     registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last_login TIMESTAMP,
--     login_method VARCHAR(50) DEFAULT 'email', -- email, google, facebook
--     google_id VARCHAR(100),
--     facebook_id VARCHAR(100)
-- );

-- -- Таблица статистики пользователей
-- CREATE TABLE user_stats (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     total_stays INTEGER DEFAULT 0,
--     total_nights INTEGER DEFAULT 0,
--     total_spent INTEGER DEFAULT 0,
--     total_saved INTEGER DEFAULT 0,
--     loyalty_level VARCHAR(20) DEFAULT 'guest' CHECK (loyalty_level IN ('guest', 'bronze', 'silver', 'gold', 'platinum')),
--     loyalty_points INTEGER DEFAULT 0,
--     current_streak INTEGER DEFAULT 0, -- Количество последовательных визитов
--     last_visit_date DATE,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица сессий (для Remember Me и JWT токенов)
-- CREATE TABLE user_sessions (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     session_token VARCHAR(500) UNIQUE NOT NULL,
--     refresh_token VARCHAR(500),
--     ip_address VARCHAR(45),
--     user_agent TEXT,
--     expires_at TIMESTAMP NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица избранных номеров
-- CREATE TABLE user_favorites (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     category_id INTEGER NOT NULL REFERENCES room_categories(id) ON DELETE CASCADE,
--     added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(user_id, category_id)
-- );

-- -- Таблица отзывов
-- CREATE TABLE user_reviews (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
--     rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
--     title VARCHAR(200),
--     comment TEXT,
--     is_approved BOOLEAN DEFAULT false,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица уведомлений
-- CREATE TABLE user_notifications (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     type VARCHAR(50) NOT NULL, -- booking_confirmed, check_in_reminder, loyalty_upgrade, etc
--     title VARCHAR(200) NOT NULL,
--     message TEXT NOT NULL,
--     is_read BOOLEAN DEFAULT false,
--     related_booking_id INTEGER REFERENCES bookings(id),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Таблица истории действий пользователя (audit log)
-- CREATE TABLE user_activity_log (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     action_type VARCHAR(50) NOT NULL, -- login, logout, booking_created, profile_updated, etc
--     description TEXT,
--     ip_address VARCHAR(45),
--     user_agent TEXT,
--     metadata JSONB,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- ==================== ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ====================

-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_guest_id ON users(guest_id);
-- CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
-- CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
-- CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
-- CREATE INDEX idx_user_reviews_user ON user_reviews(user_id);
-- CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, is_read);
-- CREATE INDEX idx_user_activity_user_date ON user_activity_log(user_id, created_at DESC);

-- -- ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ ====================

-- -- Функция для создания пользователя и гостя одновременно
-- CREATE OR REPLACE FUNCTION create_user_account(
--     p_email VARCHAR,
--     p_password VARCHAR,
--     p_first_name VARCHAR,
--     p_last_name VARCHAR,
--     p_phone VARCHAR DEFAULT NULL
-- ) RETURNS TABLE(user_id INTEGER, guest_id INTEGER, success BOOLEAN, message TEXT) AS $$
-- DECLARE
--     v_guest_id INTEGER;
--     v_user_id INTEGER;
--     v_password_hash VARCHAR;
-- BEGIN
--     -- Проверяем существование email
--     IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
--         RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, false, 'Email уже используется'::TEXT;
--         RETURN;
--     END IF;

--     -- Создаем запись гостя
--     INSERT INTO guests (first_name, last_name, email, phone)
--     VALUES (p_first_name, p_last_name, p_email, p_phone)
--     RETURNING id INTO v_guest_id;

--     -- Хешируем пароль (в реальности используйте bcrypt через приложение)
--     v_password_hash := crypt(p_password, gen_salt('bf'));

--     -- Создаем пользователя
--     INSERT INTO users (guest_id, email, password_hash)
--     VALUES (v_guest_id, p_email, v_password_hash)
--     RETURNING id INTO v_user_id;

--     -- Создаем статистику
--     INSERT INTO user_stats (user_id) VALUES (v_user_id);

--     RETURN QUERY SELECT v_user_id, v_guest_id, true, 'Аккаунт успешно создан'::TEXT;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Функция для расчета уровня лояльности
-- CREATE OR REPLACE FUNCTION calculate_loyalty_level(p_total_stays INTEGER)
-- RETURNS VARCHAR AS $$
-- BEGIN
--     CASE
--         WHEN p_total_stays >= 50 THEN RETURN 'platinum';
--         WHEN p_total_stays >= 20 THEN RETURN 'gold';
--         WHEN p_total_stays >= 10 THEN RETURN 'silver';
--         WHEN p_total_stays >= 5 THEN RETURN 'bronze';
--         ELSE RETURN 'guest';
--     END CASE;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Функция для получения процента скидки по уровню лояльности
-- CREATE OR REPLACE FUNCTION get_loyalty_discount(p_loyalty_level VARCHAR)
-- RETURNS INTEGER AS $$
-- BEGIN
--     CASE p_loyalty_level
--         WHEN 'platinum' THEN RETURN 25;
--         WHEN 'gold' THEN RETURN 15;
--         WHEN 'silver' THEN RETURN 10;
--         WHEN 'bronze' THEN RETURN 5;
--         ELSE RETURN 0;
--     END CASE;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Функция для обновления статистики пользователя
-- CREATE OR REPLACE FUNCTION update_user_statistics(p_user_id INTEGER)
-- RETURNS VOID AS $$
-- DECLARE
--     v_guest_id INTEGER;
--     v_total_stays INTEGER;
--     v_total_nights INTEGER;
--     v_total_spent INTEGER;
--     v_total_saved INTEGER;
--     v_new_level VARCHAR;
-- BEGIN
--     -- Получаем guest_id
--     SELECT guest_id INTO v_guest_id FROM users WHERE id = p_user_id;

--     -- Считаем статистику из завершенных бронирований
--     SELECT 
--         COUNT(*),
--         COALESCE(SUM(EXTRACT(DAY FROM (check_out - check_in))), 0),
--         COALESCE(SUM(total_price), 0),
--         COALESCE(SUM(total_price * 0.15), 0) -- Примерная экономия от скидок
--     INTO v_total_stays, v_total_nights, v_total_spent, v_total_saved
--     FROM bookings
--     WHERE guest_id = v_guest_id
--     AND status = 'checked_out';

--     -- Рассчитываем новый уровень
--     v_new_level := calculate_loyalty_level(v_total_stays);

--     -- Обновляем статистику
--     UPDATE user_stats SET
--         total_stays = v_total_stays,
--         total_nights = v_total_nights,
--         total_spent = v_total_spent,
--         total_saved = v_total_saved,
--         loyalty_level = v_new_level,
--         loyalty_points = v_total_stays * 100,
--         updated_at = CURRENT_TIMESTAMP
--     WHERE user_id = p_user_id;

--     -- Если уровень повысился, создаем уведомление
--     IF (SELECT loyalty_level FROM user_stats WHERE user_id = p_user_id) != v_new_level THEN
--         INSERT INTO user_notifications (user_id, type, title, message)
--         VALUES (
--             p_user_id,
--             'loyalty_upgrade',
--             'Поздравляем с повышением уровня!',
--             'Ваш новый уровень лояльности: ' || v_new_level || '. Теперь вам доступна скидка ' || get_loyalty_discount(v_new_level) || '%!'
--         );
--     END IF;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ==================== ТРИГГЕРЫ ====================

-- -- Триггер для автоматического обновления статистики при изменении бронирования
-- CREATE OR REPLACE FUNCTION trigger_update_user_stats()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     v_user_id INTEGER;
-- BEGIN
--     -- Получаем user_id через guest_id
--     SELECT u.id INTO v_user_id
--     FROM users u
--     WHERE u.guest_id = NEW.guest_id;

--     IF v_user_id IS NOT NULL THEN
--         -- Обновляем статистику
--         PERFORM update_user_statistics(v_user_id);
        
--         -- Логируем действие
--         INSERT INTO user_activity_log (user_id, action_type, description, metadata)
--         VALUES (
--             v_user_id,
--             'booking_status_changed',
--             'Статус бронирования изменен на ' || NEW.status,
--             jsonb_build_object('booking_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
--         );
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_booking_status_change
--     AFTER UPDATE OF status ON bookings
--     FOR EACH ROW
--     WHEN (OLD.status IS DISTINCT FROM NEW.status)
--     EXECUTE FUNCTION trigger_update_user_stats();

-- -- Триггер для создания уведомления при новом бронировании
-- CREATE OR REPLACE FUNCTION trigger_booking_confirmation()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     v_user_id INTEGER;
-- BEGIN
--     SELECT u.id INTO v_user_id
--     FROM users u
--     WHERE u.guest_id = NEW.guest_id;

--     IF v_user_id IS NOT NULL THEN
--         INSERT INTO user_notifications (user_id, type, title, message, related_booking_id)
--         VALUES (
--             v_user_id,
--             'booking_confirmed',
--             'Бронирование подтверждено',
--             'Ваше бронирование ' || NEW.booking_reference || ' подтверждено. Заезд: ' || 
--             TO_CHAR(NEW.check_in, 'DD.MM.YYYY') || ', Выезд: ' || TO_CHAR(NEW.check_out, 'DD.MM.YYYY'),
--             NEW.id
--         );
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_new_booking_notification
--     AFTER INSERT ON bookings
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_booking_confirmation();

-- -- Триггер для очистки истекших сессий
-- CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trg_cleanup_sessions
--     AFTER INSERT ON user_sessions
--     EXECUTE FUNCTION cleanup_expired_sessions();

-- -- ==================== ПРЕДСТАВЛЕНИЯ (VIEWS) ====================

-- -- Полная информация о пользователе
-- CREATE VIEW user_full_profile AS
-- SELECT 
--     u.id as user_id,
--     u.email,
--     u.photo_url,
--     u.is_active,
--     u.registered_at,
--     u.last_login,
--     g.first_name,
--     g.last_name,
--     g.phone,
--     g.passport_number,
--     g.date_of_birth,
--     g.country,
--     s.total_stays,
--     s.total_nights,
--     s.total_spent,
--     s.total_saved,
--     s.loyalty_level,
--     s.loyalty_points,
--     s.current_streak,
--     get_loyalty_discount(s.loyalty_level) as current_discount
-- FROM users u
-- JOIN guests g ON u.guest_id = g.id
-- LEFT JOIN user_stats s ON u.id = s.user_id;

-- -- Активные бронирования пользователя
-- CREATE VIEW user_active_bookings AS
-- SELECT 
--     u.id as user_id,
--     b.id as booking_id,
--     b.booking_reference,
--     b.check_in,
--     b.check_out,
--     b.status,
--     r.room_number,
--     rc.name as room_category,
--     b.total_price,
--     b.adults_count,
--     b.children_count,
--     EXTRACT(DAY FROM (b.check_out - b.check_in)) as nights
-- FROM users u
-- JOIN bookings b ON u.guest_id = b.guest_id
-- JOIN rooms r ON b.room_id = r.id
-- JOIN room_categories rc ON r.category_id = rc.id
-- WHERE b.status IN ('confirmed', 'checked_in')
-- AND b.check_out >= CURRENT_DATE;

-- -- История бронирований
-- CREATE VIEW user_booking_history AS
-- SELECT 
--     u.id as user_id,
--     b.id as booking_id,
--     b.booking_reference,
--     b.check_in,
--     b.check_out,
--     b.status,
--     r.room_number,
--     rc.name as room_category,
--     b.total_price,
--     b.created_at,
--     EXTRACT(DAY FROM (b.check_out - b.check_in)) as nights
-- FROM users u
-- JOIN bookings b ON u.guest_id = b.guest_id
-- JOIN rooms r ON b.room_id = r.id
-- JOIN room_categories rc ON r.category_id = rc.id
-- ORDER BY b.created_at DESC;

-- -- Непрочитанные уведомления
-- CREATE VIEW user_unread_notifications AS
-- SELECT 
--     n.*,
--     b.booking_reference
-- FROM user_notifications n
-- LEFT JOIN bookings b ON n.related_booking_id = b.id
-- WHERE n.is_read = false
-- ORDER BY n.created_at DESC;

-- -- ==================== ХРАНИМЫЕ ПРОЦЕДУРЫ ====================

-- -- Процедура создания бронирования с учетом пользователя и скидки
-- CREATE OR REPLACE PROCEDURE create_user_booking(
--     p_user_id INTEGER,
--     p_room_id INTEGER,
--     p_rate_plan_id INTEGER,
--     p_check_in DATE,
--     p_check_out DATE,
--     p_adults_count INTEGER,
--     p_children_count INTEGER DEFAULT 0,
--     p_children_ages JSONB DEFAULT NULL,
--     p_special_requests TEXT DEFAULT NULL,
--     OUT p_booking_id INTEGER,
--     OUT p_booking_reference VARCHAR,
--     OUT p_original_price INTEGER,
--     OUT p_discount_percent INTEGER,
--     OUT p_final_price INTEGER
-- ) AS $$
-- DECLARE
--     v_guest_id INTEGER;
--     v_loyalty_level VARCHAR;
--     v_base_price INTEGER;
-- BEGIN
--     -- Получаем guest_id и уровень лояльности
--     SELECT u.guest_id, s.loyalty_level 
--     INTO v_guest_id, v_loyalty_level
--     FROM users u
--     JOIN user_stats s ON u.id = s.user_id
--     WHERE u.id = p_user_id;

--     IF v_guest_id IS NULL THEN
--         RAISE EXCEPTION 'Пользователь не найден';
--     END IF;

--     -- Проверяем доступность номера
--     IF NOT check_room_availability(p_room_id, p_check_in, p_check_out) THEN
--         RAISE EXCEPTION 'Номер недоступен на выбранные даты';
--     END IF;

--     -- Рассчитываем базовую стоимость
--     SELECT calculate_booking_total(
--         p_room_id, p_rate_plan_id, p_check_in, p_check_out, 
--         p_adults_count, p_children_count
--     ) INTO v_base_price;

--     p_original_price := v_base_price;

--     -- Применяем скидку лояльности
--     p_discount_percent := get_loyalty_discount(v_loyalty_level);
--     p_final_price := v_base_price - (v_base_price * p_discount_percent / 100);

--     -- Создаем бронирование
--     INSERT INTO bookings (
--         guest_id, room_id, rate_plan_id, check_in, check_out,
--         adults_count, children_count, children_ages, 
--         special_requests, total_price, payment_status
--     ) VALUES (
--         v_guest_id, p_room_id, p_rate_plan_id, p_check_in, p_check_out,
--         p_adults_count, p_children_count, p_children_ages,
--         p_special_requests, p_final_price, 'pending'
--     ) RETURNING id, booking_reference INTO p_booking_id, p_booking_reference;

--     -- Заполняем таблицу занятости
--     INSERT INTO room_occupancy (room_id, booking_id, date)
--     SELECT p_room_id, p_booking_id, generate_series(
--         p_check_in, 
--         p_check_out - INTERVAL '1 day', 
--         INTERVAL '1 day'
--     )::date;

--     -- Логируем действие
--     INSERT INTO user_activity_log (user_id, action_type, description, metadata)
--     VALUES (
--         p_user_id,
--         'booking_created',
--         'Создано бронирование ' || p_booking_reference,
--         jsonb_build_object(
--             'booking_id', p_booking_id,
--             'room_id', p_room_id,
--             'discount', p_discount_percent,
--             'saved_amount', (p_original_price - p_final_price)
--         )
--     );

--     COMMIT;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Процедура отмены бронирования
-- CREATE OR REPLACE PROCEDURE cancel_user_booking(
--     p_user_id INTEGER,
--     p_booking_id INTEGER,
--     p_reason TEXT DEFAULT NULL
-- ) AS $$
-- DECLARE
--     v_guest_id INTEGER;
--     v_booking_guest_id INTEGER;
-- BEGIN
--     -- Получаем guest_id пользователя
--     SELECT guest_id INTO v_guest_id FROM users WHERE id = p_user_id;

--     -- Проверяем принадлежность бронирования
--     SELECT guest_id INTO v_booking_guest_id FROM bookings WHERE id = p_booking_id;

--     IF v_guest_id != v_booking_guest_id THEN
--         RAISE EXCEPTION 'Бронирование не принадлежит пользователю';
--     END IF;

--     -- Отменяем бронирование
--     UPDATE bookings SET 
--         status = 'cancelled',
--         updated_at = CURRENT_TIMESTAMP
--     WHERE id = p_booking_id;

--     -- Освобождаем номер
--     DELETE FROM room_occupancy WHERE booking_id = p_booking_id;

--     -- Создаем уведомление
--     INSERT INTO user_notifications (user_id, type, title, message, related_booking_id)
--     VALUES (
--         p_user_id,
--         'booking_cancelled',
--         'Бронирование отменено',
--         'Ваше бронирование успешно отменено. ' || COALESCE('Причина: ' || p_reason, ''),
--         p_booking_id
--     );

--     -- Логируем
--     INSERT INTO user_activity_log (user_id, action_type, description, metadata)
--     VALUES (
--         p_user_id,
--         'booking_cancelled',
--         'Отменено бронирование',
--         jsonb_build_object('booking_id', p_booking_id, 'reason', p_reason)
--     );

--     COMMIT;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ==================== ФУНКЦИИ ДЛЯ API ====================

-- -- Получить полный профиль пользователя со всеми данными
-- CREATE OR REPLACE FUNCTION get_user_profile(p_user_id INTEGER)
-- RETURNS JSON AS $$
-- DECLARE
--     v_result JSON;
-- BEGIN
--     SELECT json_build_object(
--         'user', (
--             SELECT row_to_json(u.*) FROM user_full_profile u WHERE u.user_id = p_user_id
--         ),
--         'active_bookings', (
--             SELECT json_agg(row_to_json(b.*)) FROM user_active_bookings b WHERE b.user_id = p_user_id
--         ),
--         'favorites', (
--             SELECT json_agg(json_build_object(
--                 'id', uf.id,
--                 'category_name', rc.name,
--                 'base_price', rc.base_price,
--                 'added_at', uf.added_at
--             ))
--             FROM user_favorites uf
--             JOIN room_categories rc ON uf.category_id = rc.id
--             WHERE uf.user_id = p_user_id
--         ),
--         'notifications', (
--             SELECT json_agg(row_to_json(n.*)) 
--             FROM user_unread_notifications n 
--             WHERE n.user_id = p_user_id
--             LIMIT 10
--         )
--     ) INTO v_result;

--     RETURN v_result;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Получить историю бронирований с фильтром
-- CREATE OR REPLACE FUNCTION get_user_bookings(
--     p_user_id INTEGER,
--     p_status VARCHAR DEFAULT 'all',
--     p_limit INTEGER DEFAULT 20,
--     p_offset INTEGER DEFAULT 0
-- )
-- RETURNS JSON AS $$
-- DECLARE
--     v_result JSON;
-- BEGIN
--     SELECT json_build_object(
--         'bookings', (
--             SELECT json_agg(row_to_json(t))
--             FROM (
--                 SELECT 
--                     b.*,
--                     CASE 
--                         WHEN b.check_in > CURRENT_DATE THEN 'upcoming'
--                         WHEN b.check_in <= CURRENT_DATE AND b.check_out > CURRENT_DATE THEN 'active'
--                         ELSE 'past'
--                     END as booking_type
--                 FROM user_booking_history b
--                 WHERE b.user_id = p_user_id
--                 AND (p_status = 'all' OR b.status = p_status)
--                 ORDER BY b.created_at DESC
--                 LIMIT p_limit OFFSET p_offset
--             ) t
--         ),
--         'total_count', (
--             SELECT COUNT(*) 
--             FROM user_booking_history 
--             WHERE user_id = p_user_id
--             AND (p_status = 'all' OR status = p_status)
--         )
--     ) INTO v_result;

--     RETURN v_result;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- ==================== ТЕСТОВЫЕ ДАННЫЕ ====================

-- -- Создаем тестовых пользователей
-- DO $$
-- DECLARE
--     v_user_id INTEGER;
--     v_guest_id INTEGER;
-- BEGIN
--     -- Пользователь 1
--     SELECT * FROM create_user_account(
--         'test@vilaeysk.ru',
--         'password123',
--         'Алексей',
--         'Тестовый',
--         '+79181111111'
--     ) INTO v_user_id, v_guest_id;

--     -- Добавляем демо-бронирования для статистики
--     INSERT INTO bookings (guest_id, room_id, rate_plan_id, check_in, check_out, adults_count, total_price, status)
--     VALUES 
--         (v_guest_id, 3, 2, '2024-01-15', '2024-01-20', 2, 90000, 'checked_out'),
--         (v_guest_id, 5, 3, '2024-03-10', '2024-03-15', 2, 125000, 'checked_out'),
--         (v_guest_id, 3, 2, '2024-05-20', '2024-05-25', 2, 100000, 'checked_out'),
--         (v_guest_id, 7, 1, '2024-07-01', '2024-07-07', 2, 300000, 'checked_out'),
--         (v_guest_id, 5, 3, '2024-09-15', '2024-09-20', 2, 125000, 'checked_out');

--     -- Обновляем статистику
--     PERFORM update_user_statistics(v_user_id);

--     -- Добавляем избранные
--     INSERT INTO user_favorites (user_id, category_id) VALUES (v_user_id, 3), (v_user_id, 5);

--     RAISE NOTICE 'Тестовый пользователь создан: test@vilaeysk.ru / password123';
-- END $$;

-- -- ==================== ФИНАЛЬНЫЕ ПРОВЕРКИ ====================

-- -- Проверяем созданные объекты
-- SELECT '✅ СИСТЕМА АВТОРИЗАЦИИ УСТАНОВЛЕНА!' as status;

-- SELECT 
--     'Таблицы: ' || COUNT(*) as tables_created
-- FROM information_schema.tables 






-- -- Создаем тестовое бронирование
-- INSERT INTO guests (first_name, last_name, email, phone) VALUES
-- ('Иван', 'Петров', 'ivan@mail.ru', '+79181234567'),
-- ('Мария', 'Сидорова', 'maria@mail.ru', '+79187654321');

-- -- Вызываем процедуру бронирования
-- CALL create_booking(
--     'ivan@mail.ru', 'Иван', 'Петров', '+79181234567',
--     3, 1, '2024-06-15', '2024-06-20', 2, 0, NULL, 'Хочу номер с видом на море'
-- );

-- -- ==================== ФИНАЛЬНАЯ ПРОВЕРКА ====================

-- SELECT '🎉 БАЗА ДАННЫХ VILA EYSK УСПЕШНО СОЗДАНА!' as message;
-- SELECT '📊 Статистика:' as info;
-- SELECT COUNT(*) as total_rooms FROM rooms;
-- SELECT COUNT(*) as total_categories FROM room_categories;
-- SELECT COUNT(*) as total_guests FROM guests;
-- SELECT COUNT(*) as total_services FROM hotel_services;

-- SELECT '✅ ВСЕ СИСТЕМЫ ГОТОВЫ К РАБОТЕ!' as status;