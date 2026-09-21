import { auth, db } from '../../config/firebase-config.js';

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   SAFE DOM HELPERS
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = getElement(id);

    if (element) {
        element.textContent = value ?? '';
    }
}

function setHTML(id, value) {
    const element = getElement(id);

    if (element) {
        element.innerHTML = value ?? '';
    }
}

function setDisplay(id, display) {
    const element = getElement(id);

    if (element) {
        element.style.display = display;
    }
}

function addClass(id, className) {
    const element = getElement(id);

    if (element) {
        element.classList.add(className);
    }
}

function removeClass(id, className) {
    const element = getElement(id);

    if (element) {
        element.classList.remove(className);
    }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMobileMenu() {
    const mobileMenu = getElement('mobileMenu');

    if (!mobileMenu) {
        return;
    }

    mobileMenu.classList.toggle('open');

    document.body.classList.toggle(
        'menu-open',
        mobileMenu.classList.contains('open')
    );
}

window.toggleMobileMenu = toggleMobileMenu;


/* =========================================================
   LOGOUT
   ========================================================= */

async function doLogout() {
    try {
        await signOut(auth);

        /*
         * Dashboard is inside /pages/.
         * Therefore login.html is also inside /pages/.
         */
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Logout failed:', error);

        alert('Unable to logout. Please try again.');
    }
}


/* Desktop logout button */
const navLogoutBtn = getElement('navLogoutBtn');

if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await doLogout();
    });
}


/* Mobile logout button */
const mobileLogoutLink = getElement('mobileLogoutLink');

if (mobileLogoutLink) {
    mobileLogoutLink.addEventListener('click', async (event) => {
        event.preventDefault();

        await doLogout();
    });
}


/* =========================================================
   REVIEW / RATING
   ========================================================= */

let currentRating = 0;


window.setRating = function (rating) {

    currentRating = Number(rating) || 0;

    const ratingInput = getElement('reviewRating');

    if (ratingInput) {
        ratingInput.value = currentRating;
    }

    const stars = document.querySelectorAll('#starRating span');

    stars.forEach((star) => {

        const starRating = parseInt(
            star.dataset.rating,
            10
        );

        if (starRating <= currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }

    });
};


/* Close review success modal */
window.closeReviewSuccessModal = function () {

    const modal = getElement('reviewSuccessModal');

    if (!modal) {
        return;
    }

    modal.classList.remove('active');
};


/* =========================================================
   ANNOUNCEMENTS
   ========================================================= */

async function loadAnnouncements() {

    try {

        const snapshot = await getDocs(
            collection(db, 'announcements')
        );

        const announcements = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter((announcement) => announcement.active === true)
            .sort((a, b) => {
                return (
                    (b.createdAt?.seconds || 0) -
                    (a.createdAt?.seconds || 0)
                );
            });


        if (announcements.length === 0) {
            return;
        }


        const ticker = getElement('announcementTicker');
        const content = getElement('tickerContent');


        /*
         * If announcement UI isn't present on this page,
         * don't crash the dashboard.
         */
        if (!ticker || !content) {
            return;
        }


        const itemsHTML = announcements
            .map((announcement) => {

                const type = announcement.type || 'info';

                const title = String(
                    announcement.title || ''
                );

                const message = String(
                    announcement.message || ''
                );

                return `
                    <div class="ticker-item ${type}">
                        <span class="ticker-item-icon"></span>
                        <strong>${title}:</strong>
                        <span>${message}</span>
                    </div>

                    <span class="ticker-item-separator">
                        ◆
                    </span>
                `;
            })
            .join('');


        content.innerHTML =
            itemsHTML + itemsHTML;


        const duration = Math.max(
            20,
            announcements.length * 8
        );


        content.style.animationDuration =
            `${duration}s`;


        ticker.classList.add('active');


    } catch (error) {

        console.warn(
            'Announcements load failed:',
            error?.message || error
        );

    }
}


