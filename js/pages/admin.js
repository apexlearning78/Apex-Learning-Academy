```javascript
import { auth, db } from '../../config/firebase-config.js';

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================================================
   APEX LEARNING ACADEMY
   ADMIN COMMAND CENTER
   SAFE / NULL-SAFE / ERROR-TOLERANT VERSION
   ========================================================= */

const ADMIN_UID = 'VHbqYaHK6yXP2f8IF9WKc33kkD73';
const ADMIN_NAME = 'Mukesh Kewal';

const APEX_EMAILJS_PUBLIC_KEY = '0CuJdjkOPS6ovXLmt';
const APEX_EMAILJS_SERVICE = 'service_bnv0t4n';
const APEX_EMAILJS_TEMPLATE = 'template_r3prv9y';

/* =========================================================
   SAFE DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const exists = (id) => Boolean($(id));

const onClick = (id, handler) => {
    const el = $(id);
    if (!el) return false;

    el.addEventListener('click', (event) => {
        try {
            const result = handler(event);
            if (result && typeof result.catch === 'function') {
                result.catch(handleError);
            }
        } catch (error) {
            handleError(error);
        }
    });

    return true;
};

const onSubmit = (id, handler) => {
    const el = $(id);
    if (!el) return false;

    el.addEventListener('submit', (event) => {
        try {
            const result = handler(event);
            if (result && typeof result.catch === 'function') {
                result.catch(handleError);
            }
        } catch (error) {
            handleError(error);
        }
    });

    return true;
};

const onInput = (id, handler) => {
    const el = $(id);
    if (!el) return false;

    el.addEventListener('input', (event) => {
        try {
            handler(event);
        } catch (error) {
            handleError(error);
        }
    });

    return true;
};

const onChange = (id, handler) => {
    const el = $(id);
    if (!el) return false;

    el.addEventListener('change', (event) => {
        try {
            const result = handler(event);
            if (result && typeof result.catch === 'function') {
                result.catch(handleError);
            }
        } catch (error) {
            handleError(error);
        }
    });

    return true;
};

const setText = (id, value = '') => {
    const el = $(id);
    if (el) el.textContent = value;
};

const setHTML = (id, value = '') => {
    const el = $(id);
    if (el) el.innerHTML = value;
};

const addClass = (id, className) => {
    const el = $(id);
    if (el) el.classList.add(className);
};

const removeClass = (id, className) => {
    const el = $(id);
    if (el) el.classList.remove(className);
};

const toggleClass = (id, className, state) => {
    const el = $(id);
    if (el) el.classList.toggle(className, state);
};

const show = (id, display = '') => {
    const el = $(id);
    if (el) el.style.display = display;
};

const hide = (id) => {
    const el = $(id);
    if (el) el.style.display = 'none';
};

const valueOf = (id, fallback = '') => {
    const el = $(id);
    return el ? String(el.value ?? fallback) : fallback;
};

const handleError = (error) => {
    console.error('[Apex Admin]', error);

    const message =
        error?.message ||
        error?.code ||
        'Something went wrong. Please try again.';

    try {
        toast(message, true);
    } catch {
        /* Never allow error handler itself to crash the application. */
    }
};

/* =========================================================
   EMAILJS INITIALIZATION
   ========================================================= */

function initEmailJS() {
    if (!window.emailjs) {
        window.__apexEmailReady = false;
        return false;
    }

    try {
        window.emailjs.init({
            publicKey: APEX_EMAILJS_PUBLIC_KEY
        });

        window.__apexEmailReady = true;
        return true;
    } catch (error) {
        console.warn('[Apex Admin] EmailJS initialization failed:', error);
        window.__apexEmailReady = false;
        return false;
    }
}

initEmailJS();

/* =========================================================
   MODULES
   ========================================================= */

const MODULES = {
    students: {
        label: 'Students',
        collection: 'students',
        fields: [
            'name',
            'email',
            'phone',
            'course',
            'batch',
            'status',
            'createdAt'
        ]
    },

    instructors: {
        label: 'Instructors',
        collection: 'instructorApplications',
        fields: [
            'name',
            'email',
            'phone',
            'subject',
            'status',
            'createdAt'
        ]
    },

    messages: {
        label: 'Messages',
        collection: 'messages',
        fields: [
            'name',
            'email',
            'subject',
            'status',
            'createdAt'
        ]
    },

    fees: {
        label: 'Fees & Payments',
        collection: 'fees',
        fields: [
            'studentName',
            'studentEmail',
            'amount',
            'status',
            'method',
            'dueDate',
            'paidAt'
        ]
    },

    progress: {
        label: 'Course Progress',
        collection: 'courseProgress',
        fields: [
            'studentName',
            'studentEmail',
            'course',
            'progress',
            'status',
            'updatedAt'
        ]
    },

    attendance: {
        label: 'Attendance',
        collection: 'attendance',
        fields: [
            'studentName',
            'studentEmail',
            'className',
            'role',
            'status',
            'joinedAt',
            'leftAt'
        ]
    },

    tests: {
        label: 'Tests & Results',
        collection: 'testSubmissions',
        fields: [
            'studentName',
            'studentEmail',
            'testTitle',
            'score',
            'status',
            'submittedAt'
        ]
    },

    certificates: {
        label: 'Certificates',
        collection: 'certificates',
        fields: [
            'studentName',
            'studentEmail',
            'course',
            'certificateId',
            'status',
            'issuedAt'
        ]
    },

    liveClasses: {
        label: 'Live Classes',
        collection: 'liveClasses',
        fields: [
            'subjectLabel',
            'title',
            'day',
            'time',
            'roomName',
            'status'
        ]
    },

    announcements: {
        label: 'Announcements',
        collection: 'announcements',
        fields: [
            'title',
            'message',
            'status',
            'audience',
            'publishedAt'
        ]
    },

    reviews: {
        label: 'Reviews',
        collection: 'reviews',
        fields: [
            'name',
            'email',
            'rating',
            'review',
            'status',
            'createdAt'
        ]
    },

    coupons: {
        label: 'Coupons',
        collection: 'coupons',
        fields: [
            'code',
            'discount',
            'type',
            'status',
            'expiresAt'
        ]
    },

    emailLogs: {
        label: 'Email Logs',
        collection: 'emailLogs',
        fields: [
            'studentName',
            'instructorName',
            'studentEmail',
            'instructorEmail',
            'subject',
            'sentVia',
            'type',
            'sentAt'
        ]
    },

    visitors: {
        label: 'Visitors',
        collection: 'visitors',
        fields: [
            'ip',
            'page',
            'userAgent',
            'createdAt'
        ]
    },

    visits: {
        label: 'Page Views',
        collection: 'visits',
        fields: [
            'page',
            'path',
            'referrer',
            'createdAt'
        ]
    },

    courses: {
        label: 'Courses',
        collection: 'courses',
        fields: [
            'name',
            'code',
            'duration',
            'fee',
            'status',
            'description'
        ]
    },

    batches: {
        label: 'Batches',
        collection: 'batches',
        fields: [
            'name',
            'course',
            'timing',
            'instructor',
            'status',
            'startDate'
        ]
    }
};

/* =========================================================
   DEFAULT LIVE SCHEDULE
   ========================================================= */

const DEFAULT_SCHEDULE = [
    {
        id: 'default-coding-mon',
        subjectLabel: 'Coding Course',
        title: 'Python — Functions & Modules',
        day: 'Monday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-Coding-Batch1'
    },
    {
        id: 'default-ai-tue',
        subjectLabel: 'AI Course',
        title: 'Introduction to Machine Learning',
        day: 'Tuesday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-AI-Batch1'
    },
    {
        id: 'default-coding-wed',
        subjectLabel: 'Coding Course',
        title: 'HTML & CSS — Responsive Layouts',
        day: 'Wednesday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-Coding-Batch1'
    },
    {
        id: 'default-ai-thu',
        subjectLabel: 'AI Course',
        title: 'Prompt Engineering Workshop',
        day: 'Thursday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-AI-Batch1'
    },
    {
        id: 'default-doubt-sat',
        subjectLabel: 'Doubt Session',
        title: 'Open Q&A — All Students Welcome',
        day: 'Saturday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-DoubtSession'
    }
];

/* =========================================================
   STATE
   ========================================================= */

let data = {};
let currentTab = 'dashboard';
let currentUser = null;
let jitsi = null;
let currentClass = null;

let emailCenterMode = 'students';
let emailCourseFilter = 'all';
let emailSelectedIds = new Set();

/* =========================================================
   UTILITIES
   ========================================================= */

const esc = (value) =>
    String(value ?? '').replace(
        /[&<>"']/g,
        (match) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[match]
    );

const fmt = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (value?.seconds) {
        return new Date(value.seconds * 1000).toLocaleString();
    }

    if (value instanceof Date) {
        return value.toLocaleString();
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '—';
        }
    }

    return String(value);
};

function toast(message, error = false) {
    const element = $('toast');

    if (!element) {
        console.warn('[Apex Admin Toast]', message);
        return;
    }

    element.textContent = message;
    element.className = `toast show${error ? ' error' : ''}`;

    clearTimeout(window.__apexToastTimer);

    window.__apexToastTimer = setTimeout(() => {
        if (element) {
            element.className = 'toast';
        }
    }, 2600);
}

/* =========================================================
   LOCAL ADMIN AUDIT
   ========================================================= */

function log(action, detail = '') {
    try {
        const existing = JSON.parse(
            localStorage.getItem('apex_admin_audit') || '[]'
        );

        existing.unshift({
            action,
            detail,
            time: new Date().toISOString(),
            admin: currentUser?.email || 'admin'
        });

        localStorage.setItem(
            'apex_admin_audit',
            JSON.stringify(existing.slice(0, 80))
        );

        renderActivity();
    } catch (error) {
        console.warn('[Apex Admin] Audit log failed:', error);
    }
}

/* =========================================================
   MODALS
   ========================================================= */

function showModal(title, body, foot = '') {
    setText('modalTitle', title);
    setHTML('modalBody', body);
    setHTML('modalFoot', foot);

    const modal = $('modalBg');

    if (modal) {
        modal.classList.add('open');
    }

    onClick('modalDone', closeModal);
    onClick('cancel', closeModal);
}

function closeModal() {
    const modal = $('modalBg');

    if (modal) {
        modal.classList.remove('open');
    }
}

onClick('modalClose', closeModal);

const modalBackground = $('modalBg');

if (modalBackground) {
    modalBackground.addEventListener('click', (event) => {
        if (event.target === modalBackground) {
            closeModal();
        }
    });
}

/* =========================================================
   LOGIN
   ========================================================= */

onSubmit('loginForm', async (event) => {
    event.preventDefault();

    removeClass('loginError', 'hidden');

    const email = valueOf('email').trim();
    const password = valueOf('password');

    if (!email || !password) {
        setText('loginError', 'Please enter your email and password.');
        removeClass('loginError', 'hidden');
        return;
    }

    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        toast('Secure login successful');
    } catch (error) {
        const message = String(
            error?.message || 'Login failed.'
        ).replace('Firebase: ', '');

        setText('loginError', message);
        removeClass('loginError', 'hidden');
    }
});

onClick('logoutBtn', async () => {
    try {
        await signOut(auth);
        toast('Signed out securely');
    } catch (error) {
        handleError(error);
    }
});

/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;

    if (!user) {
        show('login', 'grid');
        hide('app');
        return;
    }

    if (user.uid !== ADMIN_UID) {
        toast(
            'This account is not authorized for the admin panel.',
            true
        );

        try {
            await signOut(auth);
        } catch (error) {
            console.warn(
                '[Apex Admin] Unauthorized sign-out failed:',
                error
            );
        }

        return;
    }

    hide('login');
    show('app', 'block');

    setText(
        'adminEmail',
        user.email || ADMIN_NAME
    );

    setText(
        'avatar',
        (user.email || 'A').charAt(0).toUpperCase()
    );

    setText(
        'welcomeTitle',
        `Welcome back, ${ADMIN_NAME}`
    );

    log(
        'Admin session started',
        'Secure Firebase authentication'
    );

    try {
        await loadAll();
    } catch (error) {
        handleError(error);
    }
});

/* =========================================================
   FIREBASE DATA
   ========================================================= */

async function loadModule(key) {
    const module = MODULES[key];

    if (!module) {
        return [];
    }

    try {
        const snapshot = await getDocs(
            collection(db, module.collection)
        );

        data[key] = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));

        return data[key];
    } catch (error) {
        console.warn(
            `[Apex Admin] Failed loading ${key}:`,
            error
        );

        data[key] = [];

        return [];
    }
}

async function loadAll() {
    setText(
        'liveStatus',
        'Syncing academy data from Firebase…'
    );

    const keys = Object.keys(MODULES);

    await Promise.allSettled(
        keys.map((key) => loadModule(key))
    );

    updateCounts();
    renderDashboard();

    if (
        currentTab !== 'dashboard' &&
        MODULES[currentTab]
    ) {
        renderModule();
    }

    if (
        ['emailCenter', 'settings', 'audit'].includes(
            currentTab
        )
    ) {
        renderCustomView(currentTab);
    }

    setText(
        'liveStatus',
        `Firebase synced • ${new Date().toLocaleTimeString()}`
    );
}

/* =========================================================
   COUNTERS
   ========================================================= */

function updateCounts() {
    [
        'students',
        'instructors',
        'messages'
    ].forEach((key) => {
        setText(
            `c-${key}`,
            String((data[key] || []).length)
        );
    });

    [
        'students',
        'instructors',
        'fees',
        'messages',
        'tests',
        'attendance'
    ].forEach((key) => {
        setText(
            `s-${key}`,
            String((data[key] || []).length)
        );
    });
}

/* =========================================================
   ACTIVITY
   ========================================================= */

function renderActivity() {
    let activity = [];

    try {
        activity = JSON.parse(
            localStorage.getItem('apex_admin_audit') || '[]'
        );
    } catch {
        activity = [];
    }

    const html =
        activity
            .slice(0, 8)
            .map(
                (item) => `
                <div class="activity-item">
                    <span class="activity-dot"></span>
                    <div>
                        <b>${esc(item.action)}</b>
                        ${
                            item.detail
                                ? ` — ${esc(item.detail)}`
                                : ''
                        }
                        <time>
                            ${esc(
                                new Date(
                                    item.time
                                ).toLocaleString()
                            )}
                        </time>
                    </div>
                </div>
            `
            )
            .join('') ||
        '<div class="empty" style="padding:20px">No activity yet.</div>';

    setHTML('activity', html);
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
    updateCounts();
    renderActivity();

    const rows = [
        [
            'Students',
            data.students?.length || 0,
            'Active academy learner records',
            'students'
        ],
        [
            'Instructors',
            data.instructors?.length || 0,
            'Applications / teaching team',
            'instructors'
        ],
        [
            'Fees',
            data.fees?.length || 0,
            'Financial records',
            'fees'
        ],
        [
            'Messages',
            data.messages?.length || 0,
            'Incoming enquiries',
            'messages'
        ],
        [
            'Tests',
            data.tests?.length || 0,
            'Submitted assessments',
            'tests'
        ],
        [
            'Attendance',
            data.attendance?.length || 0,
            'Class attendance events',
            'attendance'
        ],
        [
            'Live Classes',
            data.liveClasses?.length || 0,
            'Scheduled rooms',
            'liveClasses'
        ],
        [
            'Certificates',
            data.certificates?.length || 0,
            'Issued / managed certificates',
            'certificates'
        ]
    ];

    setHTML(
        'snapshot',
        `
        <table>
            <thead>
                <tr>
                    <th>Area</th>
                    <th>Records</th>
                    <th>Purpose</th>
                    <th>Open</th>
                </tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (row) => `
                        <tr>
                            <td><b>${esc(row[0])}</b></td>
                            <td>${row[1]}</td>
                            <td>${esc(row[2])}</td>
                            <td>
                                <button
                                    class="btn btn-light"
                                    data-open="${esc(row[3])}"
                                >
                                    Manage
                                </button>
                            </td>
                        </tr>
                    `
                    )
                    .join('')}
            </tbody>
        </table>
        `
    );

    const snapshot = $('snapshot');

    if (snapshot) {
        snapshot
            .querySelectorAll('[data-open]')
            .forEach((button) => {
                button.addEventListener('click', () => {
                    switchTab(button.dataset.open);
                });
            });
    }
}

/* =========================================================
   EMAIL TEMPLATES
   ========================================================= */

const EMAIL_TEMPLATES = {
    welcome: {
        subject: 'Welcome to Apex Learning Academy!',
        body: `Assalam-o-Alaikum {NAME},

