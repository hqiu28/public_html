class OMWeather {
    constructor(units) {
        this.units = units; // "imperial" or "metric"
        this.lat = 42.2626;  // Default Worcester, MA
        this.lon = -71.8019;
        this.json = null;
    }

    request() {
        return new Promise((resolve, reject) => {
            // Check if forecast data already contains current weather to avoid a redundant API call
            if (omForecast && omForecast.json && omForecast.json._currentWeather) {
                this.json = omForecast.json._currentWeather;
                console.log("Using cached current weather from forecast call.");
                resolve();
                return;
            }

            var xhttp = new XMLHttpRequest();
            let self = this;

            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        try {
                            let data = JSON.parse(this.responseText);
                            // Convert Open-Meteo format to OWM-like format for compatibility
                            self.json = self.convertToOWMFormat(data);
                            resolve(); // Resolve the promise on success
                        } catch (error) {
                            console.error('Error parsing weather response:', error);
                            reject(new Error('Error processing weather data.'));
                        }
                    } else {
                        console.error(`Weather API error: ${this.status} - ${this.statusText}`);
                        reject(new Error(`Failed to fetch weather data. Error ${this.status}.`));
                    }
                }
            }
            
            let tempUnit = self.units === "imperial" ? "fahrenheit" : "celsius";
            let windSpeedUnit = self.units === "imperial" ? "mph" : "kmh";
            
            let URL = `https://api.open-meteo.com/v1/forecast?latitude=${self.lat}&longitude=${self.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windSpeedUnit}&precipitation_unit=inch&timezone=auto`;
            
            xhttp.open("GET", URL, true);
            xhttp.send();
        });
    }

    testRequest(num) {
        return new Promise((resolve, reject) => {
            let self = this;
            fetch(`./testjson/weather${num}.json`)
                .then(response => response.json())
                .then(data => {
                    self.json = data; // Keep OWM format for testing
                    resolve();
                })
                .catch(error => {
                    reject(new Error(`Error loading test weather data: ${error.message}`));
                });
            });
    }

    convertToOWMFormat(omData) {
        // Weather code mapping (Open-Meteo to OWM-like)
        const weatherCodeMap = {
            0: { main: "Clear", description: "clear sky", icon: "01d" },
            1: { main: "Clear", description: "mainly clear", icon: "01d" },
            2: { main: "Clouds", description: "partly cloudy", icon: "02d" },
            3: { main: "Clouds", description: "overcast", icon: "03d" },
            45: { main: "Mist", description: "fog", icon: "50d" },
            48: { main: "Mist", description: "depositing rime fog", icon: "50d" },
            51: { main: "Drizzle", description: "light drizzle", icon: "09d" },
            53: { main: "Drizzle", description: "moderate drizzle", icon: "09d" },
            55: { main: "Drizzle", description: "dense drizzle", icon: "09d" },
            61: { main: "Rain", description: "slight rain", icon: "10d" },
            63: { main: "Rain", description: "moderate rain", icon: "10d" },
            65: { main: "Rain", description: "heavy rain", icon: "10d" },
            80: { main: "Rain", description: "slight rain showers", icon: "09d" },
            81: { main: "Rain", description: "moderate rain showers", icon: "09d" },
            82: { main: "Rain", description: "violent rain showers", icon: "09d" },
            95: { main: "Thunderstorm", description: "thunderstorm", icon: "11d" }
        };

        const current = omData.current;
        const weatherCode = current.weather_code || 0;
        const weather = weatherCodeMap[weatherCode] || weatherCodeMap[0];

        // Adjust icon for day/night
        if (current.is_day === 0 && weather.icon.includes("d")) {
            weather.icon = weather.icon.replace("d", "n");
        }

        return {
            coord: {
                lat: this.lat,
                lon: this.lon
            },
            weather: [{
                id: weatherCode,
                main: weather.main,
                description: weather.description,
                icon: weather.icon
            }],
            main: {
                temp: current.temperature_2m,
                feels_like: current.apparent_temperature,
                temp_min: current.temperature_2m, // Open-Meteo doesn't provide min/max for current
                temp_max: current.temperature_2m,
                pressure: current.pressure_msl || current.surface_pressure,
                humidity: current.relative_humidity_2m
            },
            visibility: 10000, // Default value
            wind: {
                speed: current.wind_speed_10m,
                deg: current.wind_direction_10m,
                gust: current.wind_gusts_10m
            },
            clouds: {
                all: current.cloud_cover
            },
            dt: Math.floor(Date.now() / 1000), // Current timestamp
            sys: {
                country: "Unknown", // Open-Meteo doesn't provide this in weather data
                sunrise: 0, // Would need separate API call
                sunset: 0
            },
            timezone: 0,
            name: "Current Location"
        };
    }
    getTemperature() {
        if (this.json && this.json.main) {
            return this.json.main.temp;
        }
        return null;
    }
}
