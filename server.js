const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/weather', async (req, res) => {
    const city = String(req.query.city || '').trim();

    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }

    try {
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geocodeResponse = await fetch(geocodeUrl);

        if (!geocodeResponse.ok) {
            return res.status(502).json({ error: 'Geocoding request failed' });
        }

        const geocodeJson = await geocodeResponse.json();
        if (!geocodeJson.results || geocodeJson.results.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }

        const location = geocodeJson.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            return res.status(502).json({ error: 'Weather request failed' });
        }

        const weatherJson = await weatherResponse.json();

        return res.json({
            city: location.name,
            country: location.country || '',
            temperature: weatherJson.current?.temperature_2m,
            windSpeed: weatherJson.current?.wind_speed_10m,
            weatherCode: weatherJson.current?.weather_code
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://127.0.0.1:${PORT}`);
});
