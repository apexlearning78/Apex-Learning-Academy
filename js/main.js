/* ============================================================
   APEX LEARNING ACADEMY — MAIN JAVASCRIPT
   Handles: Scroll progress, header, mobile menu, dropdown,
            FAQ accordion, scroll reveal, counters, marquee
   ============================================================ */

(function () {
    'use strict';

    /* ============================================================
       1. SCROLL PROGRESS BAR
       ============================================================ */
    const scrollProgress = document.getElementById('scrollProgress');

    function updateScrollProgress() {
        if (!scrollProgress) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = percent + '%';
    }

    /* ============================================================
       2. HEADER SCROLL EFFECT
       ============================================================ */
    const siteHeader = document.getElementById('siteHeader');

    function updateHeader() {
        if (!siteHeader) return;
        if (window.scrollY > 40) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }
    }

    /* ============================================================
       3. MOBILE MENU
       ============================================================ */
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileBackdrop = document.getElementById('mobileBackdrop');
    const mobileClose = document.getElementById('mobileClose');

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('open');
        if (mobileBackdrop) mobileBackdrop.classList.add('open');
        if (mobileToggle) mobileToggle.classList.add('open');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        if (mobileBackdrop) mobileBackdrop.classList.remove('open');
        if (mobileToggle) mobileToggle.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (mobileMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', closeMobileMenu);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    });

    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {

                setTimeout(closeMobileMenu, 150);
            });
        });
    }


    window.addEventListener('resize', () => {
        if (window.innerWidth >= 901 && mobileMenu && mobileMenu.classList.contains('open')) closeMobileMenu();
    });

    /* ============================================================
       4. NAV DROPDOWN ("More")
       ============================================================ */
    const moreDropdown = document.getElementById('moreDropdown');

    if (moreDropdown) {
        const trigger = moreDropdown.querySelector('.nav-dropdown-trigger');

        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = moreDropdown.classList.toggle('open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        document.addEventListener('click', (e) => {
            if (!moreDropdown.contains(e.target)) {
                moreDropdown.classList.remove('open');
                const t = moreDropdown.querySelector('.nav-dropdown-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                moreDropdown.classList.remove('open');
                const t = moreDropdown.querySelector('.nav-dropdown-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ============================================================
       5. FAQ ACCORDION
       ============================================================ */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (!question || !answer) return;

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            faqItems.forEach((other) => {
                if (other !== item && other.classList.contains('open')) {
                    other.classList.remove('open');
                    const otherQ = other.querySelector('.faq-question');
                    const otherA = other.querySelector('.faq-answer');
                    if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
                    if (otherA) otherA.style.maxHeight = null;
                }
            });

            if (isOpen) {
                item.classList.remove('open');
                question.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('open');
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ============================================================
       6. SCROLL REVEAL ANIMATION
       ============================================================ */
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -60px 0px',
            }
        );

        revealElements.forEach((el) => revealObserver.observe(el));
    } else {

        revealElements.forEach((el) => el.classList.add('visible'));
    }

    /* ============================================================
       7. COUNTER ANIMATION (for elements with data-count)
       ============================================================ */
    const counters = document.querySelectorAll('[data-count]');

    function animateCounter(el) {
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1800;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(eased * target);
            el.textContent = value + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    if ('IntersectionObserver' in window && counters.length > 0) {
        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach((c) => counterObserver.observe(c));
    }

    /* ============================================================
       8. MARQUEE PAUSE ON HOVER
       ============================================================ */
    const marqueeTrack = document.querySelector('.marquee-track');

    if (marqueeTrack) {
        marqueeTrack.addEventListener('mouseenter', () => {
            marqueeTrack.style.animationPlayState = 'paused';
        });
        marqueeTrack.addEventListener('mouseleave', () => {
            marqueeTrack.style.animationPlayState = 'running';
        });
    }

    /* ============================================================
       9. SMOOTH SCROLL FOR INTERNAL ANCHOR LINKS
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth',
                });
            }
        });
    });

    /* ============================================================
       10. PARALLAX HERO ORBS (subtle, on desktop only)
       ============================================================ */
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');

    if (isDesktop && orb1 && orb2) {
        let ticking = false;

        function handleParallax() {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                orb1.style.transform = `translate(${scrolled * 0.08}px, ${scrolled * 0.12}px)`;
                orb2.style.transform = `translate(${-scrolled * 0.06}px, ${-scrolled * 0.1}px)`;
            }
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(handleParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    /* ============================================================
       11. RIPPLE / ACTIVE STATE ON CTA BUTTONS (micro-interaction)
       ============================================================ */
    document.querySelectorAll('.cta-primary, .btn-gold, .cta-secondary').forEach((btn) => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleAnim 0.6s ease-out;
                pointer-events: none;
                z-index: 0;
            `;

            const pos = getComputedStyle(this).position;
            if (pos === 'static') this.style.position = 'relative';
            this.style.overflow = 'hidden';

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 650);
        });
    });

    if (!document.getElementById('rippleKeyframe')) {
        const style = document.createElement('style');
        style.id = 'rippleKeyframe';
        style.textContent = `
            @keyframes rippleAnim {
                to { transform: scale(2.2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /* ============================================================
       12. ACTIVE NAV LINK ON SCROLL (single-page highlight)
       ============================================================ */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.main-nav > a[href^="#"], .main-nav > a[href$=".html"]');

    if (sections.length > 0 && 'IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');

                        navLinks.forEach((link) => {
                            const href = link.getAttribute('href');
                            if (href === `#${id}`) {
                                document.querySelectorAll('.main-nav > a').forEach((l) => l.classList.remove('active'));
                                link.classList.add('active');
                            }
                        });
                    }
                });
            },
            {
                threshold: 0.35,
                rootMargin: '-100px 0px -40% 0px',
            }
        );

        sections.forEach((s) => navObserver.observe(s));
    }

    /* ============================================================
       13. INITIAL RUN
       ============================================================ */
    function init() {
        updateScrollProgress();
        updateHeader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('scroll', updateHeader, { passive: true });

    window.addEventListener('resize', updateScrollProgress, { passive: true });

    /* ============================================================
       14. EXPOSE FOR OTHER SCRIPTS (optional)
       ============================================================ */
    window.ApexUI = {
        closeMobileMenu,
        openMobileMenu,
    };
})();
