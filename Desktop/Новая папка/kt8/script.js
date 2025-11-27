const citySelect = document.getElementById('city');
const updateBtn = document.getElementById('updateBtn');
const lastUpdateSpan = document.querySelector('.last-update');
const errorDiv = document.getElementById('error');
const loader = document.getElementById('loader');
const weatherCard = document.getElementById('weatherCard');

const tempElement = document.getElementById('temp');
const windSpeedElement = document.getElementById('windSpeed');
const humidityElement = document.getElementById('humidity');
const cloudCoverElement = document.getElementById('cloudCover');
const feelsLikeElement = document.getElementById('feelsLike');

let autoUpdateInterval = null;

async function fetchWeather() {
    try {
        showLoader();
        hideError();

        const coords = citySelect.value.split(',');
        const latitude = coords[0];
        const longitude = coords[1];

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,cloud_cover,wind_speed_10m&timezone=auto`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        displayWeather(data);
        updateLastUpdateTime();

    } catch (error) {
        showError(`Не удалось загрузить данные: ${error.message}`);
        console.error('Ошибка при получении погоды:', error);
    } finally {
        hideLoader();
    }
}

function displayWeather(data) {
    const current = data.current;

    tempElement.textContent = Math.round(current.temperature_2m);
    windSpeedElement.textContent = `${current.wind_speed_10m} км/ч`;
    humidityElement.textContent = `${current.relative_humidity_2m} %`;
    cloudCoverElement.textContent = `${current.cloud_cover} %`;
    feelsLikeElement.textContent = `${Math.round(current.apparent_temperature)} °C`;

    weatherCard.classList.remove('hidden');
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU');
    lastUpdateSpan.textContent = `Последнее обновление: ${timeString}`;
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    weatherCard.classList.add('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function startAutoUpdate() {
    stopAutoUpdate();
    autoUpdateInterval = setInterval(() => {
        console.log('Автоматическое обновление данных...');
        fetchWeather();
    }, 15000);
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
}

updateBtn.addEventListener('click', () => {
    fetchWeather();
});

citySelect.addEventListener('change', () => {
    fetchWeather();
    startAutoUpdate();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    startAutoUpdate();
});

window.addEventListener('beforeunload', () => {
    stopAutoUpdate();
});