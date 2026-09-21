import { auth } from '../../config/firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const forgotForm = document.getElementById('forgotForm');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const registerPrompt = document.getElementById('registerPrompt');

window.showForgotForm = function() {
    loginForm.style.display = 'none';
    forgotForm.style.display = 'block';
    registerPrompt.style.display = 'none';
    pageTitle.textContent = 'Reset Password';
    pageSubtitle.textContent = 'Enter your email to receive a reset link.';
    loginError.classList.remove('active');
    loginSuccess.classList.remove('active');
};

window.showLoginForm = function() {
    loginForm.style.display = 'block';
    forgotForm.style.display = 'none';
    registerPrompt.style.display = 'block';
    pageTitle.textContent = 'Welcome Back';
    pageSubtitle.textContent = 'Login to access your courses and dashboard.';
    loginError.classList.remove('active');
    loginSuccess.classList.remove('active');
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('active');
    loginSuccess.classList.remove('active');

    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const password = document.getElementById('passwordInput').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password.';
        loginError.classList.add('active');
        return;
    }

    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.7';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error.code, error.message);
        
        let msg = 'Login failed. ';
        switch (error.code) {
            case 'auth/user-not-found':
                msg = 'This email is not registered. Please create an account.';
                break;
            case 'auth/wrong-password':
                msg = 'Incorrect password. Try again or use "Forgot password".';
                break;
            case 'auth/invalid-email':
                msg = 'Please enter a valid email address.';
                break;
            case 'auth/invalid-credential':
                msg = 'Invalid email or password. Try again or use "Forgot password".';
                break;
            case 'auth/too-many-requests':
                msg = 'Too many failed attempts. Please wait a few minutes and try again.';
                break;
            case 'auth/operation-not-allowed':
                msg = 'Email/Password login is not enabled. Please contact support.';
                break;
            case 'auth/network-request-failed':
                msg = 'Network error. Please check your internet connection.';
                break;
            default:
                msg = 'Login failed: ' + error.message;
        }
        
        loginError.textContent = msg;
        loginError.classList.add('active');
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
    }
});

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('active');
    loginSuccess.classList.remove('active');

    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const forgotBtn = document.getElementById('forgotBtn');

    if (!email) {
        loginError.textContent = 'Please enter your email address.';
        loginError.classList.add('active');
        return;
    }

    const originalText = forgotBtn.textContent;
    forgotBtn.textContent = 'Sending...';
    forgotBtn.disabled = true;
    forgotBtn.style.opacity = '0.7';

    try {
        await sendPasswordResetEmail(auth, email);
        
        loginSuccess.innerHTML = `
            <strong>Reset link sent!</strong><br>
            We've sent a password reset link to <strong>${email}</strong>. 
            Please check your inbox (and spam folder) and follow the instructions.
        `;
        loginSuccess.classList.add('active');
        forgotForm.reset();

        setTimeout(() => {
            showLoginForm();
        }, 5000);

    } catch (error) {
        console.error('Reset error:', error.code, error.message);

        let msg = 'Failed to send reset link. ';
        switch (error.code) {
            case 'auth/user-not-found':
                msg = 'This email is not registered with us. Please check the email or create an account.';
                break;
            case 'auth/invalid-email':
                msg = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                msg = 'Too many requests. Please wait a few minutes and try again.';
                break;
            case 'auth/network-request-failed':
                msg = 'Network error. Please check your internet connection.';
                break;
            default:
                msg = 'Failed: ' + error.message;
        }

        loginError.textContent = msg;
        loginError.classList.add('active');
    } finally {
        forgotBtn.textContent = originalText;
        forgotBtn.disabled = false;
        forgotBtn.style.opacity = '1';
    }
});