Welcome to Apex Learning Academy! We are thrilled to have you join our learning community.

Your registration has been successfully received. Our team will contact you shortly with your class schedule, batch details, and login credentials.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy
Learn. Rise. Achieve.`
    },

    idCard: {
        subject: 'Your Student ID Card is Ready',
        body: `Assalam-o-Alaikum {NAME},

Your Official Student ID Card is now available on your dashboard.

Login:
https://apexlearning78.github.io/Apex-Learning-Academy

Section: My ID Card

Best regards,
Mukesh Kewal`
    },

    fees: {
        subject: 'Fee Reminder — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

This is a reminder regarding your monthly fee.

Please complete the payment via JazzCash, EasyPaisa, or Bank Transfer, and share the screenshot on WhatsApp.

WhatsApp: 0341 034 9929

Best regards,
Mukesh Kewal`
    },

    classReminder: {
        subject: 'Class Reminder',
        body: `Assalam-o-Alaikum {NAME},

This is a reminder about your upcoming live class. Please join on time and make sure your audio/video is working.

Best regards,
Apex Learning Academy`
    },

    result: {
        subject: 'Your Result is Ready',
        body: `Assalam-o-Alaikum {NAME},

Your recent result has been published. You can check it on your dashboard:

https://apexlearning78.github.io/Apex-Learning-Academy/check-result.html

Best regards,
Apex Learning Academy`
    },

    certificate: {
        subject: 'Congratulations! Your Certificate is Ready',
        body: `Assalam-o-Alaikum {NAME},

Congratulations on completing your course at Apex Learning Academy!

Your certificate is now available on your dashboard.

Best regards,
Mukesh Kewal
Founder & Lead Instructor`
    },

    attendance: {
        subject: 'Attendance Alert — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Your attendance has been below the required 75%. Please attend upcoming classes to remain eligible for your certificate.

Best regards,
Apex Learning Academy`
    },

    holiday: {
        subject: 'Holiday Notice',
        body: `Assalam-o-Alaikum {NAME},

Please note that Apex Learning Academy will remain closed on the upcoming holiday. Classes will resume on the next scheduled day.

Best regards,
Apex Learning Academy`
    },

    custom: {
        subject: '',
        body: ''
    }
};

const INSTRUCTOR_REPLY_TEMPLATES = {
    received: {
        name: 'Application Received',
        desc: 'Acknowledge application',
        subject: 'Application Received — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for your interest in joining Apex Learning Academy as an instructor. We have successfully received your application for the position of {SUBJECT}.

Our hiring team will review your profile carefully and get back to you within 3-5 working days.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },

    shortlisted: {
        name: 'Shortlisted',
        desc: 'Move to interview',
        subject: 'Congratulations — You Are Shortlisted! | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Congratulations! We are pleased to inform you that your application for {SUBJECT} has been shortlisted by our hiring team.

Your profile and experience impressed us, and we would like to move forward with the next stage of the hiring process.

Next Steps:

1. Online interview
2. 10-minute demo lesson
3. Final selection communication

Please confirm your availability by replying to this email or on WhatsApp.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },

    rejected: {
        name: 'Not Selected',
        desc: 'Polite rejection',
        subject: 'Update Regarding Your Application | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for taking the time to apply for the {SUBJECT} position at Apex Learning Academy.

After careful review of all applications, we regret to inform you that we will not be moving forward with your application at this time.

We truly appreciate your interest and encourage you to apply again in the future.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },

    interview: {
        name: 'Interview Invite',
        desc: 'Schedule interview',
        subject: 'Interview Invitation — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

We are pleased to invite you for an online interview for the {SUBJECT} position at Apex Learning Academy.

Format: Online
Duration: 20-30 minutes
Includes: Introduction + Demo lesson

Please let us know your preferred date and time.

Looking forward to speaking with you!

Best regards,
Mukesh Kewal`
    },

    hired: {
        name: 'Hired — Welcome',
        desc: 'Welcome to team',
        subject: 'Welcome to the Apex Learning Academy Team!',
        body: `Assalam-o-Alaikum {NAME},

Congratulations! We are delighted to welcome you to the Apex Learning Academy team as our new {SUBJECT}.

We were thoroughly impressed by your skills and passion for teaching.

Onboarding details will be communicated shortly.

Welcome aboard!

Best regards,
Mukesh Kewal
Founder & Lead Instructor
Apex Learning Academy`
    },

    moreInfo: {
        name: 'Need More Info',
        desc: 'Request details',
        subject: 'Additional Information Required | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for your application for the {SUBJECT} position.

To proceed with your application, we require a bit more information from you.

Please share your updated CV, teaching experience, qualifications and availability.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },

    custom: {
        name: 'Custom Reply',
        desc: 'Write your own',
        subject: '',
        body: ''
    }
};

