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

// ==========================================================
// FLOATING BUTTONS — WhatsApp + Back to Top
// ==========================================================
(function() {
    // Don't add on admin page
    if (window.location.pathname.includes('admin')) return;

    // Wait for body to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingButtons);
    } else {
        initFloatingButtons();
    }

    function initFloatingButtons() {
        // WhatsApp Button
        if (!document.querySelector('.whatsapp-float')) {
            const waBtn = document.createElement('a');
            waBtn.className = 'whatsapp-float';
            waBtn.href = 'https://wa.me/923410349929?text=' + encodeURIComponent(
                'Assalam-o-Alaikum, I want to know more about Apex Learning Academy courses.'
            );
            waBtn.target = '_blank';
            waBtn.rel = 'noopener';
            waBtn.setAttribute('aria-label', 'Chat on WhatsApp');
            waBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2zm5.5 14.2c-.2.7-1.3 1.3-1.8 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.6-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3 0 .2 0 .7-.2 1.4z"/></svg>';
            document.body.appendChild(waBtn);
        }

        // Back to Top Button
        if (!document.querySelector('.back-to-top')) {
            const topBtn = document.createElement('button');
            topBtn.className = 'back-to-top';
            topBtn.setAttribute('aria-label', 'Back to top');
            topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15"/></svg>';
            topBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            document.body.appendChild(topBtn);

            // Show/hide on scroll
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 400) {
                    topBtn.classList.add('show');
                } else {
                    topBtn.classList.remove('show');
                }
            }, { passive: true });
        }
    }
})();
