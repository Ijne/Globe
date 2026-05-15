export class WeatherService {
    async getCurrentWeather(city) {
        const trimmed = String(city || '').trim();
        if (!trimmed) {
            throw new Error('weather_city_required');
        }

        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(trimmed)}`);
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            // Fallback for static hosting (GitHub Pages).
        }

        return this.fetchDirect(trimmed);
    }

    async fetchDirect(city) {
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geocodeResponse = await fetch(geocodeUrl);

        if (!geocodeResponse.ok) {
            throw new Error('geocoding_request_failed');
        }

        const geocodeJson = await geocodeResponse.json();
        if (!geocodeJson.results || geocodeJson.results.length === 0) {
            throw new Error('city_not_found');
        }

        const location = geocodeJson.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error('weather_request_failed');
        }

        const weatherJson = await weatherResponse.json();
        const current = weatherJson.current || {};

        return {
            city: location.name,
            country: location.country || '',
            temperature: current.temperature_2m,
            windSpeed: current.wind_speed_10m,
            weatherCode: current.weather_code
        };
    }

    getDescription(code) {
        const descriptions = {
            0: 'Ясно',
            1: 'Преимущественно ясно',
            2: 'Переменная облачность',
            3: 'Пасмурно',
            45: 'Туман',
            48: 'Туман',
            51: 'Небольшой дождь',
            53: 'Умеренный дождь',
            55: 'Сильный дождь',
            80: 'Ливневый дождь',
            81: 'Сильный ливень',
            99: 'Гроза'
        };

        return descriptions[code] || 'Погода';
    }
}