const STUDENT_REPLY_TEMPLATES = {
    thanks:
        `Assalam-o-Alaikum {NAME},

Thank you for reaching out to Apex Learning Academy.

We have received your message and will respond within 24 hours.

Best regards,
Apex Learning Academy Team
WhatsApp: 0341 034 9929`,

    fees:
        `Assalam-o-Alaikum {NAME},

Course Fee Details:

• Coding / Web Development: Rs. 3,000/month
• Artificial Intelligence: Rs. 4,000/month

For enrollment:
WhatsApp: 0341 034 9929

Best regards,
Apex Learning Academy`,

    timing:
        `Assalam-o-Alaikum {NAME},

Our weekly class schedule:

• Monday — Coding: 6:00 PM to 8:00 PM
• Tuesday — AI: 6:00 PM to 8:00 PM
• Wednesday — Coding: 6:00 PM to 8:00 PM
• Thursday — AI: 6:00 PM to 8:00 PM
• Saturday — Doubt Session: 6:00 PM to 8:00 PM

WhatsApp: 0341 034 9929`,

    enrollment:
        `Assalam-o-Alaikum {NAME},

Enrollment Process:

1. Register on our website
2. Our team contacts you
3. Book your FREE demo class
4. Complete payment

WhatsApp: 0341 034 9929`,

    demo:
        `Assalam-o-Alaikum {NAME},

We offer a FREE demo class.

To book your slot, please share your preferred day and time.

WhatsApp: 0341 034 9929`,

    certificate:
        `Assalam-o-Alaikum {NAME},

Certificate Details:

• Issued after course completion
• Requires 75% attendance
• Unique Certificate ID for verification

WhatsApp: 0341 034 9929`,

    technical:
        `Assalam-o-Alaikum {NAME},

We apologize for the technical issue.

Please share:
1. Screenshot of the problem
2. Device/browser details
3. When the issue occurred

WhatsApp: 0341 034 9929`,

    payment:
        `Assalam-o-Alaikum {NAME},

Accepted Payment Methods:

1. JazzCash
2. EasyPaisa
3. Bank Transfer

WhatsApp: 0341 034 9929`,

    custom: ''
};

/* =========================================================
   COURSE HELPERS
   ========================================================= */

function normalizeCourse(value = '') {
    const x = String(value).toLowerCase();

    if (
        x.includes('artificial') ||
        x === 'ai' ||
        x.includes('machine learning')
    ) {
        return 'Artificial Intelligence';
    }

    if (
        x.includes('web') ||
        x.includes('coding') ||
        x.includes('python')
    ) {
        return 'Web Development';
    }

    return String(value || 'Unassigned');
}

function emailTargetRows() {
    if (emailCenterMode === 'students') {
        return (data.students || []).filter(
            (student) =>
                emailCourseFilter === 'all' ||
                normalizeCourse(student.course) ===
                    emailCourseFilter
        );
    }

    if (emailCenterMode === 'instructors') {
        return (data.instructors || []).map((item) => ({
            ...item,
            fullName: item.fullName || item.name
        }));
    }

    return (data.messages || []).map((item) => ({
        ...item,
        fullName: item.fullName || item.name
    }));
}

/* =========================================================
   EMAIL CENTER
   ========================================================= */

function templateOptions() {
    const student = Object.entries(
        EMAIL_TEMPLATES
    )
        .map(
            ([key, value]) =>
                `<option value="student:${esc(key)}">${esc(
                    value.subject || key
                )}</option>`
        )
        .join('');

    const reply = Object.entries(
        STUDENT_REPLY_TEMPLATES
    )
        .map(
            ([key]) =>
                `<option value="reply:${esc(key)}">Reply • ${esc(
                    key
                )}</option>`
        )
        .join('');

    const instructor = Object.entries(
        INSTRUCTOR_REPLY_TEMPLATES
    )
        .map(
            ([key, value]) =>
                `<option value="instructor:${esc(key)}">Instructor • ${esc(
                    value.name || key
                )}</option>`
        )
        .join('');

    return `
        <option value="">Choose professional template…</option>
        <optgroup label="Student Emails">
            ${student}
        </optgroup>
        <optgroup label="Student Response Templates">
            ${reply}
        </optgroup>
        <optgroup label="Instructor Emails">
            ${instructor}
        </optgroup>
    `;
}

function applyCommunicationTemplate() {
    const templateElement = $('commTemplate');

    if (!templateElement) return;

    const value = templateElement.value;

    if (!value) return;

    const [type, key] = value.split(':');

    let subject = '';
    let body = '';

    const targets = emailTargetRows();

    const target =
        targets.find((item) =>
            emailSelectedIds.has(item.id)
        ) ||
        targets[0] ||
        {};

    const name =
        target.fullName ||
        target.name ||
        'Student';

    const course = target.course || '';

    if (
        type === 'student' &&
        EMAIL_TEMPLATES[key]
    ) {
        subject =
            EMAIL_TEMPLATES[key].subject;

        body =
            EMAIL_TEMPLATES[key].body;
    }

    if (
        type === 'reply' &&
        STUDENT_REPLY_TEMPLATES[key]
    ) {
        body =
            STUDENT_REPLY_TEMPLATES[key];

        subject = target.subject
            ? `Re: ${target.subject}`
            : 'Apex Learning Academy — Response';
    }

    if (
        type === 'instructor' &&
        INSTRUCTOR_REPLY_TEMPLATES[key]
    ) {
        subject =
            INSTRUCTOR_REPLY_TEMPLATES[key].subject;

        body =
            INSTRUCTOR_REPLY_TEMPLATES[key].body;
    }

    const replace = (text) =>
        String(text || '')
            .replace(/{NAME}/g, name)
            .replace(
                /{COURSE}/g,
                course || 'Web Development'
            )
            .replace(
                /{SUBJECT}/g,
                target.subject ||
                    target.position ||
                    target.course ||
                    'Instructor'
            );

    const subjectInput = $('commSubject');
    const bodyInput = $('commBody');

    if (subjectInput) {
        subjectInput.value =
            replace(subject);
    }

    if (bodyInput) {
        bodyInput.value =
            replace(body);
    }
}

