document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.add('hidden');
    this.classList.add('active');
    document.getElementById('signupBtn').classList.remove('active');
});

document.getElementById('signupBtn').addEventListener('click', function() {
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotForm').classList.add('hidden');
    this.classList.add('active');
    document.getElementById('loginBtn').classList.remove('active');
});

document.getElementById('forgotPassword').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('forgotForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginBtn').classList.remove('active');
    document.getElementById('signupBtn').classList.remove('active');
});

// ** Sign Up Functionality **
document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.querySelector('#signupForm input[placeholder="Name"]').value;
    const email = document.querySelector('#signupForm input[placeholder="Email"]').value;
    const password = document.querySelector('#signupForm input[placeholder="Password"]').value;
    const confirmPassword = document.querySelector('#signupForm input[placeholder="Confirm Password"]').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Store user details in localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);

    alert("Sign-up successful! You can now log in.");
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
});

// ** Login Validation and Redirect **
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Stop form from submitting & refreshing the page

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Retrieve stored credentials from localStorage
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');

    // Check if user exists
    if (!storedEmail || !storedPassword) {
        alert("No user found. Please sign up first.");
        return;  // Stop further execution
    }

    // Validate login
    if (username === storedEmail && password === storedPassword) {
        alert("Login successful! Redirecting...");
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid username or password.");
    }
});



// ** Forgot Password Functionality **
document.getElementById('forgotForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const enteredEmail = document.querySelector('#forgotForm input[placeholder="Enter your email"]').value;
    const storedEmail = localStorage.getItem('userEmail');

    if (enteredEmail === storedEmail) {
        alert("Password reset link sent to your email!");
    } else {
        alert("Email not found! Please sign up first.");
    }
});
document.getElementById('themeButton').addEventListener('click', function () {
    document.body.classList.toggle('dark-mode'); // Toggle dark mode class

    // Save theme preference to localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        this.textContent = 'Switch to Light Mode';
    } else {
        localStorage.setItem('theme', 'light');
        this.textContent = 'Switch to Dark Mode';
    }
});

// Apply saved theme on page load
window.addEventListener('load', function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeButton').textContent = 'Switch to Light Mode';
    }
});
