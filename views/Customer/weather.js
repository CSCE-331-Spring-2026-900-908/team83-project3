const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
        95: "Thunderstorm",
    };

const THEME_KEY = 'user-preferred-theme';

async function getWeather() {
    const lat = 30.6278;
    const lon = -96.3344;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Network didn't respond.");
        }
        const data = await response.json();
        const code = data.current.weather_code;
        const description = weatherDescriptions[code] || "Unknown Condition";
        console.log(description);
        const currentTemp = data.current.temperature_2m;
        document.getElementById('temp').innerText = `${currentTemp}°F`;
        document.getElementById('weather').innerText = `${description}`

         // Map weather codes to CSS classes
        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedTheme && savedTheme !== 'auto') {
            // Manual theme selection takes precedence
            applyTheme(savedTheme);
        } else {
            // Default theme based on weather code
            let weatherTheme = 'theme-sunny';
            if ([1, 2, 3].includes(code)) weatherTheme = 'theme-cloudy';
            if ([51, 53, 55, 61, 63, 65, 95].includes(code)) weatherTheme = 'theme-rainy';
            if([71, 73, 75].includes(code)) weatherTheme = 'theme-snowy';
            applyTheme(weatherTheme);
        } 
    } 
    catch (error) {
        console.error("Error fetching weather:", error);
        document.getElementById('temp').innerText = "Failed to load.";
        document.getElementById('weather').innerText = "Failed to load.";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getWeather();
});

// Function to actually swap the class
function applyTheme(themeName) {
    // Remove all possible theme classes
    document.body.classList.remove('theme-cloudy', 'theme-rainy', 'theme-high-contrast', 'theme-sunny', 'theme-snowy');
    
    // Add the selected one (if it's not default/sunny)
    if (themeName !== 'theme-standard' && themeName !== 'auto') {
        document.body.classList.add(themeName);
    }
}

function manualThemeSelect(choice) {
    localStorage.setItem(THEME_KEY, choice);
    applyTheme(choice);
    
    if (choice === 'auto') {
        getWeather(); 
    }
    
    // Close the modal after selection
    if (typeof closeThemeModal === 'function') {
        closeThemeModal();
    }
}