function renderCommunication() {
    const rows = emailTargetRows();

    const sent =
        (data.emailLogs || []).length;

    const studentEmails =
        (data.students || []).filter(
            (item) => item.email
        ).length;

    const instructorEmails =
        (data.instructors || []).filter(
            (item) => item.email
        ).length;

    const courseCounts = [
        'Web Development',
        'Artificial Intelligence'
    ]
        .map(
            (course) => `
            <div class="kpi">
                <b>
                    ${
                        (data.students || []).filter(
                            (student) =>
                                normalizeCourse(
                                    student.course
                                ) === course
                        ).length
                    }
                </b>
                <span>${esc(course)} Students</span>
            </div>
        `
        )
        .join('');

    setHTML(
        'customViewContent',
        `
        <div class="kpi-row">
            ${courseCounts}

            <div class="kpi">
                <b>${sent}</b>
                <span>Email Logs</span>
            </div>

            <div class="kpi">
                <b>${studentEmails + instructorEmails}</b>
                <span>Email Contacts</span>
            </div>
        </div>

        <div class="card" style="margin-bottom:16px">
            <div class="card-head">
                <div>
                    <h3>Professional Communication Center</h3>
                    <p style="font-size:12px;color:var(--muted);margin-top:4px">
                        Student, instructor and website-response emails.
                    </p>
                </div>

                <div class="email-actions">
                    <button class="btn btn-light" id="commRefresh">
                        Refresh
                    </button>

                    <button class="btn btn-gold" id="commLogs">
                        Open Email Logs
                    </button>
                </div>
            </div>

            <div class="course-tabs">
                <button
                    class="course-tab ${
                        emailCenterMode === 'students'
                            ? 'active'
                            : ''
                    }"
                    data-comm-mode="students"
                >
                    Students
                </button>

                <button
                    class="course-tab ${
                        emailCenterMode === 'instructors'
                            ? 'active'
                            : ''
                    }"
                    data-comm-mode="instructors"
                >
                    Instructors
                </button>

                <button
                    class="course-tab ${
                        emailCenterMode === 'messages'
                            ? 'active'
                            : ''
                    }"
                    data-comm-mode="messages"
                >
                    Website Responses
                </button>
            </div>

            ${
                emailCenterMode === 'students'
                    ? `
                    <div class="course-tabs">
                        <button
                            class="course-tab ${
                                emailCourseFilter === 'all'
                                    ? 'active'
                                    : ''
                            }"
                            data-course-filter="all"
                        >
                            All Students
                        </button>

                        <button
                            class="course-tab ${
                                emailCourseFilter ===
                                'Web Development'
                                    ? 'active'
                                    : ''
                            }"
                            data-course-filter="Web Development"
                        >
                            🌐 Web Development
                        </button>

                        <button
                            class="course-tab ${
                                emailCourseFilter ===
                                'Artificial Intelligence'
                                    ? 'active'
                                    : ''
                            }"
                            data-course-filter="Artificial Intelligence"
                        >
                            🤖 Artificial Intelligence
                        </button>
                    </div>
                `
                    : ''
            }

            <div class="email-layout">

                <div>
                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            margin-bottom:8px
                        "
                    >
                        <b>
                            Recipients (${rows.length})
                        </b>

                        <label style="font-size:12px">
                            <input
                                type="checkbox"
                                id="commSelectAll"
                            >
                            Select all
                        </label>
                    </div>

                    <div class="email-recipient-list">

                        ${
                            rows.length
                                ? rows
                                      .map(
                                          (item) => `
                                <label class="email-recipient">

                                    <input
                                        type="checkbox"
                                        class="comm-recipient"
                                        value="${esc(
                                            item.id
                                        )}"
                                        ${
                                            emailSelectedIds.has(
                                                item.id
                                            )
                                                ? 'checked'
                                                : ''
                                        }
                                    >

                                    <span class="email-avatar">
                                        ${esc(
                                            (
                                                item.fullName ||
                                                item.name ||
                                                '?'
                                            )
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </span>

                                    <span>
                                        <b>
                                            ${esc(
                                                item.fullName ||
                                                    item.name ||
                                                    'Unknown'
                                            )}
                                        </b>

                                        <small>
                                            ${esc(
                                                item.email ||
                                                    'No email'
                                            )}

                                            ${
                                                item.course
                                                    ? ` • ${esc(
                                                          normalizeCourse(
                                                              item.course
                                                          )
                                                      )}`
                                                    : ''
                                            }
                                        </small>
                                    </span>

                                </label>
                            `
                                      )
                                      .join('')
                                : `
                                    <div
                                        class="empty"
                                        style="padding:30px"
                                    >
                                        No email contacts in this view.
                                    </div>
                                `
                        }

                    </div>
                </div>

                <div class="email-compose">

                    <div class="field">
                        <label>
                            Professional Template
                        </label>

                        <select id="commTemplate">
                            ${templateOptions()}
                        </select>
                    </div>

                    <div class="field">
                        <label>Subject</label>

                        <input
                            id="commSubject"
                            placeholder="Email subject"
                        >
                    </div>

                    <div class="field">
                        <label>Message</label>

                        <textarea
                            id="commBody"
                            placeholder="Write your professional Apex Learning Academy message…"
                        ></textarea>
                    </div>

                    <div class="email-actions">

                        <button
                            class="btn btn-gold"
                            id="commSend"
                        >
                            ✈ Send Email
                        </button>

                        <button
                            class="btn btn-light"
                            id="commWhatsApp"
                        >
                            WhatsApp
                        </button>

                        <button
                            class="btn btn-light"
                            id="commSaveDraft"
                        >
                            Save Draft
                        </button>

                    </div>

                    <small style="color:var(--muted)">
                        Successful emails are recorded in emailLogs.
                    </small>

                </div>

            </div>
        </div>

        <div class="card">

            <div class="card-head">
                <h3>Recent Sent Emails</h3>

                <button
                    class="btn btn-light"
                    id="commOpenLogs"
                >
                    View all
                </button>
            </div>

            <div class="table-wrap">

                ${
                    (data.emailLogs || [])
                        .slice()
                        .reverse()
                        .slice(0, 8)
                        .map(
                            (item) => `
                            <table style="width:100%">
                                <tr>

                                    <td>
                                        <b>
                                            ${esc(
                                                item.studentName ||
                                                    item.instructorName ||
                                                    item.toName ||
                                                    'Recipient'
                                            )}
                                        </b>

                                        <br>

                                        <small>
                                            ${esc(
                                                item.studentEmail ||
                                                    item.instructorEmail ||
                                                    item.toEmail ||
                                                    ''
                                            )}
                                        </small>
                                    </td>

                                    <td>
                                        ${esc(
                                            item.subject || ''
                                        )}
                                    </td>

                                    <td>
                                        ${esc(
                                            item.sentVia ||
                                                'email'
                                        )}
                                    </td>

                                    <td>
                                        ${esc(
                                            fmt(
                                                item.sentAt
                                            )
                                        )}
                                    </td>

                                </tr>
                            </table>
                        `
                        )
                        .join('') ||
                    `
                        <div
                            class="empty"
                            style="padding:20px"
                        >
                            No sent emails yet.
                        </div>
                    `
                }

            </div>
        </div>
        `
    );

    document
        .querySelectorAll('[data-comm-mode]')
        .forEach((button) => {
            button.addEventListener('click', () => {
                emailCenterMode =
                    button.dataset.commMode;

                emailSelectedIds.clear();

                renderCommunication();
            });
        });

    document
        .querySelectorAll('[data-course-filter]')
        .forEach((button) => {
            button.addEventListener('click', () => {
                emailCourseFilter =
                    button.dataset.courseFilter;

                emailSelectedIds.clear();

                renderCommunication();
            });
        });

    document
        .querySelectorAll('.comm-recipient')
        .forEach((checkbox) => {
            checkbox.addEventListener(
                'change',
                () => {
                    if (checkbox.checked) {
                        emailSelectedIds.add(
                            checkbox.value
                        );
                    } else {
                        emailSelectedIds.delete(
                            checkbox.value
                        );
                    }
                }
            );
        });

    onChange(
        'commSelectAll',
        (event) => {
            document
                .querySelectorAll('.comm-recipient')
                .forEach((checkbox) => {
                    checkbox.checked =
                        event.target.checked;

                    if (event.target.checked) {
                        emailSelectedIds.add(
                            checkbox.value
                        );
                    } else {
                        emailSelectedIds.delete(
                            checkbox.value
                        );
                    }
                });
        }
    );

    onChange(
        'commTemplate',
        applyCommunicationTemplate
    );

    onClick(
        'commSend',
        sendCommunicationEmails
    );

    onClick(
        'commWhatsApp',
        openCommunicationWhatsApp
    );

    onClick('commSaveDraft', () => {
        const subject = valueOf('commSubject');
        const body = valueOf('commBody');
        const template = valueOf('commTemplate');

        localStorage.setItem(
            'apex_email_draft',
            JSON.stringify({
                subject,
                body,
                template
            })
        );

        toast('Email draft saved');
    });

    onClick(
        'commRefresh',
        async () => {
            await loadAll();
            renderCommunication();
            toast(
                'Communication data refreshed'
            );
        }
    );

    onClick(
        'commLogs',
        () => switchTab('emailLogs')
    );

    onClick(
        'commOpenLogs',
        () => switchTab('emailLogs')
    );
}

