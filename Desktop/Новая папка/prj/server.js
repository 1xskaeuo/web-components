const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// База данных
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'vila_eysk_premium',
    password: 'postgres',
    port: 5432,
});

pool.on('connect', () => console.log('✅ БД подключена'));
pool.on('error', (err) => console.error('❌ Ошибка БД:', err));

// ============================================
// HTML СТРАНИЦЫ (ОБА ВАРИАНТА!)
// ============================================

const pages = {
    '/': 'index.html',
    '/account': 'html/account.html',
    '/account.html': 'html/account.html',      // ✅ ДОБАВЛЕНО
    '/login': 'html/login.html',
    '/login.html': 'html/login.html',          // ✅ ДОБАВЛЕНО
    '/register': 'html/register.html',
    '/register.html': 'html/register.html'     // ✅ ДОБАВЛЕНО
};

Object.entries(pages).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        const filePath = path.join(__dirname, file);
        console.log(`📄 ${route} → ${filePath}`);
        res.sendFile(filePath);
    });
});

// ============================================
// API
// ============================================

// Проверка здоровья
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ success: true, message: 'Сервер работает' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Получить все номера
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.room_number, rc.name as category_name, 
                   rc.base_price as price_per_night, rc.max_capacity as capacity,
                   rc.description, r.view_type, r.balcony, r.size_sqm, r.status
            FROM rooms r
            JOIN room_categories rc ON r.category_id = rc.id
            WHERE r.status = 'available'
            ORDER BY rc.base_price
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('❌ Ошибка:', err);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Получить номер по ID
app.get('/api/rooms/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, rc.name as category_name, rc.base_price as price_per_night,
                   rc.max_capacity as capacity, rc.description, rc.amenities
            FROM rooms r
            JOIN room_categories rc ON r.category_id = rc.id
            WHERE r.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Номер не найден' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Создать бронирование
app.post('/api/bookings', async (req, res) => {
    const { roomId, userId, guestName, guestEmail, guestPhone, 
            checkIn, checkOut, guestsCount, specialRequests } = req.body;

    if (!roomId || !checkIn || !checkOut || !guestName || !guestEmail || !guestPhone) {
        return res.status(400).json({ success: false, message: 'Заполните все поля' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Проверка доступности
        const room = await client.query(
            'SELECT * FROM rooms WHERE id = $1 AND status = $2',
            [roomId, 'available']
        );

        if (room.rows.length === 0) {
            throw new Error('Номер недоступен');
        }

        // Проверка пересечения дат
        const conflict = await client.query(`
            SELECT * FROM bookings 
            WHERE room_id = $1 AND status NOT IN ('cancelled', 'completed')
            AND ((check_in <= $2 AND check_out >= $2) OR
                 (check_in <= $3 AND check_out >= $3) OR
                 (check_in >= $2 AND check_out <= $3))
        `, [roomId, checkIn, checkOut]);

        if (conflict.rows.length > 0) {
            throw new Error('Номер уже забронирован на эти даты');
        }

        // Расчет цены
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const priceResult = await client.query(
            'SELECT base_price FROM room_categories WHERE id = $1',
            [room.rows[0].category_id]
        );
        const totalPrice = priceResult.rows[0].base_price * nights;

        // Создание бронирования
        const booking = await client.query(`
            INSERT INTO bookings (room_id, user_id, guest_name, guest_email, guest_phone,
                                  check_in, check_out, guests_count, total_price, nights,
                                  special_requests, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed', NOW())
            RETURNING *
        `, [roomId, userId || null, guestName, guestEmail, guestPhone, 
            checkIn, checkOut, guestsCount, totalPrice, nights, specialRequests || null]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Бронирование создано!',
            booking: booking.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка бронирования:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

// Получить бронирования пользователя
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.*, r.room_number, rc.name as room_category, rc.base_price
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN room_categories rc ON r.category_id = rc.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
        `, [req.params.userId]);
        
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// Отменить бронирование
app.patch('/api/bookings/:id/cancel', async (req, res) => {
    try {
        const result = await pool.query(`
            UPDATE bookings 
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1 AND status = 'confirmed'
            RETURNING *
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Бронирование не найдено' });
        }
        
        res.json({ success: true, message: 'Бронирование отменено' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// ============================================
// ЗАПУСК
// ============================================

app.listen(port, () => {
    console.log('\n🚀 Vila Eysk сервер запущен!');
    console.log(`📍 http://localhost:${port}`);
    console.log(`📁 ${__dirname}`);
    console.log('\n✅ Работают оба варианта URL:');
    console.log('   /account  и  /account.html');
    console.log('   /login    и  /login.html');
    console.log('   /register и  /register.html\n');
});

process.on('SIGINT', async () => {
    console.log('\n👋 Завершение работы...');
    await pool.end();
    process.exit(0);
});