// ==== Gemini API Key ====
const GEMINI_API_KEY = "AIzaSyA4HxhEg1sciJYdUJNUK0yfmtv0Sogfm-8";

// User authentication state management
let currentUser = null;

// Check if user is logged in on page load
function checkAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');

    if (isLoggedIn && userName) {
        currentUser = userName;
        showLoggedInState();
    } else {
        showLoggedOutState();
    }
}

// Show logged in state
function showLoggedInState() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (authButtons && userInfo && userName) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = currentUser;
    }
}

// Show logged out state
function showLoggedOutState() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');

    if (authButtons && userInfo) {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    currentUser = null;
    showLoggedOutState();
    window.location.href = '/index.html';
}

// Dark mode functions
function setDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.textContent = '🌙';
    }
}

// Diet chart form handling
document.addEventListener('DOMContentLoaded', function() {
    const dietForm = document.getElementById('dietForm');
    const dietResult = document.getElementById('dietResult');
    const dietContent = document.getElementById('dietContent');
    const logoutBtn = document.getElementById('logoutBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Initialize auth state
    checkAuthState();

    // Logout button event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            setDarkMode(!isDark);
        });
    }

    // Load dark mode preference
    const darkPref = localStorage.getItem('darkMode');
    setDarkMode(darkPref === 'true');

    // Form submission
    dietForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(dietForm);
        const userData = {
            name: formData.get('name'),
            age: formData.get('age'),
            height: formData.get('height'),
            weight: formData.get('weight'),
            calories: formData.get('calories'),
            goal: formData.get('goal'),
            exercises: formData.get('exercises')
        };

        // Show loading state
        dietResult.style.display = 'block';
        dietContent.innerHTML = '<div class="loading">Generating your personalized diet chart...</div>';

        // Calculate BMI
        const heightInMeters = userData.height / 100;
        const bmi = (userData.weight / (heightInMeters * heightInMeters)).toFixed(1);

        // Prepare prompt for Gemini API
        const prompt = `Create a personalized diet chart for a person with the following details:

Name: ${userData.name}
Age: ${userData.age} years
Height: ${userData.height} cm
Weight: ${userData.weight} kg
BMI: ${bmi}
Daily Calories Intake: ${userData.calories} calories
Fitness Goal: ${userData.goal}
Daily Exercises: ${userData.exercises}

Please provide a comprehensive diet chart with the following structure:

1. **Daily Diet Schedule (Table Format)**
   - Time
   - Meal Name
   - Food Items
   - Calories
   - Protein (g)
   - Carbs (g)
   - Fats (g)

2. **Weekly Meal Plan** (7 days with different variations)

3. **What to Include:**
   - List of recommended foods
   - Portion sizes
   - Timing recommendations

4. **What to Avoid:**
   - Foods to limit or avoid
   - Bad habits to break

5. **Additional Tips:**
   - Hydration recommendations
   - Pre/post workout nutrition
   - Supplements if needed

Format the response with clear tables, bullet points, and organized sections. Make it practical and easy to follow.`;

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (
                data &&
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts[0].text
            ) {
                const dietPlan = data.candidates[0].content.parts[0].text;
                
                // Format the response for better display
                const formattedPlan = formatDietPlan(dietPlan);
                dietContent.innerHTML = formattedPlan;
            } else {
                dietContent.innerHTML = '<div class="error">Sorry, I couldn\'t generate a diet chart. Please try again.</div>';
            }
        } catch (error) {
            console.error('Error:', error);
            dietContent.innerHTML = '<div class="error">Error connecting to the service. Please check your internet connection and try again.</div>';
        }
    });
});

// Function to format the diet plan response
function formatDietPlan(plan) {
    // Convert markdown-style formatting to HTML
    let formatted = plan
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Add paragraph tags
    formatted = '<p>' + formatted + '</p>';

    // Convert lists
    formatted = formatted.replace(/^\s*[-*]\s*(.*)/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert numbered lists
    formatted = formatted.replace(/^\s*(\d+)\.\s*(.*)/gm, '<li>$2</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    // Add some styling classes
    formatted = formatted.replace(/<h(\d)>(.*?)<\/h\1>/g, '<h$1 style="color: #1e3c72; margin: 20px 0 10px 0;">$2</h$1>');
    formatted = formatted.replace(/<p>/g, '<p style="margin: 10px 0; line-height: 1.6;">');
    formatted = formatted.replace(/<ul>/g, '<ul style="margin: 15px 0; padding-left: 20px;">');
    formatted = formatted.replace(/<ol>/g, '<ol style="margin: 15px 0; padding-left: 20px;">');
    formatted = formatted.replace(/<li>/g, '<li style="margin: 5px 0;">');

    return formatted;
} 