/* =========================================================
   EMAIL SENDING
   ========================================================= */

async function sendOneEmail(
    target,
    subject,
    body,
    template
) {
    if (!target?.email) {
        throw new Error(
            'Recipient has no email address.'
        );
    }

    if (!window.emailjs) {
        throw new Error(
            'Email service is not available. Please refresh the page.'
        );
    }

    if (!window.__apexEmailReady) {
        initEmailJS();
    }

    if (!window.__apexEmailReady) {
        throw new Error(
            'Email service could not be initialized.'
        );
    }

    await window.emailjs.send(
        APEX_EMAILJS_SERVICE,
        APEX_EMAILJS_TEMPLATE,
        {
            to_email: target.email,
            to_name:
                target.fullName ||
                target.name ||
                'Student',
            subject,
            original_message:
                target.message ||
                '(Direct message from Apex Learning Academy)',
            reply_message: body,
            student_name:
                target.fullName ||
                target.name ||
                'Student',
            student_email:
                target.email
        }
    );

    await addDoc(
        collection(db, 'emailLogs'),
        {
            studentUid:
                target.uid || '',
            studentName:
                target.fullName ||
                target.name ||
                '',
            studentEmail:
                target.email || '',
            instructorUid:
                target.uid || '',
            instructorName:
                target.fullName ||
                target.name ||
                '',
            instructorEmail:
                target.email || '',
            subject,
            body,
            template:
                template || 'custom',
            sentAt:
                serverTimestamp(),
            sentVia: 'email',
            sentBy: 'admin',
            course:
                target.course || '',
            type:
                emailCenterMode
        }
    );
}

async function sendCommunicationEmails() {
    const targets =
        emailTargetRows().filter(
            (item) =>
                emailSelectedIds.has(item.id) &&
                item.email
        );

    const subject =
        valueOf('commSubject').trim();

    const body =
        valueOf('commBody').trim();

    const template =
        valueOf('commTemplate');

    if (!targets.length) {
        toast(
            'Select at least one recipient with an email address.',
            true
        );
        return;
    }

    if (!subject || !body) {
        toast(
            'Subject and message are required.',
            true
        );
        return;
    }

    const button = $('commSend');

    if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
    }

    let successful = 0;
    let failed = 0;

    for (const target of targets) {
        try {
            await sendOneEmail(
                target,
                subject,
                body,
                template
            );

            successful++;
        } catch (error) {
            failed++;
            console.warn(
                '[Apex Admin] Email failed:',
                error
            );
        }
    }

    if (button) {
        button.disabled = false;
        button.textContent = '✈ Send Email';
    }

    log(
        'Emails sent',
        `${successful} successful, ${failed} failed`
    );

    await loadAll();

    renderCommunication();

    toast(
        `${successful} email(s) sent${
            failed
                ? ` • ${failed} failed`
                : ''
        }`,
        failed > 0
    );
}

