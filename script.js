const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Weather API key
const geminiApiKey = 'YOUR_GEMINI_API_KEY'; // Replace with your actual Gemini API key
const cityElement = document.getElementById('city');
const weatherEmoji = document.getElementById('weather-emoji');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const weatherDetails = document.getElementById('weather-details');
const errorElement = document.getElementById('error');
const loadingElement = document.getElementById('loading');
const chatbot = document.getElementById('chatbot');
const chatbotBody = document.getElementById('chatbot-body');
const chatInput = document.getElementById('chat-input');

const weatherEmojis = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Smoke': '🌫️',
    'Haze': '🌫️',
    'Fog': '🌫️'
};

let currentWeatherData = null;

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchWeather, showError);
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

async function fetchWeather(position) {
    const { latitude, longitude } = position.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

    try {
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch weather data');
        }

        const data = await response.json();
        currentWeatherData = data;
        displayWeather(data);
    } catch (error) {
        showError(`Error fetching weather data: ${error.message}`);
    } finally {
        loadingElement.classList.add('hidden');
    }
}

function displayWeather(data) {
    const { name, main, weather, wind } = data;
    const weatherCondition = weather[0].main;
    const emoji = weatherEmojis[weatherCondition] || '🌡️';

    cityElement.textContent = `${name}`;
    weatherEmoji.textContent = emoji;
    temperatureElement.textContent = `${Math.round(main.temp)}°C`;
    descriptionElement.textContent = weather[0].description;

    weatherDetails.innerHTML = `
        <div class="detail-item">
            <span>Humidity</span>
            <p>${main.humidity}%</p>
        </div>
        <div class="detail-item">
            <span>Wind</span>
            <p>${wind.speed} m/s</p>
        </div>
        <div class="detail-item">
            <span>Feels like</span>
            <p>${Math.round(main.feels_like)}°C</p>
        </div>
        <div class="detail-item">
            <span>Pressure</span>
            <p>${main.pressure} hPa</p>
        </div>
    `;
}

function showError(error) {
    let message;
    if (typeof error === 'string') {
        message = error;
    } else if (error.code) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied. Please allow location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable. Try enabling GPS.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out. Please try again.';
                break;
            default:
                message = 'An unknown error occurred.';
                break;
        }
    } else {
        message = error.message || 'An unknown error occurred.';
    }
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    loadingElement.classList.add('hidden');
    cityElement.textContent = 'Weather App';
    weatherEmoji.textContent = '⚠️';
    temperatureElement.textContent = '';
    descriptionElement.textContent = '';
    weatherDetails.innerHTML = '';
}

// Chatbot Functionality
function toggleChatbot() {
    chatbot.classList.toggle('open');
}

function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.textContent = 'AI is typing...';
    typingIndicator.id = 'typing-indicator';
    chatbotBody.appendChild(typingIndicator);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// ...existing code...
function formatAIResponse(responseText) {
    // Remove all asterisks used for bullet points or emphasis
    responseText = responseText.replace(/^\s*\*+\s?/gm, ''); // Remove leading * from lines
    responseText = responseText.replace(/\*+/g, ''); // Remove any remaining asterisks

    const responseDiv = document.createElement('div');
    responseDiv.className = 'ai-response';

    // Split the response into sentences (using periods followed by a space)
    const sentences = responseText.split('. ').filter(s => s.trim() !== '');

    // Check if the response contains a list (e.g., items separated by commas or newlines)
    const listItems = responseText.split(/,|\n/).filter(item => item.trim() !== '');
    const hasList = listItems.length > 1 && listItems.every(item => item.length < 50); // Arbitrary length check to detect list-like items

    if (hasList) {
        // Format as a list
        const ul = document.createElement('ul');
        listItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.trim();
            ul.appendChild(li);
        });
        responseDiv.appendChild(ul);
    } else {
        // Format as paragraphs with emphasis on key phrases
        sentences.forEach((sentence, index) => {
            const p = document.createElement('p');
            sentence = sentence.trim();

            // Add a period back if it's not the last sentence
            if (index < sentences.length - 1) {
                sentence += '.';
            }

            // Look for key phrases to emphasize (e.g., "temperature", "weather", "feels like")
            const keyPhrases = ['temperature', 'weather', 'feels like', 'humidity', 'wind'];
            let formattedSentence = sentence;
            keyPhrases.forEach(phrase => {
                const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
                formattedSentence = formattedSentence.replace(regex, `<strong>${phrase}</strong>`);
            });

            p.innerHTML = formattedSentence;
            responseDiv.appendChild(p);
        });
    }

    return responseDiv;
}


async function sendMessage() {
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = messageText;
    chatbotBody.appendChild(userMessage);

    // Clear input
    chatInput.value = '';

    // Scroll to bottom
    chatbotBody.scrollTop = chatbotBody.scrollHeight;

    // Show typing indicator
    showTypingIndicator();

    // Prepare temperature details
    const tempDetails = currentWeatherData
        ? `The current temperature is ${Math.round(currentWeatherData.main.temp)}°C, feels like ${Math.round(currentWeatherData.main.feels_like)}°C, with ${currentWeatherData.weather[0].description}.`
        : 'Weather data is not available.';

    // Call Gemini API
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Based on the current temperature ${tempDetails} answer -> ${messageText}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch response from Gemini API');
        }

        const data = await response.json();
        console.log(data);
        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn’t process that.';

        // Hide typing indicator
        hideTypingIndicator();

        // Add AI message with structured formatting
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai';
        aiMessage.appendChild(formatAIResponse(aiResponseText));
        chatbotBody.appendChild(aiMessage);

        // Scroll to bottom
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    } catch (error) {
        // Hide typing indicator
        hideTypingIndicator();

        // Fallback to dummy response on error
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message ai';
        aiMessage.appendChild(formatAIResponse(getDummyAIResponse(messageText)));
        chatbotBody.appendChild(aiMessage);

        // Scroll to bottom
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
}

function getDummyAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('weather')) {
        return 'I see you’re interested in the weather! The current conditions are already displayed above. Want to know more?';
    } else if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
        return 'Hello! I’m your Weather Assistant. How can I help you today?';
    } else if (lowerMessage.includes('temperature')) {
        return 'The temperature is shown above! Would you like to know the forecast for the next few days?';
    } else if (lowerMessage.includes('dress') || lowerMessage.includes('wear')) {
        return 'Based on the current temperature, here’s how to dress:\n- Wear light, breathable clothing.\n- Consider a hat or sunglasses for sun protection.\n- Stay hydrated!';
    } else {
        return 'I’m not sure how to answer that, but I can help with weather-related questions! What’s on your mind?';
    }
}

getLocation();