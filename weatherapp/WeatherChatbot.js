// z:\public_html\weatherapp\WeatherChatbot.js

let chatbotInitialized = false;
let chatHistory = []; // To store conversation context (for future advanced use)
let conversationState = 'awaiting_location'; // Initial state: 'awaiting_location', 'awaiting_country', 'ready_for_query'
let lastCityAsked = ''; // To store the city when the bot is awaiting the country
let hasMapLoaded = false; // To track if the map has been initialized

// Helper function to append messages to the chat interface
function appendMessage(sender, message, mapUrl = null) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.innerHTML = `<strong>${sender === 'bot' ? 'Bot' : 'You'}:</strong> ${message}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom

    // If a map URL is provided, display the map
    if (mapUrl) {
        const mapDiv = document.createElement('div');
        mapDiv.innerHTML = `<img src="${mapUrl}" alt="Map of Location" style="max-width:100%; height:auto;">`;
        chatMessages.appendChild(mapDiv);
    }
}

// Helper function to parse city and country from a string
function parseLocationInput(input) {
    // Simple parsing: look for comma, assume City, Country
    const parts = input.split(',').map(s => s.trim());
    let city = '';
    let country = '';

    if (parts.length === 2) {
        city = parts[0];
        country = parts[1];
    } else if (parts.length === 1) {
        city = parts[0];
    }
    return { city, country };
}

// Initialize the chatbot
function initializeChatbot() {
    chatbotInitialized = true;
    if (document.getElementById('api-key-section')) { // Check if the element exists
      document.getElementById('api-key-section').style.display = 'none';
    }
    
    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    appendMessage('bot', 'Hello! I am your Weather Chat Assistant. What city and country would you like to know the weather for? (e.g., London, UK)');
    conversationState = 'awaiting_location';
}

// Send a message from the user to the chatbot
async function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    appendMessage('user', userMessage);
    chatInput.value = '';

    let fullLocation = '';

    switch (conversationState) {
        case 'awaiting_location':
            const { city, country } = parseLocationInput(userMessage);
            if (city && country) {
                fullLocation = `${city}, ${country}`;
                appendMessage('bot', `Okay, getting weather for ${fullLocation}...`);
                // Set the separate city and country input field values
                document.getElementById('city-input').value = city;
                document.getElementById('country-input').value = country;

                // Assuming these functions are globally available from other scripts
                try {
                    await getLocation(); // getLocation must complete first to get lat/lon
                    // Fetch forecast (which now includes current) and pollution in parallel.
                    await Promise.all([
                        getForecast(),
                        getPollution()
                    ]);
                    // Now call getWeather. It will be a fast, non-network operation
                    // that uses the data fetched by getForecast.
                    await getWeather();
                } catch (error) {
                    console.error("Error fetching weather data:", error);
                    appendMessage('bot', `Sorry, I couldn't get the weather for ${fullLocation}. Error: ${error.message}. Please check the location or try again later.`);
                    return; // Stop further processing if there's an error
                }

                // Generate and display a map for the location
                const mapUrl = generateMapUrl(omGeocode.getLat(), omGeocode.getLon());
                if (mapUrl) {
                    appendMessage('bot', `Here is the weather information for ${fullLocation}.`, mapUrl);
                } else {
                    appendMessage('bot', `Here is the weather information for ${fullLocation}.`);
                }

                appendMessage('bot', `Here is the weather information for ${fullLocation}. What else can I help you with?`);
                conversationState = 'ready_for_query';
            } else if (city) {
                lastCityAsked = city;
                appendMessage('bot', `You mentioned "${city}". What country is that in?`);
                conversationState = 'awaiting_country';
            } else {
                appendMessage('bot', 'I need a city and country to get weather information. Please tell me both, like "Paris, France".');
            }
            break;

        case 'awaiting_country':
            const countryInput = userMessage;
            if (lastCityAsked && countryInput) {
                fullLocation = `${lastCityAsked}, ${countryInput}`;
                appendMessage('bot', `Okay, getting weather for ${fullLocation}...`);
                document.getElementById('city-input').value = lastCityAsked;
                document.getElementById('country-input').value = countryInput;
                try {
                    await getLocation();
                    // Fetch forecast (which now includes current) and pollution in parallel.
                    await Promise.all([
                        getForecast(),
                        getPollution()
                    ]);
                    // Now call getWeather. It will be a fast, non-network operation
                    // that uses the data fetched by getForecast.
                    await getWeather();
                } catch (error) {
                    console.error("Error fetching weather data:", error);
                    appendMessage('bot', `Sorry, I couldn't get the weather for ${fullLocation}. Error: ${error.message}. Please check the location or try again later.`);
                    return;
                }

                // Generate and display a map for the location
                const mapUrl = generateMapUrl(omGeocode.getLat(), omGeocode.getLon());
                if (mapUrl) {
                    appendMessage('bot', `Here is the weather information for ${fullLocation}.`, mapUrl);
                } else {
                    appendMessage('bot', `Here is the weather information for ${fullLocation}.`);
                }

                conversationState = 'ready_for_query';

                lastCityAsked = ''; // Clear stored city
            } else {
                appendMessage('bot', 'Please provide the country for the city you mentioned.');
                conversationState = 'awaiting_location'; // Reset if context is lost
            }
            break;

        case 'ready_for_query':
            // This case can be expanded for more complex natural language processing using Gemini API
            if (userMessage.toLowerCase().includes('weather in') || userMessage.toLowerCase().includes('forecast for')) {
                const locationMatch = userMessage.match(/(weather in|forecast for)\s+(.+)/i);
                if (locationMatch && locationMatch[2]) {
                    const newLocation = locationMatch[2].trim();
                    const { city, country } = parseLocationInput(newLocation);
                    if (city && country) {
                        fullLocation = `${city}, ${country}`;
                        appendMessage('bot', `Okay, getting weather for ${fullLocation}...`);
                        document.getElementById('city-input').value = city;
                        document.getElementById('country-input').value = country;
                        try {
                            await getLocation();
                            // Fetch forecast (which now includes current) and pollution in parallel.
                            await Promise.all([
                                getForecast(),
                                getPollution()
                            ]);
                            // Now call getWeather. It will be a fast, non-network operation
                            // that uses the data fetched by getForecast.
                            await getWeather();
                        } catch (error) {
                            console.error("Error fetching weather data:", error);
                            appendMessage('bot', `Sorry, I couldn't get the weather for ${fullLocation}. Error: ${error.message}. Please check the location or try again later.`);
                            return;
                        }

                        appendMessage('bot', `Here is the weather information for ${fullLocation}. What else can I help you with?`);
                        // Generate and display a map for the location
                        const mapUrl = generateMapUrl(omGeocode.getLat(), omGeocode.getLon());
                        if (mapUrl) {
                            appendMessage('bot', `Here is the weather information for ${fullLocation}.`, mapUrl);
                        } else {
                            appendMessage('bot', `Here is the weather information for ${fullLocation}.`);
                        }
                        conversationState = 'ready_for_query';
                    } 
                    else if (city) {
                        lastCityAsked = city;

                        appendMessage('bot', `You mentioned "${city}". What country is that in?`);
                        conversationState = 'awaiting_country';
                    } else {
                        appendMessage('bot', 'Please specify a city and country for the weather query.');
                    }
                } else {
                    appendMessage('bot', 'I can help with weather. Please ask about a specific city and country.');
                }
            } else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
                appendMessage('bot', 'Hello there! How can I assist you with weather information today? You can ask something like: What is the weather in London, UK');
            } else {
                appendMessage('bot', 'I am a weather assistant. You can ask me about the weather or forecast for a city and country.');
            }
            break;

        default:
            appendMessage('bot', 'An unexpected error occurred. Please refresh the page.');
            conversationState = 'awaiting_location';
            break;
    }
}

// Event listener for Enter key in chat input
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Helper function to generate a static map URL (using Mapbox as an example)
function generateMapUrl(latitude, longitude) {
    if (!latitude || !longitude) return null;
    // Replace with your actual Mapbox Access Token
    const accessToken = 'pk.eyJ1IjoiaGVsZW5xaXUiLCJhIjoiY2x1b3U3ZjkyMDF3dzJqcnduN3l6b2Z2dCJ9.rRlJ8IEj38Gj34cTqIZcKA'; 
    const zoomLevel = 10;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${longitude},${latitude},${zoomLevel},0,0/600x300?access_token=${accessToken}`;
}


// Expose functions to global scope as they are called directly from HTML
window.initializeChatbot = initializeChatbot;
window.sendChatMessage = sendChatMessage;
window.handleChatKeyPress = handleChatKeyPress;