function openCommunicationWhatsApp() {
    const targets =
        emailTargetRows().filter(
            (item) =>
                emailSelectedIds.has(item.id) &&
                (item.phone ||
                    item.whatsapp)
        );

    const body =
        valueOf('commBody').trim();

    if (!targets.length || !body) {
        toast(
            'Select a recipient with a phone number and write a message.',
            true
        );
        return;
    }

    let phone = String(
        targets[0].phone ||
            targets[0].whatsapp ||
            ''
    ).replace(/\D/g, '');

    if (phone.startsWith('0')) {
        phone =
            '92' +
            phone.slice(1);
    }

    if (!phone) {
        toast(
            'Valid WhatsApp number not found.',
            true
        );
        return;
    }

    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(
            body
        )}`,
        '_blank',
        'noopener,noreferrer'
    );
}

/* =========================================================
   CUSTOM VIEWS
   ========================================================= */

function renderCustomView(key) {
    if (key === 'emailCenter') {
        renderCommunication();
        return;
    }

    if (key === 'settings') {
        renderSettings();
        return;
    }

    if (key === 'audit') {
        renderAudit();
    }
}

/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {
    let saved = {};

    try {
        saved = JSON.parse(
            localStorage.getItem(
                'apex_academy_settings'
            ) || '{}'
        );
    } catch {
        saved = {};
    }

    setHTML(
        'customViewContent',
        `
        <div class="card">

            <div class="card-head">

                <div>
                    <h3>
                        Academy Settings & Edit
                    </h3>

                    <p
                        style="
                            font-size:12px;
                            color:var(--muted);
                            margin-top:4px
                        "
                    >
                        Edit academy identity, contact
                        details and course structure.
                    </p>
                </div>

                <button
                    class="btn btn-gold"
                    id="saveSettings"
                >
                    Save Settings
                </button>

            </div>

            <div class="setting-grid">

                <div class="field">
                    <label>Academy Name</label>
                    <input
                        id="setName"
                        value="${esc(
                            saved.name ||
                                'Apex Learning Academy'
                        )}"
                    >
                </div>

                <div class="field">
                    <label>Founder / Admin Name</label>
                    <input
                        id="setFounder"
                        value="${esc(
                            saved.founder ||
                                'Mukesh Kewal'
                        )}"
                    >
                </div>

                <div class="field">
                    <label>WhatsApp</label>
                    <input
                        id="setWhatsApp"
                        value="${esc(
                            saved.whatsapp ||
                                '0341 034 9929'
                        )}"
                    >
                </div>

                <div class="field">
                    <label>Contact Email</label>
                    <input
                        id="setEmail"
                        value="${esc(
                            saved.email ||
                                'mukeshkewal19@gmail.com'
                        )}"
                    >
                </div>

                <div class="field">
                    <label>Website</label>
                    <input
                        id="setWebsite"
                        value="${esc(
                            saved.website ||
                                'https://apexlearning78.github.io/Apex-Learning-Academy'
                        )}"
                    >
                </div>

                <div class="field">
                    <label>Student Result URL</label>
                    <input
                        id="setResult"
                        value="${esc(
                            saved.resultUrl ||
                                'https://apexlearning78.github.io/Apex-Learning-Academy/check-result.html'
                        )}"
                    >
                </div>

            </div>
        </div>

        <div
            class="card"
            style="margin-top:16px"
        >

            <div class="card-head">

                <div>
                    <h3>
                        Courses — Edit
                    </h3>

                    <p
                        style="
                            font-size:12px;
                            color:var(--muted)
                        "
                    >
                        Web Development and Artificial
                        Intelligence remain separate.
                    </p>
                </div>

                <button
                    class="btn btn-light"
                    id="openCourses"
                >
                    Manage Courses
                </button>

            </div>

            <div class="setting-grid">

                <div class="course-card">

                    <div>
                        <h4>
                            🌐 Web Development
                        </h4>

                        <p>
                            Primary student grouping:
                            Web Development.
                        </p>
                    </div>

                    <button
                        class="btn btn-light"
                        data-edit-course="Web Development"
                    >
                        Edit
                    </button>

                </div>

                <div class="course-card">

                    <div>
                        <h4>
                            🤖 Artificial Intelligence
                        </h4>

                        <p>
                            Primary student grouping:
                            Artificial Intelligence.
                        </p>
                    </div>

                    <button
                        class="btn btn-light"
                        data-edit-course="Artificial Intelligence"
                    >
                        Edit
                    </button>

                </div>

            </div>
        </div>

        <div
            class="card"
            style="margin-top:16px"
        >

            <div class="card-head">
                <h3>System Controls</h3>
            </div>

            <div class="email-actions">

                <button
                    class="btn btn-light"
                    id="saveDraftFromSettings"
                >
                    Open Saved Email Draft
                </button>

                <button
                    class="btn btn-light"
                    id="clearAudit"
                >
                    Clear Local Audit
                </button>

                <button
                    class="btn btn-light"
                    id="resetSettings"
                >
                    Reset Settings
                </button>

            </div>

        </div>
        `
    );

    onClick('saveSettings', () => {
        const settings = {
            name: valueOf('setName'),
            founder: valueOf('setFounder'),
            whatsapp: valueOf('setWhatsApp'),
            email: valueOf('setEmail'),
            website: valueOf('setWebsite'),
            resultUrl: valueOf('setResult')
        };

        localStorage.setItem(
            'apex_academy_settings',
            JSON.stringify(settings)
        );

        toast('Academy settings saved');
    });

    onClick(
        'openCourses',
        () => switchTab('courses')
    );

    onClick(
        'saveDraftFromSettings',
        () => {
            switchTab('emailCenter');

            setTimeout(() => {
                try {
                    const draft =
                        JSON.parse(
                            localStorage.getItem(
                                'apex_email_draft'
                            ) || '{}'
                        );

                    const subject =
                        $('commSubject');

                    const body =
                        $('commBody');

                    if (subject) {
                        subject.value =
                            draft.subject || '';
                    }

                    if (body) {
                        body.value =
                            draft.body || '';
                    }
                } catch (error) {
                    handleError(error);
                }
            }, 50);
        }
    );

    onClick(
        'clearAudit',
        () => {
            localStorage.removeItem(
                'apex_admin_audit'
            );

            renderSettings();

            toast(
                'Local audit cleared'
            );
        }
    );

    onClick(
        'resetSettings',
        () => {
            localStorage.removeItem(
                'apex_academy_settings'
            );

            renderSettings();

            toast(
                'Settings reset'
            );
        }
    );
}

/* =========================================================
   AUDIT
   ========================================================= */

function renderAudit() {
    let audit = [];

    try {
        audit = JSON.parse(
            localStorage.getItem(
                'apex_admin_audit'
            ) || '[]'
        );
    } catch {
        audit = [];
    }

    setHTML(
        'customViewContent',
        `
        <div class="card">

            <div class="card-head">

                <div>
                    <h3>
                        Admin Audit Trail
                    </h3>

                    <p
                        style="
                            font-size:12px;
                            color:var(--muted)
                        "
                    >
                        Local browser audit of admin actions.
                    </p>
                </div>

                <button
                    class="btn btn-light"
                    id="auditClear"
                >
                    Clear
                </button>

            </div>

            <div class="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Detail</th>
                            <th>Admin</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${
                            audit.length
                                ? audit
                                      .map(
                                          (item) => `
                            <tr>

                                <td>
                                    ${esc(
                                        new Date(
                                            item.time
                                        ).toLocaleString()
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        item.action
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        item.detail ||
                                            ''
                                    )}
                                </td>

                                <td>
                                    ${esc(
                                        item.admin ||
                                            'admin'
                                    )}
                                </td>

                            </tr>
                        `
                                      )
                                      .join('')
                                : `
                            <tr>
                                <td colspan="4">
                                    No audit records.
                                </td>
                            </tr>
                        `
                        }

                    </tbody>

                </table>

            </div>

        </div>
        `
    );

    onClick(
        'auditClear',
        () => {
            localStorage.removeItem(
                'apex_admin_audit'
            );

            renderAudit();
        }
    );
}

/* =========================================================
   TAB SWITCHING
   ========================================================= */

function switchTab(key) {
    currentTab = key;

    document
        .querySelectorAll('.nav-item')
        .forEach((item) => {
            item.classList.toggle(
                'active',
                item.dataset.tab === key
            );
        });

    const custom = [
        'emailCenter',
        'settings',
        'audit'
    ];

    toggleClass(
        'dashboardView',
        'hidden',
        key !== 'dashboard'
    );

    toggleClass(
        'moduleView',
        'hidden',
        key === 'dashboard' ||
            custom.includes(key)
    );

    toggleClass(
        'customView',
        'hidden',
        !custom.includes(key)
    );

    let title = 'Administration';

    if (key === 'dashboard') {
        title = 'Overview';
    } else if (MODULES[key]) {
        title = MODULES[key].label;
    } else if (key === 'emailCenter') {
        title = 'Communication Center';
    } else if (key === 'settings') {
        title = 'Academy Settings';
    } else if (key === 'audit') {
        title = 'Admin Audit';
    }

    setText('pageTitle', title);

    const courseFilter =
        $('studentCourseFilter');

    if (courseFilter) {
        courseFilter.style.display =
            key === 'students'
                ? 'inline-flex'
                : 'none';

        if (key === 'students') {
            courseFilter.onchange =
                renderModule;
        }
    }

    if (key === 'dashboard') {
        renderDashboard();
    } else if (custom.includes(key)) {
        renderCustomView(key);
    } else if (MODULES[key]) {
        renderModule();
    }

    const sidebar = $('sidebar');

    if (sidebar) {
        sidebar.classList.remove('open');
    }

    document.body.classList.remove(
        'sidebar-open'
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

document
    .querySelectorAll('.nav-item')
    .forEach((button) => {
        button.addEventListener(
            'click',
            () => {
                if (button.dataset.tab) {
                    switchTab(
                        button.dataset.tab
                    );
                }
            }
        );
    });

document
    .querySelectorAll('[data-go]')
    .forEach((button) => {
        button.addEventListener(
            'click',
            () => {
                if (button.dataset.go) {
                    switchTab(
                        button.dataset.go
                    );
                }
            }
        );
    });

onClick('menuBtn', () => {
    const sidebar = $('sidebar');

    if (!sidebar) return;

    sidebar.classList.toggle('open');

    document.body.classList.toggle(
        'sidebar-open',
        sidebar.classList.contains('open')
    );
});

onClick(
    'refreshBtn',
    async () => {
        await loadAll();
        toast('Academy data refreshed');
    }
);

onClick(
    'dashboardRefresh',
    async () => {
        await loadAll();
        toast('Dashboard refreshed');
    }
);

onClick(
    'reloadBtn',
    async () => {
        if (
            currentTab &&
            MODULES[currentTab]
        ) {
            await loadModule(
                currentTab
            );

            renderModule();

            toast(
                'Module refreshed'
            );
        }
    }
);

onInput(
    'globalSearch',
    (event) => {
        const query = String(
            event.target.value || ''
        )
            .toLowerCase()
            .trim();

        if (!query) return;

        const found = Object.keys(
            MODULES
        ).find((key) =>
            (data[key] || []).some(
                (item) =>
                    JSON.stringify(item)
                        .toLowerCase()
                        .includes(query)
            )
        );

        if (found) {
            switchTab(found);
        }
    }
);

onInput(
    'moduleSearch',
    renderModule
);

onChange(
    'statusFilter',
    renderModule
);

/* =========================================================
   BADGES
   ========================================================= */

function badge(value) {
    if (!value) {
        return '—';
    }

    const normalized =
        String(value).toLowerCase();

    let className = 'b-gray';

    if (
        [
            'active',
            'paid',
            'approved',
            'hired',
            'completed',
            'pass',
            'published'
        ].includes(normalized)
    ) {
        className = 'b-green';
    } else if (
        [
            'pending',
            'unpaid',
            'reviewed',
            'scheduled'
        ].includes(normalized)
    ) {
        className = 'b-gold';
    } else if (
        [
            'rejected',
            'fail',
            'cancelled'
        ].includes(normalized)
    ) {
        className = 'b-red';
    } else if (
        [
            'live',
            'shortlisted'
        ].includes(normalized)
    ) {
        className = 'b-blue';
    }

    return `
        <span class="badge ${className}">
            ${esc(value)}
        </span>
    `;
}

/* =========================================================
   STUDENT NORMALIZATION
   ========================================================= */

function normalizeStudentRows() {
    return (data.students || []).map(
        (student) => ({
            ...student,
            courseGroup:
                normalizeCourse(
                    student.course
                )
        })
    );
}

/* =========================================================
   MODULE TABLE
   ========================================================= */

function renderModule() {
    const module =
        MODULES[currentTab];

    if (!module) return;

    let rows =
        currentTab === 'students'
            ? normalizeStudentRows()
            : data[currentTab] || [];

    if (currentTab === 'students') {
        const filter =
            $('studentCourseFilter');

        if (
            filter &&
            filter.value !== 'all'
        ) {
            rows = rows.filter(
                (item) =>
                    item.courseGroup ===
                    filter.value
            );
        }
    }

    const search =
        valueOf(
            'moduleSearch'
        )
            .toLowerCase()
            .trim();

    const status =
        valueOf(
            'statusFilter'
        );

    if (search) {
        rows = rows.filter(
            (item) =>
                JSON.stringify(item)
                    .toLowerCase()
                    .includes(search)
        );
    }

    if (status) {
        rows = rows.filter(
            (item) =>
                String(
                    item.status || ''
                ).toLowerCase() ===
                status.toLowerCase()
        );
    }

    if (!rows.length) {
        setHTML(
            'moduleTable',
            `
            <div class="empty">
                <strong>
                    No records found
                </strong>

                <span>
                    Try changing your search/filter
                    or add a new record.
                </span>
            </div>
            `
        );

        return;
    }

    const fields =
        module.fields;

    setHTML(
        'moduleTable',
        `
        <table>

            <thead>
                <tr>
                    ${fields
                        .map(
                            (field) => `
                            <th>
                                ${esc(
                                    field.replace(
                                        /([A-Z])/g,
                                        ' $1'
                                    )
                                )}
                            </th>
                        `
                        )
                        .join('')}

                    <th>
                        Actions
                    </th>
                </tr>
            </thead>

            <tbody>

                ${rows
                    .map(
                        (item) => `
                        <tr>

                            ${fields
                                .map(
                                    (field) => `
                                    <td>
                                        ${
                                            field
                                                .toLowerCase()
                                                .includes(
                                                    'status'
                                                )
                                                ? badge(
                                                      item[
                                                          field
                                                      ]
                                                  )
                                                : `
                                                <span
                                                    title="${esc(
                                                        fmt(
                                                            item[
                                                                field
                                                            ]
                                                        )
                                                    )}"
                                                >
                                                    ${esc(
                                                        fmt(
                                                            item[
                                                                field
                                                            ]
                                                        )
                                                    )}
                                                </span>
                                                `
                                        }
                                    </td>
                                `
                                )
                                .join('')}

                            <td class="actions">

                                <button
                                    class="btn btn-blue view"
                                    data-id="${esc(
                                        item.id
                                    )}"
                                >
                                    View
                                </button>

                                <button
                                    class="btn btn-light edit"
                                    data-id="${esc(
                                        item.id
                                    )}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="btn btn-danger del"
                                    data-id="${esc(
                                        item.id
                                    )}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>
                    `
                    )
                    .join('')}

            </tbody>

        </table>
        `
    );

    const table =
        $('moduleTable');

    if (!table) return;

    table
        .querySelectorAll('.view')
        .forEach((button) => {
            button.addEventListener(
                'click',
                () =>
                    viewRecord(
                        button.dataset.id
                    )
            );
        });

    table
        .querySelectorAll('.edit')
        .forEach((button) => {
            button.addEventListener(
                'click',
                () =>
                    editRecord(
                        button.dataset.id
                    )
            );
        });

    table
        .querySelectorAll('.del')
        .forEach((button) => {
            button.addEventListener(
                'click',
                () =>
                    deleteRecord(
                        button.dataset.id
                    )
            );
        });

    addStudentEmailButtons();
}

/* =========================================================
   QUICK STUDENT EMAIL
   ========================================================= */

function addStudentEmailButtons() {
    if (currentTab !== 'students') {
        return;
    }

    const table =
        $('moduleTable');

    if (!table) return;

    const allRows =
        normalizeStudentRows();

    const query =
        valueOf(
            'moduleSearch'
        )
            .toLowerCase()
            .trim();

    let filtered =
        allRows.filter(
            (item) =>
                !query ||
                JSON.stringify(item)
                    .toLowerCase()
                    .includes(query)
        );

    const filter =
        $('studentCourseFilter');

    if (
        filter &&
        filter.value &&
        filter.value !== 'all'
    ) {
        filtered =
            filtered.filter(
                (item) =>
                    item.courseGroup ===
                    filter.value
            );
    }

    table
        .querySelectorAll(
            'tbody tr'
        )
        .forEach((row, index) => {
            const student =
                filtered[index];

            const actions =
                row.querySelector(
                    '.actions'
                );

            if (
                !student ||
                !actions ||
                actions.querySelector(
                    '.quick-email'
                )
            ) {
                return;
            }

            const button =
                document.createElement(
                    'button'
                );

            button.className =
                'btn btn-blue quick-email';

            button.textContent =
                'Email';

            button.addEventListener(
                'click',
                () => {
                    emailCenterMode =
                        'students';

                    emailCourseFilter =
                        normalizeCourse(
                            student.course
                        );

                    emailSelectedIds =
                        new Set([
                            student.id
                        ]);

                    switchTab(
                        'emailCenter'
                    );
                }
            );

            actions.prepend(
                button
            );
        });
}

/* =========================================================
   VIEW RECORD
   ========================================================= */

function viewRecord(id) {
    const records =
        data[currentTab] || [];

    const item =
        records.find(
            (record) =>
                record.id === id
        );

    if (!item) {
        toast(
            'Record not found.',
            true
        );
        return;
    }

    const module =
        MODULES[currentTab];

    if (!module) return;

    const html = `
        <div class="detail-grid">

            ${Object.entries(item)
                .filter(
                    ([key]) =>
                        key !== 'id'
                )
                .map(
                    ([key, value]) => `
                    <div class="detail">

                        <small>
                            ${esc(
                                key.replace(
                                    /([A-Z])/g,
                                    ' $1'
                                )
                            )}
                        </small>

                        <b>
                            ${esc(
                                fmt(value)
                            )}
                        </b>

                    </div>
                `
                )
                .join('')}

        </div>
    `;

    showModal(
        `${module.label} • Record`,
        html,
        `
        <button
            class="btn btn-light"
            id="modalDone"
        >
            Close
        </button>
        `
    );

    onClick(
        'modalDone',
        closeModal
    );
}

/* =========================================================
   FORM GENERATOR
   ========================================================= */

function formFor(item = {}) {
    const module =
        MODULES[currentTab];

    if (!module) {
        return '';
    }

    return `
        <div class="form-grid">

            ${module.fields
                .map((field) => {
                    const value =
                        item[field];

                    const lower =
                        field.toLowerCase();

                    const isLong =
                        [
                            'message',
                            'review',
                            'description',
                            'notes'
                        ].some(
                            (name) =>
                                lower.includes(
                                    name
                                )
                        );

                    const isDate =
                        [
                            'date',
                            'at',
                            'expires'
                        ].some(
                            (name) =>
                                lower.endsWith(
                                    name
                                ) ||
                                lower.includes(
                                    name
                                )
                        );

                    const formatted =
                        fmt(value) === '—'
                            ? ''
                            : fmt(value);

                    let inputValue =
                        formatted;

                    if (
                        isDate &&
                        value?.seconds
                    ) {
                        inputValue =
                            new Date(
                                value.seconds *
                                    1000
                            )
                                .toISOString()
                                .slice(
                                    0,
                                    16
                                );
                    }

                    if (isLong) {
                        return `
                            <div class="field full">

                                <label>
                                    ${esc(
                                        field
                                    )}
                                </label>

                                <textarea
                                    id="f_${esc(
                                        field
                                    )}"
                                    rows="4"
                                >${esc(
                                    inputValue
                                )}</textarea>

                            </div>
                        `;
                    }

                    return `
                        <div class="field">

                            <label>
                                ${esc(
                                    field
                                )}
                            </label>

                            <input
                                id="f_${esc(
                                    field
                                )}"
                                ${
                                    isDate
                                        ? 'type="datetime-local"'
                                        : ''
                                }
                                value="${esc(
                                    inputValue
                                )}"
                            >

                        </div>
                    `;
                })
                .join('')}

        </div>
    `;
}

/* =========================================================
   ADD RECORD
   ========================================================= */

function addRecord() {
    const module =
        MODULES[currentTab];

    if (!module) {
        toast(
            'Please select a valid module.',
            true
        );
        return;
    }

    showModal(
        `Add ${module.label}`,
        formFor(),
        `
        <button
            class="btn btn-light"
            id="cancel"
        >
            Cancel
        </button>

        <button
            class="btn btn-primary"
            id="save"
        >
            Save Record
        </button>
        `
    );

    onClick(
        'cancel',
        closeModal
    );

    onClick(
        'save',
        async () => {
            await saveRecord();
        }
    );
}

/* =========================================================
   SAVE RECORD
   ========================================================= */

async function saveRecord(id = null) {
    const module =
        MODULES[currentTab];

    if (!module) {
        toast(
            'Invalid module.',
            true
        );
        return;
    }

    const payload = {};

    for (const field of module.fields) {
        const element =
            $(`f_${field}`);

        if (!element) {
            continue;
        }

        payload[field] =
            String(
                element.value ?? ''
            ).trim();
    }

    try {
        if (id) {
            await updateDoc(
                doc(
                    db,
                    module.collection,
                    id
                ),
                payload
            );

            log(
                'Record updated',
                `${module.label} • ${id}`
            );

            toast(
                'Record updated'
            );
        } else {
            payload.createdAt =
                serverTimestamp();

            await addDoc(
                collection(
                    db,
                    module.collection
                ),
                payload
            );

            log(
                'Record created',
                module.label
            );

            toast(
                'Record created'
            );
        }

        closeModal();

        await loadModule(
            currentTab
        );

        renderModule();
        updateCounts();
        renderDashboard();

    } catch (error) {
        handleError(error);
    }
}

/* =========================================================
   EDIT RECORD
   ========================================================= */

function editRecord(id) {
    const item =
        (data[currentTab] || [])
            .find(
                (record) =>
                    record.id === id
            );

    if (!item) {
        toast(
            'Record not found.',
            true
        );
        return;
    }

    const module =
        MODULES[currentTab];

    if (!module) return;

    showModal(
        `Edit ${module.label}`,
        formFor(item),
        `
        <button
            class="btn btn-light"
            id="cancel"
        >
            Cancel
        </button>

        <button
            class="btn btn-primary"
            id="save"
        >
            Save Changes
        </button>
        `
    );

    onClick(
        'cancel',
        closeModal
    );

    onClick(
        'save',
        () => saveRecord(id)
    );
}

/* =========================================================
   DELETE RECORD
   ========================================================= */

async function deleteRecord(id) {
    const module =
        MODULES[currentTab];

    if (!module) return;

    const confirmed =
        window.confirm(
            'Delete this record permanently from Firestore?'
        );

    if (!confirmed) {
        return;
    }

    try {
        await deleteDoc(
            doc(
                db,
                module.collection,
                id
            )
        );

        log(
            'Record deleted',
            `${module.label} • ${id}`
        );

        toast(
            'Record deleted'
        );

        await loadModule(
            currentTab
        );

        renderModule();
        updateCounts();
        renderDashboard();

    } catch (error) {
        handleError(error);
    }
}

/* =========================================================
   ADD / EXPORT
   ========================================================= */

onClick(
    'addBtn',
    addRecord
);

onClick(
    'exportBtn',
    () => {
        const rows =
            data[currentTab] || [];

        if (!rows.length) {
            toast(
                'Nothing to export.',
                true
            );
            return;
        }

        const keys = [
            ...new Set(
                rows.flatMap(
                    (item) =>
                        Object.keys(item)
                )
            )
        ].filter(
            (key) => key !== 'id'
        );

        const csv = [
            keys.join(','),
            ...rows.map(
                (item) =>
                    keys
                        .map((key) => {
                            const value =
                                fmt(
                                    item[
                                        key
                                    ]
                                );

                            return `"${String(
                                value
                            ).replace(
                                /"/g,
                                '""'
                            )}"`;
                        })
                        .join(',')
            )
        ].join('\n');

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        'text/csv;charset=utf-8;'
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const anchor =
            document.createElement(
                'a'
            );

        anchor.href = url;

        anchor.download =
            `apex-${currentTab}-${new Date()
                .toISOString()
                .slice(
                    0,
                    10
                )}.csv`;

        document.body.appendChild(
            anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
            url
        );

        log(
            'CSV exported',
            MODULES[currentTab]?.label ||
                currentTab
        );

        toast(
            'CSV exported'
        );
    }
);

