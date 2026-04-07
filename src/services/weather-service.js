export class WeatherService {
    async getCurrentWeather(city) {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        if (!response.ok) {
            throw new Error('weather_request_failed');
        }
        return response.json();
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
