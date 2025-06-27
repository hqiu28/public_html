class OMGeocode {
    constructor() {
        this.city = "Worcester, MA";
        this.state = null;
        this.country = "US";
        this.limit = 1;
        this.json = null;
    }    request(callback) {
        // Parse the city input to extract city, state, and country
        let fullQuery = this.city.trim();
        let cityName = fullQuery;
        let desiredState = null;
        let desiredCountry = this.country;
        
        // Extract city, state, and country from input like "Worcester, MA" or "Worcester, MA, US"
        if (fullQuery.includes(',')) {
            let parts = fullQuery.split(',').map(part => part.trim());
            cityName = parts[0];
            if (parts.length >= 2) {
                desiredState = parts[1];
            }
            if (parts.length >= 3) {
                desiredCountry = parts[2];
            }
        }
        
        var xhttp = new XMLHttpRequest();
        let self = this;

        xhttp.onreadystatechange = function() {
            if (this.readyState != 4) return;
            
            if (this.status != 200) {
                console.error(`Geocoding API error: ${this.status} - ${this.statusText}`);
                console.error(`Response: ${this.responseText}`);
                alert(`Unable to find location "${self.city}". Error ${this.status}. Please try a different city name.`);
                return;
            }
            
            try {
                let response = JSON.parse(this.responseText);
                console.log('Geocoding response:', response);
                
                // Check if we got results
                if (!response.results || response.results.length === 0) {
                    alert(`Location "${self.city}" not found. Please try a different location.`);
                    return;
                }
                
                // Filter results based on state and country
                let filteredResults = response.results;
                
                // If we have a desired state, filter by it
                if (desiredState) {
                    filteredResults = filteredResults.filter(result => {
                        let resultState = result.admin1 || result.admin2 || "";
                        
                        // Create a mapping of common state abbreviations to full names
                        const stateMap = {
                            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
                            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
                            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
                            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
                            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
                            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
                            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
                            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
                            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
                            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
                        };
                        
                        // Get the full state name if the desired state is an abbreviation
                        let fullStateName = stateMap[desiredState.toUpperCase()] || desiredState;
                        
                        // Check for exact match with full state name
                        return resultState.toLowerCase() === fullStateName.toLowerCase() ||
                               resultState.toLowerCase() === desiredState.toLowerCase();
                    });
                }
                
                // If we have a desired country, filter by it
                if (desiredCountry) {
                    filteredResults = filteredResults.filter(result => {
                        let resultCountry = result.country_code || result.country || "";
                        return resultCountry.toLowerCase() === desiredCountry.toLowerCase() ||
                               resultCountry.toLowerCase().startsWith(desiredCountry.toLowerCase());
                    });
                }
                
                // If no filtered results, fall back to the first result
                if (filteredResults.length === 0) {
                    console.warn(`No exact match found for "${self.city}". Using first available result.`);
                    filteredResults = [response.results[0]];
                }
                
                // Create filtered response
                self.json = {
                    results: filteredResults
                };
                
                console.log(`Filtered to ${filteredResults.length} result(s):`, filteredResults);
                
                if (callback !== undefined) {
                    callback();
                }
            } catch (error) {
                console.error('Error parsing geocoding response:', error);
                alert('Error processing location data. Please try again.');
            }
        }
        
        // Search for all cities with this name (increase count to get more results)
        let searchQuery = encodeURIComponent(cityName);
        let searchCount = 100; // Get more results to filter through
        
        let URL = `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=${searchCount}&language=en&format=json`;
        
        console.log(`Geocoding request: ${URL}`);
        xhttp.open("GET", URL, true);
        xhttp.send();
    }

    testRequest(num, callback) {
        let self = this;
        fetch(`./testjson/geocode${num}.json`)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
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
                callback();
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
