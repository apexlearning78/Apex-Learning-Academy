// ==========================================
// APEX LEARNING ACADEMY — Dynamic Navbar
// Login state ke hisaab se navbar update karta hai
// ==========================================

import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    const authActions = document.getElementById('authActions');
    if (!authActions) return;

    if (user) {
        // ===== LOGGED IN — Dashboard + Logout =====
        authActions.innerHTML = `
            <a href="dashboard.html" class="btn-login">Dashboard</a>
            <button id="navLogoutBtn" class="btn-header-cta" style="border:none; cursor:pointer; font-family:inherit; font-size:14px;">Logout</button>
        `;

        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await signOut(auth);
                window.location.href = 'index.html';
            });
        }
    } else {
        // ===== LOGGED OUT — Login + Register =====
        authActions.innerHTML = `
            <a href="login.html" class="btn-login">Login</a>
            <a href="register.html" class="btn-header-cta">Register Now</a>
        `;
    }
});
