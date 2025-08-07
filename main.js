// User authentication state management
let currentUser = null;
// const nav = document.querySelector('.main-nav');
// const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');


// ==== Gemini API Key ====
const GEMINI_API_KEY = "AIzaSyA4HxhEg1sciJYdUJNUK0yfmtv0Sogfm-8";

// ==== Chatbot UI Logic ====
window.addEventListener('DOMContentLoaded', function () {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    if (!chatbotToggle || !chatbotWindow || !chatbotForm || !chatbotInput || !chatbotMessages) return;

    chatbotToggle.onclick = () => {
        chatbotWindow.style.display = chatbotWindow.style.display === 'none' ? 'flex' : 'none';
    };

    function appendMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = sender;
        msg.textContent = text;
        chatbotMessages.appendChild(msg);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    chatbotForm.onsubmit = async (e) => {
        e.preventDefault();
        const userInput = chatbotInput.value.trim();

        if (!userInput) return;

        appendMessage(userInput, 'user');
        chatbotInput.value = '';
        appendMessage('Thinking...', 'bot');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Avoid using **bold text** in the output. Present all information using clear bullet points or numbered steps. 

Give me detailed, step-by-step instructions on how to perform the exercise "${userInput}" in an organized format with the following structure:

1. Name of the exercise

(Leave a blank line)

2. Category (e.g., gym workout, yoga, bodyweight, etc.)

(Leave a blank line)

3. Muscles targeted

(Leave a blank line)

4. Equipment needed (if any)

(Leave a blank line)

5. Step-by-step instructions (clear and simple)

(Leave a blank line)

6. Common mistakes to avoid

(Leave a blank line)

7. Tips for beginners

(Leave a blank line)

8. YouTube video link to learn visually

(Leave a blank line)

If "${userInput}" is not a known exercise, respond: "Sorry, I don't know about that exercise."
`
                        }
                    ]
                }
            ]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST', // matlab hum data bhej rahe hain server ko 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json(); // API se jo response aaya usko JSON object mein convert kar rahi hai.
            chatbotMessages.removeChild(chatbotMessages.lastChild);

            if (
                data &&
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts[0].text
            ) {
                appendMessage(data.candidates[0].content.parts[0].text, 'bot');
            } else {
                appendMessage("Sorry, I couldn't get a response.", 'bot');
            }
        } catch (error) {
            chatbotMessages.removeChild(chatbotMessages.lastChild);
            appendMessage("Error connecting to Gemini API.", 'bot');
            console.error(error);
        }
    };
});







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
        authButtons.style.display = 'none'; // to hide login & signup button on index.html
        userInfo.style.display = 'flex'; // to show username in flexbox 
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
    localStorage.removeItem('userEmail'); // Remove email on logout
    currentUser = null;
    showLoggedOutState();
    window.location.href = '/index.html';
    // Optionally, reload to update nav
    // location.reload();
}


// Interactive Navigation
const nav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');


// Add logout button event listener
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    checkAuthState();
});

// Parallax hero image
const heroImg = document.querySelector('.hero-img');
window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight) {
        heroImg.style.transform = `scale(1.05) translateY(${window.scrollY * 0.18}px)`;
    }
});

// Floating hero content
const heroContent = document.querySelector('.hero-content');
let floatDir = 1;
setInterval(() => {
    heroContent.style.transform = `translateY(${Math.sin(Date.now() / 700) * 6}px)`;
}, 30);

// Smooth scrolling for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar transparency on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.style.background = 'rgba(255,255,255,0.98)';
        nav.style.boxShadow = '0 8px 32px rgba(30, 59, 114, 0)';
    } else {
        nav.style.background = 'rgba(255,255,255,0.95)';
        nav.style.boxShadow = '0 4px 24px rgba(30, 59, 114, 0.46)';
    }
});

// Active navigation highlighting
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Card micro-interactions
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.transform = `rotateX(${-(y - rect.height / 2) / 18}deg) rotateY(${(x - rect.width / 2) / 18}deg) scale(1.04)`;
        card.style.boxShadow = '0 16px 48px rgba(30,60,114,0.18)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.boxShadow = '';
    });
});

// Section fade-in on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.18 });

document.querySelectorAll('.about-section, .supplements-section, .memberships-section').forEach(section => {
    observer.observe(section);
});

// Buy Now button handler with authentication check
const buyBtns = document.querySelectorAll('.buy-btn');
buyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!currentUser) {
            showLoginRequired();
            return;
        }
        const plan = btn.getAttribute('data-plan');
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            showLoginRequired();
            return;
        }
        // Call backend to save membership purchase
        const res = await fetch('/api/membership/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: userEmail, plan })
        });
        const data = await res.json();
        if (data.success) {
            alert(`Thank you for purchasing the ${plan} membership!`);
        } else {
            alert('Error processing membership.');
        }
    });
});

// Show login required message
function showLoginRequired() {
    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.disabled-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'disabled-overlay';
        overlay.innerHTML = `
            <div class="disabled-message">
                <h2>🔒 Login Required</h2>
                <p>You need to be logged in to purchase memberships and access premium features.</p>
                <a href="login.html" class="login-now-btn">Login Now</a>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    overlay.style.display = 'flex';

    // Close overlay when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
        }
    });

    // Close overlay when clicking login button
    const loginBtn = overlay.querySelector('.login-now-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }
}

// Dark mode toggle logic
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

// Initialize auth state on page load
checkAuthState();

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        setDarkMode(!isDark);
    });
}
// Load dark mode preference
const darkPref = localStorage.getItem('darkMode');
setDarkMode(darkPref === 'true'); 