/* =========================================================
   QUICK ACTIONS
   ========================================================= */

document
    .querySelectorAll('[data-action]')
    .forEach((button) => {
        button.addEventListener(
            'click',
            () => {
                const map = {
                    student: 'students',
                    fee: 'fees',
                    announcement:
                        'announcements',
                    coupon: 'coupons',
                    certificate:
                        'certificates'
                };

                if (
                    button.dataset.action ===
                    'class'
                ) {
                    openLive();
                    return;
                }

                const target =
                    map[
                        button.dataset
                            .action
                    ];

                if (!target) {
                    toast(
                        'Action unavailable.',
                        true
                    );
                    return;
                }

                switchTab(
                    target
                );

                setTimeout(
                    addRecord,
                    50
                );
            }
        );
    });

onClick(
    'quickStudent',
    () => {
        switchTab('students');

        setTimeout(
            addRecord,
            50
        );
    }
);

onClick(
    'quickAnnouncement',
    () => {
        switchTab(
            'announcements'
        );

        setTimeout(
            addRecord,
            50
        );
    }
);

/* =========================================================
   LIVE CLASSES
   ========================================================= */

async function openLive() {
    const classList =
        $('classList');

    const liveBg =
        $('liveBg');

    if (!classList || !liveBg) {
        toast(
            'Live class panel is unavailable.',
            true
        );
        return;
    }

    classList.innerHTML =
        '<div class="loader">Loading live class schedule…</div>';

    liveBg.classList.add(
        'open'
    );

    const classes =
        data.liveClasses?.length
            ? data.liveClasses
            : DEFAULT_SCHEDULE;

    classList.innerHTML =
        classes
            .map(
                (item, index) => `
                <div
                    style="
                        padding:14px;
                        border:1px solid var(--line);
                        border-radius:13px;
                        margin-bottom:9px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px
                    "
                >

                    <div>

                        <b>
                            ${esc(
                                item.title ||
                                    'Live Class'
                            )}
                        </b>

                        <div
                            style="
                                font-size:10px;
                                color:#7d8998;
                                margin-top:3px
                            "
                        >
                            ${esc(
                                item.subjectLabel ||
                                    item.subject ||
                                    ''
                            )}

                            •
                            ${esc(
                                item.day ||
                                    ''
                            )}

                            ${esc(
                                item.time ||
                                    ''
                            )}

                            <br>

                            Room:
                            ${esc(
                                item.roomName ||
                                    ''
                            )}

                        </div>

                    </div>

                    <button
                        class="btn btn-success"
                        data-start="${index}"
                    >
                        Start Host
                    </button>

                </div>
            `
            )
            .join('');

    classList
        .querySelectorAll(
            '[data-start]'
        )
        .forEach((button) => {
            button.addEventListener(
                'click',
                () => {
                    const index =
                        Number(
                            button.dataset
                                .start
                        );

                    startLive(
                        classes[index]
                    );
                }
            );
        });
}

