document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // prevent default form submission (refresh page)
    const name = this.name.value;
    const email = this.email.value; // form ke input field (email) ka value le raha hai.
    const password = this.password.value; 
    
    try {
        //await use kiya gaya hai — iska matlab hai "ruko jab tak fetch ka response nahi aata".
        const res = await fetch('/api/signup', {
            //api/signup → ye backend ka URL hai jahan pe signup data bhejna hai.
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }) // user data converted into json string 
            
        });
        const data = await res.json();
        const msg = document.getElementById('signupMessage');
        
        if (data.success) {
            msg.style.color = 'green';
            msg.textContent = 'Signup successful! Redirecting to login...';
            
            // Store user info in localStorage (for auto-login if needed)
            localStorage.setItem('userName', name);
            localStorage.setItem('isLoggedIn', 'false'); // Must login after signup
            
            setTimeout(() => window.location.href = 'login.html', 1200);
        } else {
            msg.style.color = '#ff6b35';
            msg.textContent = data.message || 'Signup failed.';
        }
    } catch (error) {
        const msg = document.getElementById('signupMessage');
        msg.style.color = '#ff6b35';
        msg.textContent = 'Network error. Please try again.';
    }
}); 