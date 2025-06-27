// --- Location Functions ---
async function getLocation() {
    omGeocode.city = document.getElementById('city-input').value;
    omGeocode.countryInput = document.getElementById('country-input').value; // Set the new country input
    try {
        await omGeocode.request();
        displayLocation();
    } catch (error) {
        console.error("Error in getLocation:", error);
        alert(error.message); // Display the error message from the Promise rejection
    }
}

async function testLocation() {
    let testNum = document.getElementById('testnum').value;
    try {
        await omGeocode.testRequest(testNum); // Assuming testRequest also returns a Promise now
        displayLocation();
    } catch (error) {
        console.error("Error in testLocation:", error);
        alert(error.message);
    }
}

// --- Weather Functions ---
async function getWeather() {
    omWeather.latitude = omGeocode.getLat();
    omWeather.longitude = omGeocode.getLon();
    try {
        await omWeather.request();
        displayWeather();
    } catch (error) {
        console.error("Error in getWeather:", error);
        alert(error.message);
    }
}

async function testWeather() {
    let testNum = document.getElementById('testnum').value;
    try {
        await omWeather.testRequest(testNum);
        displayWeather();
    } catch (error) {
        console.error("Error in testWeather:", error);
        alert(error.message);
    }
}

// --- Pollution Functions ---
async function getPollution() {
    omPollution.latitude = omGeocode.getLat();
    omPollution.longitude = omGeocode.getLon();
    try {
        await omPollution.request();
        displayPollution();
    } catch (error) {
        console.error("Error in getPollution:", error);
        alert(error.message);
    }
}

async function testPollution() {
    let testNum = document.getElementById('testnum').value;
    try {
        await omPollution.testRequest(testNum);
        displayPollution();
    } catch (error) {
        console.error("Error in testPollution:", error);
        alert(error.message);
    }
}

// --- Display Functions (assuming these are in display.js or globally available) ---
// These functions would typically update the HTML elements with the fetched data.
// For example:
function displayLocation() {
    document.getElementById('location').innerText = `${omGeocode.getName()}, ${omGeocode.getCountry()}`;
}

function displayWeather() {
    document.getElementById('weather-report').innerText = `Temperature: ${omWeather.getTemperature()}°C, Wind Speed: ${omWeather.getWindSpeed()} km/h`;
}

function displayForecast() {
    const table = document.getElementById('forecast-table');
    table.innerHTML = '<tr><th>Time</th><th>Temperature</th><th>Weather</th></tr>';
    const times = omForecast.getTimes();
    const temperatures = omForecast.getTemperatures();
    const weatherCodes = omForecast.getWeatherCodes();

    for (let i = 0; i < times.length; i++) {
        const row = table.insertRow();
        row.insertCell().innerText = new Date(times[i]).toLocaleString();
        row.insertCell().innerText = `${temperatures[i]}°C`;
        row.insertCell().innerText = weatherCodes[i]; // You might want to map this to a human-readable string
    }
}

function displayPollution() {
    document.getElementById('pollution-report').innerText = `PM2.5: ${omPollution.getPM25()} µg/m³, Ozone: ${omPollution.getOzone()} µg/m³`;
}

// Update testForecast to match the new Promise-based testRequest
async function testForecast() {
    let testNum = document.getElementById('testnum').value;
    try {
        await omForecast.testRequest(testNum);
        displayForecast();
    } catch (error) {
        console.error("Error in testForecast:", error);
        alert(error.message);
    }
}

// --- Forecast Functions ---
async function getForecast() {
    omForecast.latitude = omGeocode.getLat();
    omForecast.longitude = omGeocode.getLon();
    try {
        await omForecast.request();
        displayForecast();
    } catch (error) {
        console.error("Error in getForecast:", error);
        alert(error.message);
    }
}