onClick(
    'liveBtn',
    openLive
);

onClick(
    'liveClose',
    () => {
        const bg =
            $('liveBg');

        if (bg) {
            bg.classList.remove(
                'open'
            );
        }
    }
);

const liveBackground =
    $('liveBg');

if (liveBackground) {
    liveBackground.addEventListener(
        'click',
        (event) => {
            if (
                event.target ===
                liveBackground
            ) {
                liveBackground.classList.remove(
                    'open'
                );
            }
        }
    );
}

/* =========================================================
   START JITSI LIVE CLASS
   ========================================================= */

async function startLive(cls) {
    if (!cls) {
        toast(
            'Live class information is missing.',
            true
        );
        return;
    }

    currentClass = cls;

    removeClass(
        'liveBg',
        'open'
    );

    addClass(
        'liveOverlay',
        'open'
    );

    setText(
        'liveTitle',
        cls.title ||
            'Apex Live Class'
    );

    const container =
        $('jitsiContainer');

    if (!container) {
        toast(
            'Jitsi container is missing.',
            true
        );

        removeClass(
            'liveOverlay',
            'open'
        );

        currentClass = null;

        return;
    }

    container.innerHTML = '';

    try {
        await addDoc(
            collection(
                db,
                'attendance'
            ),
            {
                studentName:
                    ADMIN_NAME +
                    ' (Host)',
                role: 'host',
                classId:
                    cls.id || '',
                className:
                    cls.title ||
                    'Live Class',
                joinedAt:
                    serverTimestamp(),
                status:
                    'host_joined'
            }
        );
    } catch (error) {
        console.warn(
            '[Apex Admin] Host attendance logging failed:',
            error
        );
    }

    if (
        typeof window.JitsiMeetExternalAPI !==
        'function'
    ) {
        toast(
            'Jitsi is not loaded. Please refresh the page and try again.',
            true
        );

        endLive();
        return;
    }

    try {
        jitsi =
            new window.JitsiMeetExternalAPI(
                'meet.jit.si',
                {
                    roomName:
                        cls.roomName ||
                        `Apex-${Date.now()}`,

                    width: '100%',
                    height: '100%',

                    parentNode:
                        container,

                    userInfo: {
                        displayName:
                            ADMIN_NAME +
                            ' (Host)'
                    },

                    configOverwrite: {
                        prejoinPageEnabled:
                            false,
                        disableDeepLinking:
                            true
                    },

                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK:
                            false,

                        SHOW_BRAND_WATERMARK:
                            false,

                        DEFAULT_BACKGROUND:
                            '#071A33'
                    }
                }
            );

        if (jitsi?.addEventListener) {
            jitsi.addEventListener(
                'videoConferenceLeft',
                endLive
            );
        }

    } catch (error) {
        handleError(error);
        endLive();
    }
}

/* =========================================================
   END LIVE
   ========================================================= */

async function endLive() {
    if (currentClass) {
        try {
            await addDoc(
                collection(
                    db,
                    'attendance'
                ),
                {
                    studentName:
                        ADMIN_NAME +
                        ' (Host)',
                    role: 'host',
                    classId:
                        currentClass.id ||
                        '',
                    className:
                        currentClass.title ||
                        'Live Class',
                    endedAt:
                        serverTimestamp(),
                    status:
                        'host_left'
                }
            );
        } catch (error) {
            console.warn(
                '[Apex Admin] Host exit logging failed:',
                error
            );
        }
    }

    if (jitsi) {
        try {
            if (
                typeof jitsi.dispose ===
                'function'
            ) {
                jitsi.dispose();
            }
        } catch (error) {
            console.warn(
                '[Apex Admin] Jitsi dispose failed:',
                error
            );
        }
    }

    jitsi = null;
    currentClass = null;

    removeClass(
        'liveOverlay',
        'open'
    );

    const container =
        $('jitsiContainer');

    if (container) {
        container.innerHTML = '';
    }

    log(
        'Live class ended'
    );

    toast(
        'Live class ended'
    );
}

onClick(
    'endLive',
    endLive
);

/* =========================================================
   THEME
   ========================================================= */

onClick(
    'themeBtn',
    () => {
        document.body.classList.toggle(
            'dark'
        );

        const isDark =
            document.body.classList.contains(
                'dark'
            );

        document.documentElement.style.setProperty(
            '--bg',
            isDark
                ? '#08111F'
                : '#F4F7FB'
        );

        toast(
            'Display mode toggled'
        );
    }
);

/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    'keydown',
    (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        closeModal();

        const liveBg =
            $('liveBg');

        if (liveBg) {
            liveBg.classList.remove(
                'open'
            );
        }

        const sidebar =
            $('sidebar');

        if (sidebar) {
            sidebar.classList.remove(
                'open'
            );
        }

        document.body.classList.remove(
            'sidebar-open'
        );
    }
);

/* =========================================================
   INITIAL SAFE RENDER
   ========================================================= */

try {
    renderActivity();
} catch (error) {
    console.warn(
        '[Apex Admin] Initial activity render failed:',
        error
    );
}
```
