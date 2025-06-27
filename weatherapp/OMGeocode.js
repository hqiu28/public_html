class OMGeocode {
    constructor() {
        this.city = "Worcester, MA";
        this.countryInput = null; // New property for user-provided country
        this.country = "US";
        this.limit = 10; // Increased to get more results for better matching
        this.json = null;
    }
    request() {
        return new Promise((resolve, reject) => {
            var xhttp = new XMLHttpRequest();
            let self = this;

            xhttp.onreadystatechange = function() {
                if (this.readyState === 4) { // Request is complete
                    if (this.status === 200) {
                        try {
                            let response = JSON.parse(this.responseText);
                            console.log('Geocoding response:', response);
                            
                            // Check if we got results
                            if (!response.results || response.results.length === 0) {
                                reject(new Error(`Location "${self.city}" not found. Please try a different location.`));
                                return;
                            }

                            // --- NEW LOGIC: Select best matching result based on country ---
                            let requestedCountryPart = self.countryInput ? self.countryInput.trim().toUpperCase() : null;

                            let bestMatch = null;
                            if (requestedCountryPart) {
                                // Try to find a result that matches the requested country (case-insensitive)
                                bestMatch = response.results.find(result =>
                                    result.country.toUpperCase() === requestedCountryPart || (result.country_code && result.country_code.toUpperCase() === requestedCountryPart));
                            }
                            // If no country was requested, or no specific match found, default to the first result
                            if (!bestMatch && response.results.length > 0) {
                                bestMatch = response.results[0];
                            }

                            if (!bestMatch) {
                                reject(new Error(`Location "${self.city}" not found or no matching country. Please try a different location.`));
                                return;
                            }
                            // Store only the selected best match
                            self.json = { results: [bestMatch] };
                            resolve(); // Resolve the promise on success
                        } catch (error) {
                            console.error('Error parsing geocoding response:', error);
                            reject(new Error('Error processing location data. Please try again.'));
                        }
                    } else {
                        console.error(`Geocoding API error: ${this.status} - ${this.statusText}`);
                        console.error(`Response: ${this.responseText}`);
                        reject(new Error(`Unable to find location "${self.city}". Error ${this.status}.`));
                    }
                }
            }
            
            // Clean up the city name for Open-Meteo API
            // Combine city and country for the search query to improve initial API results
            let searchQuery = encodeURIComponent(self.city.trim() + (self.countryInput ? ', ' + self.countryInput.trim() : ''));
            
            let URL = `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=${self.limit}&language=en&format=json`;
            
            console.log(`Geocoding request: ${URL}`);
            xhttp.open("GET", URL, true);
            xhttp.send();
        });
    }

    testRequest(num) {
        return new Promise((resolve, reject) => {
            let self = this;
            fetch(`./testjson/geocode${num}.json`)
                .then(response => response.json())
                .then(data => {
                    // Convert OWM format to Open-Meteo format for testing
                    self.json = {
                        results: [{
                            name: data[0].name,
                            latitude: data[0].lat,
                            longitude: data[0].lon,
                            country: data[0].country,
                            admin1: data[0].state || ""
                        }]
                    };
                    resolve();
                })
                .catch(error => {
                    reject(new Error(`Error loading test geocode data: ${error.message}`));
                });
            });
    }

    getLat() {
        if (this.json && this.json.results && this.json.results.length > 0) {
            return this.json.results[0].latitude;
        }
        return null;
    }

    getLon() {
        if (this.json && this.json.results && this.json.results.length > 0) {
            return this.json.results[0].longitude;
        }
        return null;
    }

    getName() {
        if (this.json && this.json.results && this.json.results.length > 0) {
            return this.json.results[0].name;
        }
        return null;
    }

    getCountry() {
        if (this.json && this.json.results && this.json.results.length > 0) {
            return this.json.results[0].country;
        }
        return null;
    }

    getState() {
        if (this.json && this.json.results && this.json.results.length > 0) {
            return this.json.results[0].admin1 || null;
        }
        return null;
    }
}
