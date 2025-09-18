// API Configuration
const API_KEY = '3237fa9c61adbe62116da927a67e5427';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const searchInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherContainer = document.getElementById('weather-container');
const loadingElement = document.getElementById('loading');

// Initialize the app
function init() {
    // Initialize with no default cities
    showWelcomeMessage();
    
    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    locationBtn.addEventListener('click', getCurrentLocationWeather);
}

// Show welcome message
function showWelcomeMessage() {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'welcome-message';
    welcomeMsg.innerHTML = `
        <h3>Welcome to Weather Dashboard</h3>
        <p>Search for a city or use your current location to see the weather</p>
    `;
    weatherContainer.appendChild(welcomeMsg);
}

// Handle search functionality
async function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) return;
    
    showLoading(true);
    try {
        await getWeatherData(city);
        searchInput.value = ''; // Clear input after search
    } catch (error) {
        showError('City not found. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Get weather data for a city
async function getWeatherData(city) {
    try {
        // Fetch weather data
        const response = await fetch(
            `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        displayWeatherData(data);
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

// Get weather by current location
function getCurrentLocationWeather() {
    showLoading(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `${API_BASE_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                    );
                    
                    if (!response.ok) {
                        throw new Error('Location data not available');
                    }
                    
                    const data = await response.json();
                    displayWeatherData(data);
                } catch (error) {
                    showError('Unable to get weather for your location');
                } finally {
                    showLoading(false);
                }
            },
            (error) => {
                showError('Geolocation is not supported or permission denied');
                showLoading(false);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
        showLoading(false);
    }
}

// Display weather data in the UI
function displayWeatherData(data) {
    // Check if city already exists in the dashboard
    const existingCard = document.querySelector(`[data-city="${data.city.name}"]`);
    if (existingCard) {
        existingCard.remove();
    }

    // Process forecast data (group by day)
    const forecastByDay = groupForecastByDay(data.list);
    
    // Create weather card
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.setAttribute('data-city', data.city.name);
    
    // Get current weather (first item in the list)
    const current = data.list[0];
    const currentDate = new Date(current.dt * 1000);
    
    // Format the weather card HTML
    card.innerHTML = `
        <div class="current-weather">
            <div class="weather-info">
                <h2>${data.city.name}, ${data.city.country}</h2>
                <p>${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>${current.weather[0].description}</p>
                <p>Humidity: ${current.main.humidity}% • Wind: ${(current.wind.speed * 3.6).toFixed(1)} km/h</p>
            </div>
            <div class="weather-temp">
                ${Math.round(current.main.temp)}°C
                <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" alt="${current.weather[0].description}" class="weather-icon">
            </div>
        </div>
        <div class="forecast">
            <h3>3-Day Forecast</h3>
            <div class="forecast-days">
                ${Object.entries(forecastByDay)
                    .slice(0, 3)
                    .map(([day, forecast]) => {
                        const date = new Date(forecast[0].dt * 1000);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const temp = Math.round(forecast[0].main.temp);
                        const icon = forecast[0].weather[0].icon;
                        
                        return `
                            <div class="forecast-day">
                                <div>${dayName}</div>
                                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${forecast[0].weather[0].description}">
                                <div class="temp">${temp}°C</div>
                            </div>
                        `;
                    })
                    .join('')}
            </div>
        </div>
        <button class="remove-btn" onclick="this.closest('.weather-card').remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add the card to the container (at the beginning)
    weatherContainer.insertBefore(card, weatherContainer.firstChild);
}

// Group forecast data by day
function groupForecastByDay(forecastList) {
    return forecastList.reduce((acc, forecast) => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(forecast);
        return acc;
    }, {});
}

// Show loading state
function showLoading(isLoading) {
    loadingElement.style.display = isLoading ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.textContent = message;
    weatherContainer.appendChild(errorElement);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