/* =========================================================
   AUTH + DASHBOARD LOAD
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    /*
     * User is not logged in.
     */
    if (!user) {

        window.location.href = 'login.html';

        return;
    }


    try {

        /* ---------------------------------------------
           GET STUDENT
           --------------------------------------------- */

        const studentQuery = query(
            collection(db, 'students'),
            where('uid', '==', user.uid)
        );


        const studentSnapshot =
            await getDocs(studentQuery);


        /*
         * Student record doesn't exist.
         */
        if (studentSnapshot.empty) {

            console.warn(
                'No student record found'
            );


            const loadingScreen =
                getElement('loadingScreen');


            if (loadingScreen) {

                loadingScreen.innerHTML = `
                    <div class="dashboard-error">
                        <p>
                            Profile not found.
                            Please contact support.
                        </p>
                    </div>
                `;
            }


            return;
        }


        /* ---------------------------------------------
           STUDENT DATA
           --------------------------------------------- */

        const student =
            studentSnapshot.docs[0].data();


        const fullName =
            student.fullName || 'Student';


        const firstName =
            fullName.trim().split(/\s+/)[0] ||
            'Student';


        /* ---------------------------------------------
           PROFILE
           --------------------------------------------- */

        setText(
            'profileName',
            fullName
        );


        setText(
            'profileAvatar',
            firstName
                .charAt(0)
                .toUpperCase()
        );


        setText(
            'profileEmail',
            student.email || user.email || '—'
        );


        setText(
            'profilePhone',
            student.whatsapp || '—'
        );


        setText(
            'profileCity',
            student.city || '—'
        );


        /* ---------------------------------------------
           STATS
           --------------------------------------------- */

        setText(
            'statCourses',
            student.enrolledCourses || 1
        );


        setText(
            'statProgress',
            `${student.progress || 0}%`
        );


        setText(
            'statAssignments',
            student.pendingAssignments || 0
        );


        setText(
            'statAttendance',
            `${student.attendance || 0}%`
        );


        /* ---------------------------------------------
           PERSONAL INFORMATION
           --------------------------------------------- */

        setText(
            'infoFullName',
            student.fullName || '—'
        );


        setText(
            'infoFatherName',
            student.fatherName || '—'
        );


        setText(
            'infoEmail',
            student.email || user.email || '—'
        );


        setText(
            'infoWhatsapp',
            student.whatsapp || '—'
        );


        setText(
            'infoCity',
            student.city || '—'
        );


        setText(
            'infoEducation',
            student.education || '—'
        );


        setText(
            'infoCourse',
            student.course || '—'
        );


        setText(
            'infoTiming',
            student.timing || '—'
        );


        setText(
            'infoStatus',
            String(
                student.status || 'pending'
            ).toUpperCase()
        );


        /* ---------------------------------------------
           ENROLLED DATE
           --------------------------------------------- */

        let enrolledStr = '—';


        if (
            student.enrolledAt &&
            student.enrolledAt.seconds
        ) {

            const enrolledDate =
                new Date(
                    student.enrolledAt.seconds * 1000
                );


            enrolledStr =
                enrolledDate.toLocaleDateString(
                    'en-GB',
                    {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }
                );
        }


        setText(
            'infoEnrolledAt',
            enrolledStr
        );


        /* ---------------------------------------------
           COURSE PROGRESS
           --------------------------------------------- */

        const codingProgress =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        student.codingProgress || 0
                    )
                )
            );


        const aiProgress =
            Math.min(
                100,
                Math.max(
                    0,
                    Number(
                        student.aiProgress || 0
                    )
                )
            );


        setText(
            'codingProgress',
            `${codingProgress}%`
        );


        setText(
            'aiProgress',
            `${aiProgress}%`
        );


        const codingBar =
            getElement('codingBar');


        if (codingBar) {

            codingBar.style.width =
                `${codingProgress}%`;
        }


        const aiBar =
            getElement('aiBar');


        if (aiBar) {

            aiBar.style.width =
                `${aiProgress}%`;
        }


        /* ---------------------------------------------
           CERTIFICATE
           --------------------------------------------- */

        await loadCertificateStatus(
            user,
            student
        );


        /* ---------------------------------------------
           ANNOUNCEMENTS
           --------------------------------------------- */

        await loadAnnouncements();


        /* ---------------------------------------------
           EXISTING REVIEW
           --------------------------------------------- */

        await loadExistingReview(
            user
        );


        /* ---------------------------------------------
           SHOW DASHBOARD
           --------------------------------------------- */

        setDisplay(
            'loadingScreen',
            'none'
        );


        setDisplay(
            'dashboardContent',
            'block'
        );


    } catch (error) {

        console.error(
            'Dashboard error:',
            error
        );


        const loadingScreen =
            getElement('loadingScreen');


        if (loadingScreen) {

            loadingScreen.innerHTML = `
                <div class="dashboard-error">
                    <p>
                        Unable to load dashboard.
                        Please refresh and try again.
                    </p>
                </div>
            `;
        }

    }

});


