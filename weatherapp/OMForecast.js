class OMForecast {
    constructor(units) {
        this.units = units;
        this.lat = 42.2626;  // Default Worcester, MA
        this.lon = -71.8019;
        this.cnt = 5; // Number of forecast periods
        this.json = null;
    }

    request() {
        return new Promise((resolve, reject) => {
            var xhttp = new XMLHttpRequest();
            let self = this;

            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        try {
                            let data = JSON.parse(this.responseText);
                            // Convert Open-Meteo format to OWM-like format for compatibility
                            self.json = self.convertToOWMFormat(data);
                            resolve();
                        } catch (error) {
                            console.error('Error parsing forecast response:', error);
                            reject(new Error('Error processing forecast data.'));
                        }
                    } else {
                        console.error(`Forecast API error: ${this.status} - ${this.statusText}`);
                        reject(new Error(`Failed to fetch forecast data. Error ${this.status}.`));
                    }
                }
            }
            
            let tempUnit = self.units === "imperial" ? "fahrenheit" : "celsius";
            let windSpeedUnit = self.units === "imperial" ? "mph" : "kmh";
            // Also fetch current weather to combine API calls
            const currentParams = "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m";
            
            let URL = `https://api.open-meteo.com/v1/forecast?latitude=${self.lat}&longitude=${self.lon}&current=${currentParams}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&temperature_unit=${tempUnit}&wind_speed_unit=${windSpeedUnit}&precipitation_unit=inch&timezone=auto&forecast_days=3`;
            
            xhttp.open("GET", URL, true);
            xhttp.send();
        });
    }

    testRequest(num) {
        return new Promise((resolve, reject) => {
            let self = this;
            fetch(`./testjson/forecast${num}.json`)
                .then(response => response.json())
                .then(data => {
                    self.json = data; // Keep OWM format for testing
                    resolve();
                })
                .catch(error => {
                    reject(new Error(`Error loading test forecast data: ${error.message}`));
                });
            });
    }

    convertToOWMFormat(omData) {
        // Weather code mapping (same as OMWeather)
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

        // --- Process current weather and store it in a format OMWeather can use ---
        let currentWeatherOWM = null;
        if (omData.current) {
            const current = omData.current;
            const weatherCode = current.weather_code || 0;
            const weather = weatherCodeMap[weatherCode] || weatherCodeMap[0];

            // Adjust icon for day/night
            if (current.is_day === 0 && weather.icon.includes("d")) {
                weather.icon = weather.icon.replace("d", "n");
            }

            currentWeatherOWM = {
                coord: { lat: this.lat, lon: this.lon },
                weather: [{ id: weatherCode, main: weather.main, description: weather.description, icon: weather.icon }],
                main: {
                    temp: current.temperature_2m,
                    feels_like: current.apparent_temperature,
                    temp_min: current.temperature_2m,
                    temp_max: current.temperature_2m,
                    pressure: current.pressure_msl || current.surface_pressure,
                    humidity: current.relative_humidity_2m
                },
                visibility: 10000,
                wind: { speed: current.wind_speed_10m, deg: current.wind_direction_10m, gust: current.wind_gusts_10m },
                clouds: { all: current.cloud_cover },
                dt: Math.floor(new Date(omData.current.time).getTime() / 1000),
                sys: { country: "Unknown", sunrise: 0, sunset: 0 },
                timezone: 0,
                name: "Current Location"
            };
        }


        const hourly = omData.hourly;
        const list = [];

        // Take every 3rd hour to get ~8 forecasts (similar to OWM 5-day forecast)
        for (let i = 0; i < Math.min(hourly.time.length, this.cnt * 8); i += 3) {
            const weatherCode = hourly.weather_code[i] || 0;
            const weather = weatherCodeMap[weatherCode] || weatherCodeMap[0];
            
            // Determine if it's day or night based on hour
            const hour = new Date(hourly.time[i]).getHours();
            const isDay = hour >= 6 && hour <= 18;
            let icon = weather.icon;
            if (!isDay && icon.includes("d")) {
                icon = icon.replace("d", "n");
            }

            list.push({
                dt: Math.floor(new Date(hourly.time[i]).getTime() / 1000),
                main: {
                    temp: hourly.temperature_2m[i],
                    feels_like: hourly.apparent_temperature[i],
                    temp_min: hourly.temperature_2m[i],
                    temp_max: hourly.temperature_2m[i],
                    pressure: hourly.pressure_msl[i],
                    humidity: hourly.relative_humidity_2m[i]
                },
                weather: [{
                    id: weatherCode,
                    main: weather.main,
                    description: weather.description,
                    icon: icon
                }],
                clouds: {
                    all: hourly.cloud_cover[i]
                },
                wind: {
                    speed: hourly.wind_speed_10m[i],
                    deg: hourly.wind_direction_10m[i],
                    gust: hourly.wind_gusts_10m[i]
                },
                pop: hourly.precipitation_probability[i] / 100 || 0, // Convert % to decimal
                rain: hourly.precipitation[i] ? { "3h": hourly.precipitation[i] } : undefined
            });
        }

        return {
            cod: "200",
            message: 0,
            cnt: list.length,
            list: list,
            city: {
                name: "Current Location",
                coord: {
                    lat: this.lat,
                    lon: this.lon
                },
                country: "Unknown" // This info is in geocode, not weather/forecast
            },
            _currentWeather: currentWeatherOWM // Attach for OMWeather to use
        };
    }

    convertTimecode(unix) {
        unix *= 1000; // CONVERT TO MILLISECONDS --> good for JavaScript
        let date = new Date(unix); // pass in ms
        let hours = date.getHours();
        let minutes = date.getMinutes();

        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }
}
