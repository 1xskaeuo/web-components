const modal = document.getElementById('modal');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const modalMessage = document.getElementById('modalMessage');

// Открытие — генерируем событие с параметром detail.message
openBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('modal-open', {
        detail: {
            message: 'Новое сообщение для модального окна! Модалка была открыта через кастомное событие.'
        }
    }));
});

// Закрытие — генерируем событие
closeBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('modal-close'));
});

// Закрытие модалки при клике вне области контента
modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        document.dispatchEvent(new CustomEvent('modal-close'));
    }
});

// Подписываемся на кастомные события
document.addEventListener('modal-open', (event) => {
    modal.classList.add('visible');

    // Обновляем сообщение, если оно передано в событии
    if (event.detail && event.detail.message) {
        modalMessage.textContent = event.detail.message;
    }
});

document.addEventListener('modal-close', () => {
    modal.classList.remove('visible');
});

// Обработчик для вывода в консоль при каждом открытии модалки
document.addEventListener('modal-open', () => {
    console.log('Модалка открыта!');
});