/* =========================================================
   CERTIFICATE STATUS
   ========================================================= */

async function loadCertificateStatus(
    user,
    student
) {

    const certTitle =
        getElement('certTitle');


    const certDesc =
        getElement('certDesc');


    const certActions =
        getElement('certActions');


    /*
     * If certificate section isn't on the page,
     * don't run unnecessary UI operations.
     */
    if (
        !certTitle &&
        !certDesc &&
        !certActions
    ) {
        return;
    }


    try {

        /* ---------------------------------------------
           SEARCH BY EMAIL
           --------------------------------------------- */

        let certificateSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        'certificates'
                    ),
                    where(
                        'email',
                        '==',
                        user.email
                    )
                )
            );


        /* ---------------------------------------------
           FALLBACK SEARCH BY UID
           --------------------------------------------- */

        if (certificateSnapshot.empty) {

            certificateSnapshot =
                await getDocs(
                    query(
                        collection(
                            db,
                            'certificates'
                        ),
                        where(
                            'uid',
                            '==',
                            user.uid
                        )
                    )
                );
        }


        /* ---------------------------------------------
           CERTIFICATE FOUND
           --------------------------------------------- */

        if (!certificateSnapshot.empty) {

            const certificate =
                certificateSnapshot
                    .docs[0]
                    .data();


            setText(
                'certTitle',
                'Your Certificate is Ready'
            );


            setHTML(
                'certDesc',
                `
                    <strong>
                        ${escapeHTML(
                            certificate.course ||
                            'Course'
                        )}
                    </strong>

                    <br>

                    Certificate ID:
                    <strong>
                        ${escapeHTML(
                            certificate.certificateId ||
                            '—'
                        )}
                    </strong>

                    <br>

                    Issued on
                    ${escapeHTML(
                        certificate.issueDate ||
                        '—'
                    )}
                `
            );


            setHTML(
                'certActions',
                `
                    <a
                        href="certificate.html"
                        class="btn-cert-view"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            aria-hidden="true"
                        >
                            <path
                                d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                            />

                            <polyline
                                points="22 4 12 14.01 9 11.01"
                            />
                        </svg>

                        View Certificate
                    </a>
                `
            );


        } else {

            /* -----------------------------------------
               CERTIFICATE NOT READY
               ----------------------------------------- */

            setText(
                'certTitle',
                'Certificate Not Issued Yet'
            );


            setText(
                'certDesc',
                'Your certificate will be issued after you complete your course requirements including attendance and final project.'
            );


            setHTML(
                'certActions',
                `
                    <div class="cert-pending">

                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                            />

                            <polyline
                                points="12 6 12 12 16 14"
                            />
                        </svg>

                        Pending

                    </div>
                `
            );
        }


    } catch (error) {

        console.warn(
            'Certificate check failed:',
            error?.message || error
        );


        setText(
            'certTitle',
            'Certificate Status Unavailable'
        );


        setText(
            'certDesc',
            'Please try again later.'
        );


        setHTML(
            'certActions',
            ''
        );
    }
}


/* =========================================================
   EXISTING REVIEW
   ========================================================= */

async function loadExistingReview(user) {

    try {

        const reviewQuery =
            query(
                collection(
                    db,
                    'reviews'
                ),
                where(
                    'studentUid',
                    '==',
                    user.uid
                )
            );


        const snapshot =
            await getDocs(reviewQuery);


        if (snapshot.empty) {
            return;
        }


        const review =
            snapshot.docs[0].data();


        setDisplay(
            'reviewForm',
            'none'
        );


        setDisplay(
            'alreadyReviewed',
            'block'
        );


        const rating =
            Number(review.rating || 0);


        const stars =
            '★'.repeat(
                Math.max(
                    0,
                    Math.min(
                        5,
                        rating
                    )
                )
            );


        setText(
            'existingReviewText',
            `You rated ${rating} star${rating > 1 ? 's' : ''} (${stars}): "${review.reviewText || ''}"`
        );


    } catch (error) {

        console.warn(
            'Review load failed:',
            error?.message || error
        );
    }
}


