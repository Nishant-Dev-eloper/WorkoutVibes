document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.email.value;
    const password = this.password.value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        const msg = document.getElementById('loginMessage');
        
        if (data.success) {
            msg.style.color = 'green';
            msg.textContent = 'Login successful! Redirecting...';
            
            // Store user info in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', data.userName || email.split('@')[0]); // Use email prefix if no name
            localStorage.setItem('userEmail', email); // Store email for shop/history
            
            setTimeout(() => window.location.href = '/', 1200);
        } else {
            msg.style.color = '#ff6b35';
            msg.textContent = data.message || 'Login failed.';
        }
    } catch (error) {
        const msg = document.getElementById('loginMessage');
        msg.style.color = '#ff6b35';
        msg.textContent = 'Network error. Please try again.';
    }
});

// Add logout function for future use
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail'); // Remove email on logout
    window.location.href = '/';
} 