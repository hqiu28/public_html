class OMPollution {
    constructor() {
        this.lat = 42.2626;  // Default Worcester, MA
        this.lon = -71.8019;
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
                            console.error('Error parsing pollution response:', error);
                            reject(new Error('Error processing pollution data.'));
                        }
                    } else {
                        console.error(`Pollution API error: ${this.status} - ${this.statusText}`);
                        reject(new Error(`Failed to fetch pollution data. Error ${this.status}.`));
                    }
                }
            }
            
            let URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${self.lat}&longitude=${self.lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
            
            xhttp.open("GET", URL, true);
            xhttp.send();
        });
    }

    testRequest(num) {
        return new Promise((resolve, reject) => {
            let self = this;
            fetch(`./testjson/pollution${num}.json`)
                .then(response => response.json())
                .then(data => {
                    self.json = data; // Keep OWM format for testing
                    resolve();
                })
                .catch(error => {
                    reject(new Error(`Error loading test pollution data: ${error.message}`));
                });
            });
    }

    convertToOWMFormat(omData) {
        const current = omData.current;
        
        // Convert US AQI to OpenWeatherMap AQI scale (1-5)
        let aqi = 1; // Default to Good
        if (current.us_aqi) {
            if (current.us_aqi <= 50) aqi = 1;        // Good
            else if (current.us_aqi <= 100) aqi = 2;  // Fair
            else if (current.us_aqi <= 150) aqi = 3;  // Moderate
            else if (current.us_aqi <= 200) aqi = 4;  // Poor
            else aqi = 5;                             // Very Poor
        }

        return {
            coord: {
                lat: this.lat,
                lon: this.lon
            },
            list: [{
                dt: Math.floor(Date.now() / 1000),
                main: {
                    aqi: aqi
                },
                components: {
                    co: current.carbon_monoxide || 0,
                    no2: current.nitrogen_dioxide || 0,
                    o3: current.ozone || 0,
                    so2: current.sulphur_dioxide || 0,
                    pm2_5: current.pm2_5 || 0,
                    pm10: current.pm10 || 0,
                    nh3: 0 // Open-Meteo doesn't provide NH3
                }
            }]
        };
    }

    // See https://openweathermap.org/api/air-pollution
    getAQI() {
        if (this.json === null) {
            throw(`Error: No ${this.constructor.name} request has been made`)
        }
        return this.json.list[0].main.aqi;
    }

    // See https://openweathermap.org/api/air-pollution
    getComponents() {
        if (this.json === null) {
            throw(`Error: No ${this.constructor.name} request has been made`)
        }
        return this.json.list[0].components;
    }
}