/* =========================================================
   REVIEW FORM
   ========================================================= */

const reviewForm =
    getElement('reviewForm');


if (reviewForm) {

    reviewForm.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            /* -----------------------------------------
               GET RATING
               ----------------------------------------- */

            const ratingInput =
                getElement('reviewRating');


            const reviewTextInput =
                getElement('reviewText');


            const rating =
                parseInt(
                    ratingInput?.value || '0',
                    10
                );


            const reviewText =
                reviewTextInput?.value
                    ?.trim() || '';


            /* -----------------------------------------
               VALIDATE RATING
               ----------------------------------------- */

            if (
                !rating ||
                rating < 1 ||
                rating > 5
            ) {

                alert(
                    'Please select a rating (1-5 stars).'
                );

                return;
            }


            /* -----------------------------------------
               VALIDATE REVIEW
               ----------------------------------------- */

            if (
                !reviewText ||
                reviewText.length < 10
            ) {

                alert(
                    'Please write at least 10 characters in your review.'
                );

                return;
            }


            /* -----------------------------------------
               SUBMIT BUTTON
               ----------------------------------------- */

            const submitButton =
                getElement(
                    'reviewSubmitBtn'
                );


            const originalHTML =
                submitButton
                    ? submitButton.innerHTML
                    : 'Submit';


            if (submitButton) {

                submitButton.innerHTML =
                    'Submitting...';

                submitButton.disabled =
                    true;
            }


            try {

                /* -------------------------------------
                   CURRENT USER
                   ------------------------------------- */

                const user =
                    auth.currentUser;


                if (!user) {

                    alert(
                        'Your session has expired. Please login again.'
                    );

                    window.location.href =
                        'login.html';

                    return;
                }


                /* -------------------------------------
                   GET STUDENT PROFILE
                   ------------------------------------- */

                const studentQuery =
                    query(
                        collection(
                            db,
                            'students'
                        ),
                        where(
                            'uid',
                            '==',
                            user.uid
                        )
                    );


                const studentSnapshot =
                    await getDocs(
                        studentQuery
                    );


                const student =
                    studentSnapshot.empty
                        ? {}
                        : studentSnapshot
                            .docs[0]
                            .data();


                /* -------------------------------------
                   SUBMIT REVIEW
                   ------------------------------------- */

                await addDoc(
                    collection(
                        db,
                        'reviews'
                    ),
                    {
                        studentUid:
                            user.uid,

                        studentName:
                            student.fullName ||
                            'Student',

                        studentEmail:
                            user.email || '',

                        course:
                            student.course ||
                            'Course',

                        rating:
                            rating,

                        reviewText:
                            reviewText,

                        status:
                            'pending',

                        submittedAt:
                            serverTimestamp()
                    }
                );


                /* -------------------------------------
                   HIDE FORM
                   ------------------------------------- */

                setDisplay(
                    'reviewForm',
                    'none'
                );


                setDisplay(
                    'alreadyReviewed',
                    'block'
                );


                const stars =
                    '★'.repeat(
                        rating
                    );


                setText(
                    'existingReviewText',
                    `You rated ${rating} star${rating > 1 ? 's' : ''} (${stars}): "${reviewText}"`
                );


                /* -------------------------------------
                   SUCCESS MODAL
                   ------------------------------------- */

                addClass(
                    'reviewSuccessModal',
                    'active'
                );


            } catch (error) {

                console.error(
                    'Review submit error:',
                    error
                );


                alert(
                    'Failed to submit review. Please try again.'
                );


            } finally {

                if (submitButton) {

                    submitButton.innerHTML =
                        originalHTML;

                    submitButton.disabled =
                        false;
                }
            }
        }
    );
}


/* =========================================================
   HTML ESCAPE
   Prevents Firebase/user data from becoming raw HTML.
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? '')
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}
