/* ============================================================
   APEX LEARNING ACADEMY
   ADMIN COMMAND CENTER
   Production Admin Controller
   Version: 2026.09
   ============================================================ */

import { auth, db } from '../../config/firebase-config.js';

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


/* ============================================================
   CONFIG
   ============================================================ */

const ADMIN_UID =
    'VHbqYaHK6yXP2f8IF9WKc33kkD73';

const ADMIN_NAME =
    'Mukesh Kewal';

const EMAILJS_PUBLIC_KEY =
    '0CuJdjkOPS6ovXLmt';

const EMAILJS_SERVICE =
    'service_bnv0t4n';

const EMAILJS_TEMPLATE =
    'template_r3prv9y';


/* ============================================================
   STATE
   ============================================================ */

const state = {

    currentTab: 'dashboard',

    currentUser: null,

    search: '',

    course: 'all',

    selectedRecipients:
        new Set(),

    emailRecipientType:
        'students',

    data: {

        visitors: [],
        visits: [],
        students: [],
        fees: [],
        progress: [],
        instructors: [],
        messages: [],
        reviews: [],
        coupons: [],
        certificates: [],
        tests: [],
        liveClasses: [],
        attendance: [],
        announcements: [],
        emailLogs: []

    },

    jitsi: null,

    currentLiveClass: null,

    replyRecipient: null

};


/* ============================================================
   MODULES
   ============================================================ */

const MODULES = {

    students: {
        label: 'Students',
        collection: 'students'
    },

    fees: {
        label: 'Fees',
        collection: 'fees'
    },

    progress: {
        label: 'Course Progress',
        collection: 'courseProgress'
    },

    attendance: {
        label: 'Attendance',
        collection: 'attendance'
    },

    tests: {
        label: 'Test Submissions',
        collection: 'testSubmissions'
    },

    certificates: {
        label: 'Certificates',
        collection: 'certificates'
    },

    messages: {
        label: 'Student Messages',
        collection: 'messages'
    },

    instructors: {
        label: 'Instructor Applications',
        collection: 'instructorApplications'
    },

    reviews: {
        label: 'Reviews',
        collection: 'reviews'
    },

    coupons: {
        label: 'Coupons',
        collection: 'coupons'
    },

    liveClasses: {
        label: 'Live Classes',
        collection: 'liveClasses'
    },

    announcements: {
        label: 'Announcements',
        collection: 'announcements'
    },

    visitors: {
        label: 'Visitors',
        collection: 'visitors'
    },

    visits: {
        label: 'Page Visits',
        collection: 'visits'
    },

    emailLogs: {
        label: 'Email Logs',
        collection: 'emailLogs'
    }

};


/* ============================================================
   DEFAULT LIVE SCHEDULE
   ============================================================ */

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


/* ============================================================
   EMAIL TEMPLATES
   ============================================================ */

const EMAIL_TEMPLATES = {

    welcome: {
        subject: 'Welcome to Apex Learning Academy!',
        body:
`Assalam-o-Alaikum {NAME},

Welcome to Apex Learning Academy!

We are thrilled to have you join our learning community.

Your registration has been successfully received. Our team will contact you shortly with your class schedule, batch details, and next steps.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy
Learn. Rise. Achieve.`
    },

    idCard: {
        subject: 'Your Student ID Card is Ready',
        body:
`Assalam-o-Alaikum {NAME},

Your Official Student ID Card is now available on your student dashboard.

You can log in here:
https://apexlearning78.github.io/Apex-Learning-Academy/

Best regards,
Mukesh Kewal
Apex Learning Academy`
    },

    fees: {
        subject: 'Fee Reminder — Apex Learning Academy',
        body:
`Assalam-o-Alaikum {NAME},

This is a reminder regarding your course fee.

Please complete your payment through the available payment method and share the payment screenshot with our official WhatsApp number.

WhatsApp:
0341 034 9929

Best regards,
Apex Learning Academy`
    },

    classReminder: {
        subject: 'Class Reminder — Apex Learning Academy',
        body:
`Assalam-o-Alaikum {NAME},

This is a reminder about your upcoming live class for {COURSE}.

Please join on time and make sure your internet connection, microphone and camera are ready.

Best regards,
Apex Learning Academy`
    },

    result: {
        subject: 'Your Result is Ready — Apex Learning Academy',
        body:
`Assalam-o-Alaikum {NAME},

Your recent result has been published.

You can check your result through the academy website.

https://apexlearning78.github.io/Apex-Learning-Academy/check-result.html

Best regards,
Apex Learning Academy`
    },

    certificate: {
        subject: 'Congratulations! Your Certificate is Ready',
        body:
`Assalam-o-Alaikum {NAME},

Congratulations on completing your course at Apex Learning Academy!

Your certificate information is now available through your student dashboard.

Best regards,
Mukesh Kewal
Founder & Lead Instructor`
    },

    attendance: {
        subject: 'Attendance Update — Apex Learning Academy',
        body:
`Assalam-o-Alaikum {NAME},

This is an attendance update regarding your {COURSE} course.

Please make sure you attend your upcoming classes regularly.

Best regards,
Apex Learning Academy`
    },

    holiday: {
        subject: 'Holiday Notice — Apex Learning Academy',
        body:
`Assalam-o-Alaikum {NAME},

Please note that Apex Learning Academy will remain closed on the announced holiday.

Classes will resume on the next scheduled day.

Best regards,
Apex Learning Academy`
    }

};


/* ============================================================
   REPLY TEMPLATES
   ============================================================ */

const REPLY_TEMPLATES = {

    thanks:
`Assalam-o-Alaikum {NAME},

Thank you for reaching out to Apex Learning Academy.

We have received your inquiry and our official team is here to assist you.

Best regards,
Apex Learning Academy Team
Learn. Rise. Achieve.
Contact: 0341 034 9929`,

    fees:
`Assalam-o-Alaikum {NAME},

Course Fee Details:

- Web Development — Rs. 3,000/month
- Artificial Intelligence — Rs. 4,000/month

For enrollment and payment assistance:

WhatsApp: 0341 034 9929

Best regards,
Apex Learning Academy Team`,

    timing:
`Assalam-o-Alaikum {NAME},

Weekly Live Class Schedule:

- Monday — Coding: 6:00 PM to 8:00 PM
- Tuesday — AI: 6:00 PM to 8:00 PM
- Wednesday — Coding: 6:00 PM to 8:00 PM
- Thursday — AI: 6:00 PM to 8:00 PM
- Saturday — Doubt Session: 6:00 PM to 8:00 PM

For registration:
WhatsApp: 0341 034 9929`,

    enrollment:
`Assalam-o-Alaikum {NAME},

Enrollment Process:

1. Visit the Apex Learning Academy website.
2. Click Register Now.
3. Complete the registration form.
4. Our team will contact you.
5. Book your FREE demo class.
6. Complete the payment process.

For assistance:
WhatsApp: 0341 034 9929`,

    demo:
`Assalam-o-Alaikum {NAME},

Thank you for your interest in our FREE demo class.

To book your demo class, please contact our official WhatsApp:

0341 034 9929

Best regards,
Apex Learning Academy`,

    certificate:
`Assalam-o-Alaikum {NAME},

Certificate Details:

- Certificate issued after course completion.
- Attendance requirements apply.
- Certificate includes a unique verification ID.

For questions:
WhatsApp: 0341 034 9929

Best regards,
Apex Learning Academy`,

    technical:
`Assalam-o-Alaikum {NAME},

We apologize for the inconvenience.

Please send us a screenshot and explain the issue you are facing so our team can assist you.

WhatsApp:
0341 034 9929

Best regards,
Apex Learning Academy`,

    payment:
`Assalam-o-Alaikum {NAME},

Accepted Payment Options:

1. JazzCash
2. EasyPaisa
3. Bank Transfer

For payment assistance:
WhatsApp: 0341 034 9929

Best regards,
Apex Learning Academy`,

    batch:
`Assalam-o-Alaikum {NAME},

Our academy uses small learning batches to provide students with better interaction and support.

For current batch availability:
WhatsApp: 0341 034 9929

Best regards,
Apex Learning Academy`,

    refund:
`Assalam-o-Alaikum {NAME},

Please contact the academy administration team regarding your specific refund request.

WhatsApp:
0341 034 9929

Best regards,
Apex Learning Academy`

};


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = id =>
    document.getElementById(id);


function text(id, value) {

    const el = $(id);

    if (el) {
        el.textContent =
            value === undefined || value === null
                ? ''
                : String(value);
    }

}


function html(id, value) {

    const el = $(id);

    if (el) {
        el.innerHTML =
            value === undefined || value === null
                ? ''
                : String(value);
    }

}


function show(id) {

    const el = $(id);

    if (!el) return;

    el.hidden = false;
    el.classList.add('open');

    document.body.classList.add('apex-lock-scroll');

}


function hide(id) {

    const el = $(id);

    if (!el) return;

    el.hidden = true;
    el.classList.remove('open');

    /*
       Only unlock scroll if no other modal is open.
    */

    const anyOpen =
        document.querySelector(
            '.modal-backdrop.open, .jitsi-overlay:not([hidden])'
        );

    if (!anyOpen) {
        document.body.classList.remove('apex-lock-scroll');
    }

}


function on(id, event, handler) {

    const el = $(id);

    if (!el) return;

    el.addEventListener(event, handler);
}


function escapeHTML(value) {

    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


function safeJSON(value) {

    try {
        return JSON.stringify(value);
    } catch {
        return '';
    }

}


function formatDate(value) {

    if (!value) return '—';

    try {

        if (
            typeof value === 'object' &&
            typeof value.toDate === 'function'
        ) {
            return value.toDate().toLocaleString('en-GB');
        }

        if (
            typeof value === 'object' &&
            typeof value.seconds === 'number'
        ) {
            return new Date(
                value.seconds * 1000
            ).toLocaleString('en-GB');
        }

        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString('en-GB');
        }

    } catch {}

    return '—';
}


function normalize(value) {

    return String(value ?? '')
        .trim()
        .toLowerCase();

}


/* ============================================================
   TOAST
   ============================================================ */

let toastTimer = null;


function toast(message, error = false) {

    const el = $('toast');

    if (!el) return;

    el.textContent =
        String(message || 'Done');

    el.classList.remove('success', 'error');

    el.classList.add(
        error ? 'error' : 'success',
        'show'
    );

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            el.classList.remove('show');

        }, 4500);

}


/* ============================================================
   CONFIRMATION MODAL (NEW - replaces window.confirm)
   ============================================================ */

let confirmResolver = null;


function openConfirm({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    danger = true
} = {}) {

    return new Promise(resolve => {

        confirmResolver = resolve;

        text('confirmTitle', title);
        text('confirmMessage', message);

        const okBtn = $('confirmOkBtn');

        if (okBtn) {

            okBtn.classList.toggle('danger-btn', danger);
            okBtn.classList.toggle('gold-btn', !danger);

            okBtn.innerHTML = danger
                ? '<svg class="btn-icon"><use href="#i-trash"/></svg><span>' + escapeHTML(confirmText) + '</span>'
                : '<svg class="btn-icon"><use href="#i-check"/></svg><span>' + escapeHTML(confirmText) + '</span>';

        }

        show('confirmModal');

    });

}


function resolveConfirm(value) {

    const resolver = confirmResolver;

    confirmResolver = null;

    hide('confirmModal');

    if (typeof resolver === 'function') {
        resolver(value);
    }

}


on('confirmCancelBtn', 'click', () => resolveConfirm(false));
on('confirmOkBtn', 'click', () => resolveConfirm(true));


/* ============================================================
   AUDIT
   ============================================================ */

function audit(action, detail = '') {

    try {

        const existing =
            JSON.parse(
                localStorage.getItem(
                    'apex_admin_audit'
                ) || '[]'
            );

        const list =
            Array.isArray(existing)
                ? existing
                : [];

        list.unshift({

            action,

            detail,

            time:
                new Date().toISOString()

        });

        localStorage.setItem(
            'apex_admin_audit',
            JSON.stringify(list.slice(0, 100))
        );

    } catch {}

}


function renderActivityLog() {

    let list = [];

    try {

        list =
            JSON.parse(
                localStorage.getItem(
                    'apex_admin_audit'
                ) || '[]'
            );

    } catch {}

    if (!Array.isArray(list) || !list.length) {

        html(
            'activityLogContent',
            '<div class="empty-box">No activity recorded yet.</div>'
        );

        return;

    }

    html(
        'activityLogContent',
        `
        <div class="activity-log-list">
            ${list.map(entry => `
                <div class="activity-log-item">
                    <div class="activity-log-dot"></div>
                    <div class="activity-log-body">
                        <strong>${escapeHTML(entry.action || '')}</strong>
                        <span>${escapeHTML(entry.detail || '')}</span>
                        <small>${escapeHTML(formatDate(entry.time))}</small>
                    </div>
                </div>
            `).join('')}
        </div>
        `
    );

}


/* ============================================================
   AUTH
   ============================================================ */

on('adminLoginForm', 'submit', async event => {

    event.preventDefault();

    const email =
        $('adminEmail')?.value.trim();

    const password =
        $('adminPassword')?.value;

    const error =
        $('loginError');

    const button =
        $('adminLoginBtn');

    if (!email || !password) {

        if (error) {

            error.textContent =
                'Please enter email and password.';

            error.classList.add('show');

        }

        return;
    }

    if (button) {

        button.disabled = true;
        button.textContent = 'Logging in…';

    }

    if (error) {
        error.classList.remove('show');
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (err) {

        if (error) {

            error.textContent =
                'Login failed. Please check your credentials.';

            error.classList.add('show');

        }

        if (button) {

            button.disabled = false;
            button.textContent = 'Login to Admin Panel';

        }

    }

});


onAuthStateChanged(auth, async user => {

    state.currentUser = user || null;

    if (!user) {

        show('loginScreen');

        const panel = $('adminPanel');

        if (panel) {
            panel.hidden = true;
        }

        return;
    }


    if (user.uid !== ADMIN_UID) {

        await signOut(auth);

        const error = $('loginError');

        if (error) {

            error.textContent =
                'Access denied. This account is not an authorized academy administrator.';

            error.classList.add('show');

        }

        return;
    }


    hide('loginScreen');

    const panel = $('adminPanel');

    if (panel) {
        panel.hidden = false;
    }

    await initializeAdmin();

});


/* ============================================================
   LOGOUT
   ============================================================ */

async function performLogout() {

    const confirmed =
        await openConfirm({
            title: 'Logout from Admin Panel?',
            message:
                'You will be signed out of the Apex Learning Academy admin panel. Continue?',
            confirmText: 'Logout',
            danger: false
        });

    if (!confirmed) {
        return;
    }

    try {

        if (state.jitsi) {

            try { state.jitsi.dispose(); } catch {}

            state.jitsi = null;

        }

        await signOut(auth);

        window.location.reload();

    } catch {

        toast('Unable to logout right now.', true);

    }

}


on('adminLogoutBtn', 'click', performLogout);


/* ============================================================
   COURSE HELPERS
   ============================================================ */

function getStudentName(student) {

    return String(
        student?.fullName ??
        student?.name ??
        student?.studentName ??
        student?.displayName ??
        'Student'
    ).trim();

}


function getStudentEmail(student) {

    return String(
        student?.email ??
        student?.studentEmail ??
        ''
    ).trim();

}


function getStudentPhone(student) {

    return String(
        student?.whatsapp ??
        student?.phone ??
        student?.phoneNumber ??
        ''
    ).trim();

}


function getCourse(value) {

    const raw =
        String(
            value?.course ??
            value?.courseName ??
            value?.program ??
            value?.programName ??
            value?.subject ??
            value?.courseLabel ??
            ''
        ).trim();

    const lower = raw.toLowerCase();

    if (
        lower.includes('artificial') ||
        lower.includes('machine learning') ||
        lower === 'ai'
    ) {
        return 'Artificial Intelligence';
    }

    if (
        lower.includes('web') ||
        lower.includes('coding') ||
        lower.includes('python')
    ) {
        return 'Web Development';
    }

    return raw || 'Unassigned';

}


function courseMatches(item, filter) {

    if (!filter || filter === 'all') {
        return true;
    }

    const course = normalize(getCourse(item));

    if (filter === 'web') {
        return (
            course.includes('web') ||
            course.includes('coding')
        );
    }

    if (filter === 'ai') {
        return (
            course.includes('artificial') ||
            course === 'ai' ||
            course.includes('machine learning')
        );
    }

    return true;
}


/* ============================================================
   FIRESTORE LOAD
   ============================================================ */

async function loadCollection(key, showFailure = false) {

    const module = MODULES[key];

    if (!module) return [];

    try {

        const snapshot =
            await getDocs(
                collection(db, module.collection)
            );

        state.data[key] =
            snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

        return state.data[key];

    } catch (error) {

        state.data[key] = [];

        if (showFailure) {

            toast(
                `Could not load ${module.label}. Check Firestore rules.`,
                true
            );

        }

        return [];

    }

}


async function loadAllData() {

    text('syncStatus', 'Syncing Firebase…');

    const keys = Object.keys(MODULES);

    await Promise.all(
        keys.map(key => loadCollection(key, false))
    );

    updateNavigationCounts();
    renderDashboard();

    if (state.currentTab !== 'dashboard') {
        renderCurrentModule();
    }

    text(
        'syncStatus',
        `Synced • ${new Date().toLocaleTimeString()}`
    );

}


async function initializeAdmin() {

    setupEmailJS();
    setupEvents();

    const profileEmail = $('profileEmail');

    if (profileEmail && state.currentUser?.email) {
        profileEmail.textContent = state.currentUser.email;
    }

    await loadAllData();

    audit(
        'Admin login',
        state.currentUser?.email || ADMIN_NAME
    );

}


/* ============================================================
   EMAILJS
   ============================================================ */

function setupEmailJS() {

    if (
        !window.emailjs ||
        typeof window.emailjs.init !== 'function'
    ) {
        return;
    }

    try {

        window.emailjs.init({
            publicKey: EMAILJS_PUBLIC_KEY
        });

        window.__apexEmailReady = true;

    } catch {

        window.__apexEmailReady = false;

    }

}


async function ensureEmailJS() {

    if (
        window.emailjs &&
        typeof window.emailjs.send === 'function'
    ) {

        if (!window.__apexEmailReady) {
            setupEmailJS();
        }

        return true;

    }

    return new Promise(resolve => {

        let tries = 0;

        const timer = setInterval(() => {

            tries++;

            if (
                window.emailjs &&
                typeof window.emailjs.send === 'function'
            ) {

                clearInterval(timer);
                setupEmailJS();
                resolve(true);

                return;
            }

            if (tries >= 30) {

                clearInterval(timer);
                resolve(false);

            }

        }, 250);

    });

}


/* ============================================================
   EMAIL RECIPIENT NORMALIZATION
   ============================================================ */

function normalizeStudentRecipient(student) {

    return {
        id: student.id,
        uid: student.uid || student.userId || student.id,
        name: getStudentName(student),
        email: getStudentEmail(student),
        phone: getStudentPhone(student),
        course: getCourse(student),
        originalMessage: '',
        source: 'student'
    };

}


function normalizeMessageRecipient(message) {

    return {
        id: `message-${message.id}`,
        uid: message.uid || message.studentUid || message.userId || '',
        name:
            message.fullName ||
            message.name ||
            message.studentName ||
            'Student',
        email: message.email || message.studentEmail || '',
        phone: message.whatsapp || message.phone || '',
        course: getCourse(message),
        subject: message.subject || '',
        originalMessage:
            message.message ||
            message.body ||
            message.text ||
            message.query ||
            '',
        source: 'message',
        messageId: message.id
    };

}


function normalizeInstructorRecipient(item) {

    return {
        id: `instructor-${item.id}`,
        uid: item.uid || item.userId || item.id,
        name:
            item.fullName ||
            item.name ||
            item.instructorName ||
            'Instructor',
        email: item.email || item.instructorEmail || '',
        phone: item.phone || item.whatsapp || '',
        course: item.subject || item.position || '',
        subject: item.subject || item.position || '',
        originalMessage:
            item.message ||
            item.coverLetter ||
            item.description ||
            '',
        source: 'instructor',
        instructorId: item.id
    };

}


function getCommunicationRecipients() {

    let recipients = [];

    if (state.emailRecipientType === 'messages') {

        recipients =
            state.data.messages.map(normalizeMessageRecipient);

    } else if (state.emailRecipientType === 'instructors') {

        recipients =
            state.data.instructors.map(normalizeInstructorRecipient);

    } else {

        recipients =
            state.data.students.map(normalizeStudentRecipient);

    }

    const search =
        normalize($('emailRecipientSearch')?.value);

    recipients = recipients.filter(recipient => {

        const matchesSearch =
            !search ||
            normalize(`${recipient.name} ${recipient.email}`).includes(search);

        const matchesCourse =
            courseMatches(
                recipient,
                $('emailCourseFilter')?.value || 'all'
            );

        return matchesSearch && matchesCourse;

    });

    return recipients;

}


/* ============================================================
   EMAIL LOGGING
   ============================================================ */

async function saveEmailLog({
    recipient,
    subject,
    body,
    status,
    errorMessage = ''
}) {

    try {

        await addDoc(
            collection(db, 'emailLogs'),
            {
                recipient: recipient?.email || '',
                recipientName: recipient?.name || '',
                studentUid:
                    recipient?.source === 'student' ||
                    recipient?.source === 'message'
                        ? recipient?.uid || ''
                        : '',
                studentName:
                    recipient?.source === 'student' ||
                    recipient?.source === 'message'
                        ? recipient?.name || ''
                        : '',
                studentEmail:
                    recipient?.source === 'student' ||
                    recipient?.source === 'message'
                        ? recipient?.email || ''
                        : '',
                instructorUid:
                    recipient?.source === 'instructor'
                        ? recipient?.uid || ''
                        : '',
                instructorName:
                    recipient?.source === 'instructor'
                        ? recipient?.name || ''
                        : '',
                instructorEmail:
                    recipient?.source === 'instructor'
                        ? recipient?.email || ''
                        : '',
                subject,
                body,
                originalMessage: recipient?.originalMessage || '',
                course: recipient?.course || '',
                type:
                    recipient?.source === 'message'
                        ? 'student_reply'
                        : recipient?.source === 'instructor'
                            ? 'instructor_email'
                            : 'student_email',
                status,
                error: errorMessage,
                sentVia: 'EmailJS',
                sentBy: state.currentUser?.uid || ADMIN_UID,
                sentByEmail: state.currentUser?.email || '',
                createdAt: serverTimestamp(),
                sentAt: serverTimestamp()
            }
        );

        return true;

    } catch {

        return false;

    }

}


/* ============================================================
   SEND ONE EMAIL
   ============================================================ */

async function sendEmailToRecipient(recipient, subject, body) {

    const email =
        String(recipient?.email || '').trim();

    if (!email) {
        throw new Error('Recipient has no email address.');
    }

    const ready = await ensureEmailJS();

    if (!ready) {
        throw new Error('EmailJS is not available. Please refresh the page.');
    }

    const params = {
        to_email: email,
        to_name: recipient?.name || 'Student',
        subject,
        original_message: recipient?.originalMessage || '(No previous message)',
        reply_message: body,
        student_name: recipient?.name || 'Student',
        student_email: email
    };

    await window.emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        params
    );

    await saveEmailLog({
        recipient,
        subject,
        body,
        status: 'sent'
    });

    return true;

}


async function saveFailedEmail(recipient, subject, body, error) {

    await saveEmailLog({
        recipient,
        subject,
        body,
        status: 'failed',
        errorMessage:
            error?.text ||
            error?.message ||
            'Unknown EmailJS error'
    });

}


/* ============================================================
   PLACEHOLDERS
   ============================================================ */

function personalize(value, recipient) {

    return String(value || '')
        .replaceAll('{NAME}', recipient?.name || 'Student')
        .replaceAll('{COURSE}', recipient?.course || 'your course');

}


/* ============================================================
   REPLY MODAL
   ============================================================ */

function openReplyModal(recipient) {

    if (!recipient) return;

    state.replyRecipient = recipient;

    text(
        'replyModalTitle',
        recipient.source === 'instructor'
            ? 'Reply to Instructor'
            : 'Reply to Student'
    );

    text(
        'replyRecipientText',
        `${recipient.name} • ${recipient.email || 'No email'}`
    );

    const original =
        recipient.originalMessage ||
        'No previous message available.';

    html(
        'replyOriginalMessage',
        `
        <div class="original-title">Original Message</div>
        <div class="original-body">${escapeHTML(original)}</div>
        `
    );

    const subjectInput = $('replySubject');

    if (subjectInput) {
        subjectInput.value =
            recipient.subject ||
            'Response from Apex Learning Academy';
    }

    const template = $('replyTemplate');
    if (template) template.value = '';

    const message = $('replyMessage');
    if (message) message.value = '';

    text('replyStatus', '');

    show('replyModal');

}


async function sendReply() {

    const recipient = state.replyRecipient;

    if (!recipient) {
        toast('No recipient selected.', true);
        return;
    }

    const subject =
        String($('replySubject')?.value || '').trim();

    const body =
        String($('replyMessage')?.value || '').trim();

    if (!recipient.email) {
        toast('This record does not contain an email address.', true);
        return;
    }

    if (!subject) {
        toast('Subject is required.', true);
        return;
    }

    if (!body) {
        toast('Message is required.', true);
        return;
    }

    const button = $('sendReplyBtn');

    if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
    }

    text('replyStatus', 'Sending email…');

    try {

        const finalSubject = personalize(subject, recipient);
        const finalBody = personalize(body, recipient);

        await sendEmailToRecipient(recipient, finalSubject, finalBody);

        if (
            recipient.source === 'message' &&
            recipient.messageId
        ) {

            try {

                await updateDoc(
                    doc(db, 'messages', recipient.messageId),
                    {
                        replied: true,
                        repliedAt: serverTimestamp(),
                        repliedBy: state.currentUser?.uid || ADMIN_UID,
                        lastReplySubject: finalSubject,
                        lastReply: finalBody
                    }
                );

            } catch {}

        }

        await loadCollection('messages');
        await loadCollection('emailLogs');

        audit(
            'Email sent',
            `${recipient.email} — ${finalSubject}`
        );

        text('replyStatus', 'Email sent successfully.');

        toast(`Reply sent to ${recipient.name}.`);

        setTimeout(() => hide('replyModal'), 900);

    } catch (error) {

        await saveFailedEmail(recipient, subject, body, error);

        text(
            'replyStatus',
            error?.text || error?.message || 'Email could not be sent.'
        );

        toast('Email failed. Check Email Logs.', true);

    } finally {

        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<svg class="btn-icon"><use href="#i-send"/></svg><span>Send Email</span>';
        }

    }

}


/* ============================================================
   WHATSAPP
   ============================================================ */

function openWhatsApp(recipient, message = '') {

    const phone =
        String(recipient?.phone || '').replace(/\D/g, '');

    if (!phone) {
        toast('No WhatsApp number is available.', true);
        return;
    }

    const body = personalize(
        message ||
        'Assalam-o-Alaikum {NAME},\n\nApex Learning Academy is contacting you.',
        recipient
    );

    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;

    window.open(url, '_blank', 'noopener,noreferrer');

}


/* ============================================================
   EMAIL CENTER
   ============================================================ */

function renderEmailRecipients() {

    const recipients = getCommunicationRecipients();
    const container = $('emailRecipients');

    if (!container) return;

    if (!recipients.length) {

        container.innerHTML =
            '<div class="empty-box">No matching recipients found.</div>';

        updateSelectedCount();
        return;

    }

    container.innerHTML = recipients.map(recipient => {

        const selected =
            state.selectedRecipients.has(recipient.id);

        const initial =
            String(recipient.name || 'S').charAt(0).toUpperCase();

        return `
        <label
            class="recipient-row"
            data-recipient-id="${escapeHTML(recipient.id)}"
        >
            <input
                type="checkbox"
                class="recipient-check"
                data-recipient="${escapeHTML(recipient.id)}"
                ${selected ? 'checked' : ''}
            >
            <span class="recipient-avatar">${escapeHTML(initial)}</span>
            <span class="recipient-info">
                <strong>${escapeHTML(recipient.name)}</strong>
                <small>${escapeHTML(recipient.email || 'No email')}</small>
                <small>${escapeHTML(recipient.course || '')}</small>
            </span>
            ${recipient.originalMessage
                ? '<span class="message-indicator">MSG</span>'
                : ''}
        </label>
        `;

    }).join('');

    container
        .querySelectorAll('.recipient-check')
        .forEach(checkbox => {

            checkbox.addEventListener('change', event => {

                const id = event.target.dataset.recipient;

                if (event.target.checked) {
                    state.selectedRecipients.add(id);
                } else {
                    state.selectedRecipients.delete(id);
                }

                updateSelectedCount();

            });

        });

    updateSelectedCount();

}


function updateSelectedCount() {

    text(
        'selectedRecipientCount',
        `${state.selectedRecipients.size} selected`
    );

}


function openEmailCenter() {

    state.emailRecipientType = 'students';
    state.selectedRecipients.clear();

    const type = $('emailRecipientType');
    if (type) type.value = 'students';

    renderEmailRecipients();

    show('emailCenterModal');

}


async function sendBulkEmails() {

    const recipients =
        getCommunicationRecipients().filter(
            recipient =>
                state.selectedRecipients.has(recipient.id) &&
                recipient.email
        );

    if (!recipients.length) {
        toast(
            'Select at least one recipient with an email address.',
            true
        );
        return;
    }

    const subject =
        String($('bulkEmailSubject')?.value || '').trim();

    const body =
        String($('bulkEmailMessage')?.value || '').trim();

    if (!subject) {
        toast('Email subject is required.', true);
        return;
    }

    if (!body) {
        toast('Email message is required.', true);
        return;
    }

    const button = $('sendBulkEmailBtn');

    if (button) {
        button.disabled = true;
        button.textContent = `Sending 0/${recipients.length}…`;
    }

    let sent = 0;
    let failed = 0;

    try {

        for (let index = 0; index < recipients.length; index++) {

            const recipient = recipients[index];

            const finalSubject = personalize(subject, recipient);
            const finalBody = personalize(body, recipient);

            try {

                await sendEmailToRecipient(
                    recipient,
                    finalSubject,
                    finalBody
                );

                sent++;

            } catch (error) {

                failed++;

                await saveFailedEmail(
                    recipient,
                    finalSubject,
                    finalBody,
                    error
                );

            }

            if (button) {
                button.textContent =
                    `Sending ${index + 1}/${recipients.length}…`;
            }

            await new Promise(resolve =>
                setTimeout(resolve, 180)
            );

        }

        await loadCollection('emailLogs');

        state.selectedRecipients.clear();
        updateSelectedCount();

        audit('Bulk email', `${sent} sent, ${failed} failed`);

        if (failed) {

            text(
                'bulkEmailStatus',
                `${sent} sent • ${failed} failed.`
            );

            toast(
                `${sent} sent • ${failed} failed. Check Email Logs.`,
                true
            );

        } else {

            text(
                'bulkEmailStatus',
                `${sent} email(s) sent successfully.`
            );

            toast(`${sent} email(s) sent successfully.`);

        }

    } finally {

        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<svg class="btn-icon"><use href="#i-send"/></svg><span>Send to Selected</span>';
        }

    }

}


/* ============================================================
   TEMPLATE LOADERS
   ============================================================ */

function applyBulkTemplate() {

    const key = $('bulkEmailTemplate')?.value;

    if (!key) return;

    const template = EMAIL_TEMPLATES[key];

    if (!template) return;

    const subject = $('bulkEmailSubject');
    const message = $('bulkEmailMessage');

    if (subject) subject.value = template.subject;
    if (message) message.value = template.body;

}


function applyReplyTemplate() {

    const key = $('replyTemplate')?.value;

    if (!key) return;

    const template = REPLY_TEMPLATES[key];

    if (!template) return;

    const recipient = state.replyRecipient;

    const message = personalize(template, recipient);

    const subject = $('replySubject');
    const textarea = $('replyMessage');

    if (subject) {

        const subjects = {
            thanks: 'Thank You for Contacting Apex Learning Academy',
            fees: 'Course Fee Details — Apex Learning Academy',
            timing: 'Class Schedule — Apex Learning Academy',
            enrollment: 'Enrollment Process — Apex Learning Academy',
            demo: 'Free Demo Class — Apex Learning Academy',
            certificate: 'Certificate Information — Apex Learning Academy',
            technical: 'Technical Support — Apex Learning Academy',
            payment: 'Payment Information — Apex Learning Academy',
            batch: 'Batch Information — Apex Learning Academy',
            refund: 'Refund Request — Apex Learning Academy'
        };

        subject.value =
            subjects[key] ||
            'Response from Apex Learning Academy';

    }

    if (textarea) textarea.value = message;

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function switchTab(tab) {

    if (tab !== 'dashboard' && !MODULES[tab]) {
        return;
    }

    state.currentTab = tab;

    document
        .querySelectorAll('.nav-item')
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.tab === tab
            );

        });

    const dashboard = $('dashboardView');
    const module = $('moduleView');

    if (tab === 'dashboard') {

        if (dashboard) dashboard.hidden = false;
        if (module) module.hidden = true;

        text('pageTitle', 'Dashboard');

        renderDashboard();

    } else {

        if (dashboard) dashboard.hidden = true;
        if (module) module.hidden = false;

        text('pageTitle', MODULES[tab]?.label || 'Administration');

        renderCurrentModule();

    }

    closeMobileSidebar();

}


function openEmailLogs() {

    hide('emailCenterModal');

    switchTab('emailLogs');

}


/* ============================================================
   COUNTS
   ============================================================ */

function updateNavigationCounts() {

    const map = {
        students: 'navStudents',
        fees: 'navFees',
        progress: 'navProgress',
        attendance: 'navAttendance',
        tests: 'navTests',
        certificates: 'navCertificates',
        messages: 'navMessages',
        instructors: 'navInstructors',
        reviews: 'navReviews',
        coupons: 'navCoupons',
        liveClasses: 'navLiveClasses',
        announcements: 'navAnnouncements',
        visitors: 'navVisitors',
        visits: 'navVisits',
        emailLogs: 'navEmailLogs'
    };

    Object.entries(map).forEach(([key, id]) => {
        text(id, state.data[key]?.length || 0);
    });

    text('statStudents', state.data.students.length);
    text('statFees', state.data.fees.length);
    text('statProgress', state.data.progress.length);
    text('statAttendance', state.data.attendance.length);
    text('statTests', state.data.tests.length);
    text('statCertificates', state.data.certificates.length);
    text('statMessages', state.data.messages.length);
    text('statInstructors', state.data.instructors.length);
    text('snapshotMessages', state.data.messages.length);

    const sent = state.data.emailLogs.filter(
        item => normalize(item.status) === 'sent'
    ).length;

    const failed = state.data.emailLogs.filter(
        item => normalize(item.status) === 'failed'
    ).length;

    text('snapshotSent', sent);
    text('snapshotFailed', failed);

}


/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {

    updateNavigationCounts();

    const rows = [
        ['Students', state.data.students.length, 'Registered learners', 'students'],
        ['Fees', state.data.fees.length, 'Fee records', 'fees'],
        ['Messages', state.data.messages.length, 'Student enquiries', 'messages'],
        ['Course Progress', state.data.progress.length, 'Progress records', 'progress'],
        ['Tests', state.data.tests.length, 'Submitted assessments', 'tests'],
        ['Attendance', state.data.attendance.length, 'Attendance events', 'attendance'],
        ['Certificates', state.data.certificates.length, 'Certificate records', 'certificates'],
        ['Instructors', state.data.instructors.length, 'Instructor applications', 'instructors'],
        ['Reviews', state.data.reviews.length, 'Student reviews', 'reviews'],
        ['Announcements', state.data.announcements.length, 'Published announcements', 'announcements']
    ];

    html('overviewTable', `
        <div class="overview-table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Area</th>
                        <th>Records</th>
                        <th>Description</th>
                        <th>Open</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td><strong>${escapeHTML(row[0])}</strong></td>
                            <td><span class="record-number">${row[1]}</span></td>
                            <td>${escapeHTML(row[2])}</td>
                            <td>
                                <button
                                    class="table-btn"
                                    data-open-tab="${escapeHTML(row[3])}"
                                    type="button"
                                >
                                    Manage
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `);

    document
        .querySelectorAll('#overviewTable [data-open-tab]')
        .forEach(button => {

            button.addEventListener('click', () =>
                switchTab(button.dataset.openTab)
            );

        });

}


/* ============================================================
   CURRENT MODULE
   ============================================================ */

function getFilteredModuleData() {

    let list = state.data[state.currentTab] || [];

    if (state.currentTab === 'liveClasses' && !list.length) {
        list = DEFAULT_SCHEDULE;
    }

    if (state.course !== 'all') {
        list = list.filter(item =>
            courseMatches(item, state.course)
        );
    }

    const search = normalize(state.search);

    if (search) {
        list = list.filter(item =>
            normalize(safeJSON(item)).includes(search)
        );
    }

    return list;

}


function renderCurrentModule() {

    const list = getFilteredModuleData();

    renderModuleStats(list);

    const renderers = {
        students: renderStudents,
        fees: renderFees,
        progress: renderProgress,
        attendance: renderAttendance,
        tests: renderTests,
        certificates: renderCertificates,
        messages: renderMessages,
        instructors: renderInstructors,
        reviews: renderReviews,
        coupons: renderCoupons,
        liveClasses: renderLiveClasses,
        announcements: renderAnnouncements,
        visitors: renderVisitors,
        visits: renderVisits,
        emailLogs: renderEmailLogs
    };

    const renderer = renderers[state.currentTab];

    if (renderer) {
        renderer(list);
    } else {
        renderGeneric(list);
    }

}


/* ============================================================
   MODULE STATS
   ============================================================ */

function renderModuleStats(list) {

    const tab = state.currentTab;

    let extra = '';

    if (tab === 'students') {

        const web = state.data.students.filter(
            x => courseMatches(x, 'web')
        ).length;

        const ai = state.data.students.filter(
            x => courseMatches(x, 'ai')
        ).length;

        extra = `
            <div>
                <strong>${web}</strong>
                <span>Web Development</span>
            </div>
            <div>
                <strong>${ai}</strong>
                <span>Artificial Intelligence</span>
            </div>
        `;

    }

    if (tab === 'emailLogs') {

        const sent = list.filter(
            x => normalize(x.status) === 'sent'
        ).length;

        const failed = list.filter(
            x => normalize(x.status) === 'failed'
        ).length;

        extra = `
            <div class="mini-success">
                <strong>${sent}</strong>
                <span>Sent</span>
            </div>
            <div class="mini-failed">
                <strong>${failed}</strong>
                <span>Failed</span>
            </div>
        `;

    }

    html('moduleStats', `
        <div>
            <strong>${list.length}</strong>
            <span>Showing Records</span>
        </div>
        ${extra}
    `);

}


/* ============================================================
   STUDENTS
   ============================================================ */

function renderStudents(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>WhatsApp</th>
                        <th>Course</th>
                        <th>City</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(student => {
                            const status = student.status || 'pending';
                            return `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(getStudentName(student))}</strong>
                                    ${student.couponCode
                                        ? `<small class="table-note">Coupon: ${escapeHTML(student.couponCode)}</small>`
                                        : ''}
                                </td>
                                <td>${escapeHTML(getStudentEmail(student) || '—')}</td>
                                <td>${escapeHTML(getStudentPhone(student) || '—')}</td>
                                <td><span class="course-pill">${escapeHTML(getCourse(student))}</span></td>
                                <td>${escapeHTML(student.city || '—')}</td>
                                <td>${statusBadge(status)}</td>
                                <td class="actions">
                                    <button class="table-btn" data-view-id="${escapeHTML(student.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                    ${getStudentEmail(student)
                                        ? `<button class="table-btn gold" data-reply-student="${escapeHTML(student.id)}">
                                            <svg class="table-icon"><use href="#i-send"/></svg>
                                            Email
                                        </button>`
                                        : ''}
                                    ${getStudentPhone(student)
                                        ? `<button class="table-btn whatsapp" data-whatsapp-student="${escapeHTML(student.id)}">
                                            <svg class="table-icon"><use href="#i-whatsapp"/></svg>
                                            WhatsApp
                                        </button>`
                                        : ''}
                                    <button class="table-btn danger" data-delete-tab="students" data-delete-id="${escapeHTML(student.id)}">
                                        <svg class="table-icon"><use href="#i-trash"/></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No students found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   FEES
   ============================================================ */

function renderFees(list) {

    const students = state.data.students;

    const counts = { paid: 0, pending: 0, unpaid: 0 };

    students.forEach(student => {

        const fee = state.data.fees.find(
            item => item.studentUid === student.uid
        );

        if (normalize(fee?.status) === 'paid') {
            counts.paid++;
        } else if (normalize(fee?.status) === 'pending') {
            counts.pending++;
        } else {
            counts.unpaid++;
        }

    });

    html('moduleContent', `
        <div class="fee-summary">
            <div class="fee-paid">
                <strong>${counts.paid}</strong>
                <span>Paid</span>
            </div>
            <div class="fee-pending">
                <strong>${counts.pending}</strong>
                <span>Pending</span>
            </div>
            <div class="fee-unpaid">
                <strong>${counts.unpaid}</strong>
                <span>Unpaid</span>
            </div>
        </div>

        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Fee Record</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.length
                        ? students.map(student => {

                            const fee = state.data.fees.find(
                                item => item.studentUid === student.uid
                            );

                            const status = fee?.status || 'unpaid';

                            return `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(getStudentName(student))}</strong>
                                    <small class="table-note">${escapeHTML(getStudentEmail(student))}</small>
                                </td>
                                <td>${escapeHTML(getCourse(student))}</td>
                                <td>${fee
                                    ? escapeHTML(fee.amount || fee.monthlyFee || fee.total || 'Record exists')
                                    : 'No fee record'
                                }</td>
                                <td>${statusBadge(status)}</td>
                                <td>${formatDate(fee?.paidAt || fee?.createdAt)}</td>
                                <td class="actions">
                                    <button class="table-btn" data-view-id="${escapeHTML(student.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                    ${getStudentEmail(student)
                                        ? `<button class="table-btn gold" data-reply-student="${escapeHTML(student.id)}">
                                            <svg class="table-icon"><use href="#i-send"/></svg>
                                            Email
                                        </button>`
                                        : ''}
                                </td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No student records available.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   MESSAGES
   ============================================================ */

function renderMessages(list) {

    const sorted = [...list].sort(
        (a, b) => getTime(b) - getTime(a)
    );

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length
                        ? sorted.map(message => {

                            const recipient =
                                normalizeMessageRecipient(message);

                            return `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(recipient.name)}</strong>
                                    <small class="table-note">${escapeHTML(recipient.course)}</small>
                                </td>
                                <td>${escapeHTML(recipient.email || '—')}</td>
                                <td>${escapeHTML(message.subject || '—')}</td>
                                <td><span class="message-preview">${escapeHTML(recipient.originalMessage)}</span></td>
                                <td>${message.replied
                                    ? statusBadge('replied')
                                    : statusBadge('unread')
                                }</td>
                                <td>${formatDate(message.createdAt || message.timestamp || message.date)}</td>
                                <td class="actions">
                                    <button class="table-btn" data-message-reply="${escapeHTML(message.id)}">
                                        <svg class="table-icon"><use href="#i-reply"/></svg>
                                        Reply
                                    </button>
                                    <button class="table-btn" data-message-view="${escapeHTML(message.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                    <button class="table-btn danger" data-delete-tab="messages" data-delete-id="${escapeHTML(message.id)}">
                                        <svg class="table-icon"><use href="#i-trash"/></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No student messages found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   INSTRUCTORS
   ============================================================ */

function renderInstructors(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Applicant</th>
                        <th>Email</th>
                        <th>Position / Subject</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => {

                            const recipient =
                                normalizeInstructorRecipient(item);

                            return `
                            <tr>
                                <td><strong>${escapeHTML(recipient.name)}</strong></td>
                                <td>${escapeHTML(recipient.email || '—')}</td>
                                <td>${escapeHTML(recipient.course || '—')}</td>
                                <td>${statusBadge(item.status || 'pending')}</td>
                                <td>${formatDate(item.createdAt || item.submittedAt)}</td>
                                <td class="actions">
                                    <button class="table-btn" data-instructor-view="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                    ${recipient.email
                                        ? `<button class="table-btn gold" data-instructor-reply="${escapeHTML(item.id)}">
                                            <svg class="table-icon"><use href="#i-reply"/></svg>
                                            Reply
                                        </button>`
                                        : ''}
                                    <button class="table-btn danger" data-delete-tab="instructors" data-delete-id="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-trash"/></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No instructor applications found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   EMAIL LOGS
   ============================================================ */

function renderEmailLogs(list) {

    const sorted = [...list].sort(
        (a, b) => getTime(b) - getTime(a)
    );

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Original Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length
                        ? sorted.map(logItem => `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(logItem.recipientName || '—')}</strong>
                                    <small class="table-note">${escapeHTML(logItem.recipient || logItem.studentEmail || logItem.instructorEmail || '—')}</small>
                                </td>
                                <td>${escapeHTML(logItem.type || 'email')}</td>
                                <td>${escapeHTML(logItem.subject || '—')}</td>
                                <td>${emailStatusBadge(logItem.status)}</td>
                                <td><span class="message-preview">${escapeHTML(logItem.originalMessage || '—')}</span></td>
                                <td>${formatDate(logItem.sentAt || logItem.createdAt)}</td>
                            </tr>
                        `).join('')
                        : emptyRow('No email logs found yet.')
                    }
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   TESTS
   ============================================================ */

function renderTests(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Result</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(item.studentName || item.name || '—')}</strong>
                                    <small class="table-note">${escapeHTML(item.email || item.studentEmail || '')}</small>
                                </td>
                                <td>${escapeHTML(getCourse(item))}</td>
                                <td>${escapeHTML(item.testName || item.title || item.test || '—')}</td>
                                <td>${escapeHTML(item.score ?? item.marks ?? '—')}</td>
                                <td>${statusBadge(item.result || item.status || 'pending')}</td>
                                <td>${formatDate(item.createdAt || item.submittedAt || item.date)}</td>
                                <td>
                                    <button class="table-btn" data-test-view="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                </td>
                            </tr>
                        `).join('')
                        : emptyRow('No test submissions found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   CERTIFICATES
   ============================================================ */

function renderCertificates(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Certificate ID</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Issued</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td><strong>${escapeHTML(item.studentName || item.name || '—')}</strong></td>
                                <td><code>${escapeHTML(item.certificateId || item.idNumber || item.id || '—')}</code></td>
                                <td>${escapeHTML(getCourse(item))}</td>
                                <td>${statusBadge(item.status || 'valid')}</td>
                                <td>${formatDate(item.issuedAt || item.createdAt)}</td>
                                <td>
                                    <button class="table-btn" data-certificate-view="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                </td>
                            </tr>
                        `).join('')
                        : emptyRow('No certificates found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   ATTENDANCE
   ============================================================ */

function renderAttendance(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Left</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td><strong>${escapeHTML(item.studentName || item.name || '—')}</strong></td>
                                <td>${escapeHTML(item.className || item.title || '—')}</td>
                                <td>${escapeHTML(getCourse(item))}</td>
                                <td>${statusBadge(item.status || 'present')}</td>
                                <td>${formatDate(item.joinedAt)}</td>
                                <td>${formatDate(item.leftAt || item.endedAt)}</td>
                            </tr>
                        `).join('')
                        : emptyRow('No attendance records found.')
                    }
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   PROGRESS
   ============================================================ */

function renderProgress(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => {

                            const progress = Number(
                                item.progress ??
                                item.percentage ??
                                item.percent ??
                                0
                            );

                            const safeProgress = Math.max(
                                0,
                                Math.min(
                                    100,
                                    Number.isFinite(progress) ? progress : 0
                                )
                            );

                            return `
                            <tr>
                                <td><strong>${escapeHTML(item.studentName || item.name || '—')}</strong></td>
                                <td>${escapeHTML(getCourse(item))}</td>
                                <td>
                                    <div class="progress-wrap">
                                        <div class="progress-bar">
                                            <span style="width:${safeProgress}%"></span>
                                        </div>
                                        <strong>${safeProgress}%</strong>
                                    </div>
                                </td>
                                <td>${formatDate(item.updatedAt || item.createdAt)}</td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No progress records found.')
                    }
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   REVIEWS
   ============================================================ */

function renderReviews(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Rating</th>
                        <th>Review</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => {
                            const rating = Math.max(
                                0,
                                Math.min(5, Number(item.rating || 0))
                            );
                            return `
                            <tr>
                                <td><strong>${escapeHTML(item.studentName || item.name || 'Student')}</strong></td>
                                <td class="stars">${'★'.repeat(rating)}</td>
                                <td><span class="message-preview">${escapeHTML(item.review || item.message || item.text || '')}</span></td>
                                <td>${statusBadge(item.status || (item.approved ? 'approved' : 'pending'))}</td>
                                <td>${formatDate(item.createdAt || item.date)}</td>
                                <td>
                                    <button class="table-btn" data-review-view="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-eye"/></svg>
                                        View
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')
                        : emptyRow('No reviews found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   COUPONS
   ============================================================ */

function renderCoupons(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Discount</th>
                        <th>Status</th>
                        <th>Uses</th>
                        <th>Expiry</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td><code>${escapeHTML(item.code || item.couponCode || '—')}</code></td>
                                <td>${escapeHTML(item.discount ?? item.percentage ?? '—')}%</td>
                                <td>${statusBadge(item.status || 'active')}</td>
                                <td>${escapeHTML(item.usedCount ?? item.uses ?? 0)}</td>
                                <td>${formatDate(item.expiresAt || item.expiry)}</td>
                                <td>
                                    <button class="table-btn danger" data-delete-tab="coupons" data-delete-id="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-trash"/></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')
                        : emptyRow('No coupons found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   ANNOUNCEMENTS
   ============================================================ */

function renderAnnouncements(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td><strong>${escapeHTML(item.title || 'Announcement')}</strong></td>
                                <td><span class="message-preview">${escapeHTML(item.message || item.body || '')}</span></td>
                                <td>${escapeHTML(getCourse(item))}</td>
                                <td>${statusBadge(item.status || (item.published ? 'published' : 'draft'))}</td>
                                <td>${formatDate(item.createdAt || item.publishedAt)}</td>
                                <td>
                                    <button class="table-btn danger" data-delete-tab="announcements" data-delete-id="${escapeHTML(item.id)}">
                                        <svg class="table-icon"><use href="#i-trash"/></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')
                        : emptyRow('No announcements found.')
                    }
                </tbody>
            </table>
        </div>
    `);

    bindTableActions();

}


/* ============================================================
   LIVE CLASSES
   ============================================================ */

function renderLiveClasses(list) {

    const classes = list.length ? list : DEFAULT_SCHEDULE;

    html('moduleContent', `
        <div class="live-class-grid">
            ${classes.map(item => `
                <article class="live-card">
                    <div class="live-card-top">
                        <span class="live-label">${escapeHTML(item.subjectLabel || item.subject || 'LIVE CLASS')}</span>
                        <span class="course-pill">${escapeHTML(item.day || '')}</span>
                    </div>
                    <h3>${escapeHTML(item.title || 'Live Class')}</h3>
                    <p>${escapeHTML(item.time || '')}</p>
                    <small>Room: ${escapeHTML(item.roomName || '')}</small>
                    <button
                        class="gold-btn full"
                        data-start-class="${escapeHTML(item.id)}"
                        type="button"
                    >
                        <svg class="btn-icon"><use href="#i-live"/></svg>
                        <span>Start Host Class</span>
                    </button>
                </article>
            `).join('')}
        </div>
    `);

    document
        .querySelectorAll('[data-start-class]')
        .forEach(button => {

            button.addEventListener('click', () =>
                startLiveClassById(button.dataset.startClass)
            );

        });

}


/* ============================================================
   VISITORS
   ============================================================ */

function renderVisitors(list) {

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Visitor</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Browser</th>
                        <th>Visits</th>
                        <th>First Visit</th>
                        <th>Last Visit</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length
                        ? list.map(item => `
                            <tr>
                                <td>${escapeHTML(item.visitorId || item.id)}</td>
                                <td>${escapeHTML([item.city, item.country].filter(Boolean).join(', ') || '—')}</td>
                                <td>${escapeHTML(item.device || '—')}</td>
                                <td>${escapeHTML(item.browser || '—')}</td>
                                <td>${escapeHTML(item.totalVisits ?? 1)}</td>
                                <td>${formatDate(item.firstVisit)}</td>
                                <td>${formatDate(item.lastVisit)}</td>
                            </tr>
                        `).join('')
                        : emptyRow('No visitors found.')
                    }
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   VISITS
   ============================================================ */

function renderVisits(list) {

    const sorted = [...list].sort(
        (a, b) => getTime(b) - getTime(a)
    );

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Browser</th>
                        <th>Referrer</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length
                        ? sorted.slice(0, 500).map(item => `
                            <tr>
                                <td><span class="message-preview">${escapeHTML(item.page || '—')}</span></td>
                                <td>${escapeHTML([item.city, item.country].filter(Boolean).join(', ') || '—')}</td>
                                <td>${escapeHTML(item.device || '—')}</td>
                                <td>${escapeHTML(item.browser || '—')}</td>
                                <td><span class="message-preview">${escapeHTML(item.referrer || 'Direct')}</span></td>
                                <td>${formatDate(item.timestamp || item.createdAt)}</td>
                            </tr>
                        `).join('')
                        : emptyRow('No visits found.')
                    }
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   GENERIC
   ============================================================ */

function renderGeneric(list) {

    if (!list.length) {

        html('moduleContent', `
            <div class="empty-box">No records found.</div>
        `);

        return;

    }

    const keys = Object.keys(list[0])
        .filter(key => key !== 'id')
        .slice(0, 7);

    html('moduleContent', `
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        ${keys.map(key =>
                            `<th>${escapeHTML(key)}</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${list.map(item => `
                        <tr>
                            ${keys.map(key => `
                                <td>${escapeHTML(
                                    typeof item[key] === 'object'
                                        ? formatDate(item[key])
                                        : item[key]
                                )}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `);

}


/* ============================================================
   HELPERS FOR TABLES
   ============================================================ */

function emptyRow(message) {

    return `
        <tr>
            <td colspan="20">
                <div class="empty-inline">${escapeHTML(message)}</div>
            </td>
        </tr>
    `;

}


function statusBadge(status) {

    const value = String(status || 'pending').trim();
    const normalized = normalize(value).replaceAll(' ', '-');

    return `
        <span class="badge ${escapeHTML(normalized)}">
            ${escapeHTML(value)}
        </span>
    `;

}


function emailStatusBadge(status) {

    const normalized = normalize(status);

    const cls =
        normalized === 'sent'
            ? 'sent'
            : normalized === 'failed'
                ? 'failed'
                : 'pending';

    return `
        <span class="email-status ${cls}">
            ${escapeHTML(status || 'pending')}
        </span>
    `;

}


function getTime(item) {

    const value =
        item?.createdAt ||
        item?.timestamp ||
        item?.submittedAt ||
        item?.date ||
        item?.sentAt;

    if (value && typeof value.seconds === 'number') {
        return value.seconds;
    }

    const date = new Date(value || 0);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();

}


/* ============================================================
   TABLE ACTIONS
   ============================================================ */

function bindTableActions() {

    document
        .querySelectorAll('[data-delete-tab]')
        .forEach(button => {

            button.addEventListener('click', () =>
                deleteRecord(
                    button.dataset.deleteTab,
                    button.dataset.deleteId
                )
            );

        });

    document
        .querySelectorAll('[data-view-id]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data[state.currentTab]
                    ?.find(x => x.id === button.dataset.viewId);

                if (item) openDetail(item, state.currentTab);

            });

        });

    document
        .querySelectorAll('[data-reply-student]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const student = state.data.students.find(
                    x => x.id === button.dataset.replyStudent
                );

                if (student) {
                    openReplyModal(normalizeStudentRecipient(student));
                }

            });

        });

    document
        .querySelectorAll('[data-whatsapp-student]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const student = state.data.students.find(
                    x => x.id === button.dataset.whatsappStudent
                );

                if (student) {
                    openWhatsApp(normalizeStudentRecipient(student));
                }

            });

        });

    document
        .querySelectorAll('[data-message-reply]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const message = state.data.messages.find(
                    x => x.id === button.dataset.messageReply
                );

                if (message) {
                    openReplyModal(normalizeMessageRecipient(message));
                }

            });

        });

    document
        .querySelectorAll('[data-message-view]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const message = state.data.messages.find(
                    x => x.id === button.dataset.messageView
                );

                if (message) openDetail(message, 'messages');

            });

        });

    document
        .querySelectorAll('[data-instructor-reply]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data.instructors.find(
                    x => x.id === button.dataset.instructorReply
                );

                if (item) {
                    openReplyModal(normalizeInstructorRecipient(item));
                }

            });

        });

    document
        .querySelectorAll('[data-instructor-view]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data.instructors.find(
                    x => x.id === button.dataset.instructorView
                );

                if (item) openDetail(item, 'instructors');

            });

        });

    document
        .querySelectorAll('[data-test-view]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data.tests.find(
                    x => x.id === button.dataset.testView
                );

                if (item) openDetail(item, 'tests');

            });

        });

    document
        .querySelectorAll('[data-certificate-view]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data.certificates.find(
                    x => x.id === button.dataset.certificateView
                );

                if (item) openDetail(item, 'certificates');

            });

        });

    document
        .querySelectorAll('[data-review-view]')
        .forEach(button => {

            button.addEventListener('click', () => {

                const item = state.data.reviews.find(
                    x => x.id === button.dataset.reviewView
                );

                if (item) openDetail(item, 'reviews');

            });

        });

}


/* ============================================================
   DETAIL MODAL
   ============================================================ */

function openDetail(item, type) {

    const keys = Object.keys(item);

    html('detailModalContent', `
        <div class="modal-heading">
            <span class="modal-kicker">${escapeHTML(MODULES[type]?.label || type)}</span>
            <h2>Record Details</h2>
        </div>
        <div class="detail-grid">
            ${keys.map(key => {

                const value = item[key];
                let display = '—';

                if (value !== null && value !== undefined) {

                    if (typeof value === 'object') {

                        display = formatDate(value);

                        if (display === '—') {
                            display = safeJSON(value);
                        }

                    } else {
                        display = String(value);
                    }

                }

                return `
                    <div class="detail-item">
                        <span>${escapeHTML(key)}</span>
                        <strong>${escapeHTML(display)}</strong>
                    </div>
                `;

            }).join('')}
        </div>
    `);

    show('detailModal');

}


/* ============================================================
   DELETE (uses new custom confirmation modal)
   ============================================================ */

async function deleteRecord(tab, id) {

    const module = MODULES[tab];

    if (!module || !id) return;

    const confirmed = await openConfirm({
        title: `Delete ${module.label} Record?`,
        message:
            'This action cannot be undone. The record will be permanently removed from the database.',
        confirmText: 'Delete Record',
        danger: true
    });

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(db, module.collection, id)
        );

        state.data[tab] =
            state.data[tab].filter(item => item.id !== id);

        updateNavigationCounts();
        renderCurrentModule();

        audit('Record deleted', `${tab}/${id}`);

        toast(`${module.label} record deleted.`);

    } catch (error) {

        toast(`Delete failed: ${error.message}`, true);

    }

}


/* ============================================================
   CSV EXPORT
   ============================================================ */

function exportCSV() {

    const list = getFilteredModuleData();

    if (!list.length) {
        toast('There are no records to export.', true);
        return;
    }

    const keys = Array.from(
        new Set(list.flatMap(item => Object.keys(item)))
    );

    const escapeCSV = value => {

        const string =
            typeof value === 'object'
                ? (
                    value && typeof value.toDate === 'function'
                        ? value.toDate().toISOString()
                        : safeJSON(value)
                )
                : String(value ?? '');

        return `"${string.replaceAll('"', '""')}"`;

    };

    const csv = [
        keys.map(escapeCSV).join(','),
        ...list.map(item =>
            keys.map(key => escapeCSV(item[key])).join(',')
        )
    ].join('\n');

    const blob = new Blob(
        [csv],
        { type: 'text/csv;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `apex-${state.currentTab}-${Date.now()}.csv`;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    audit('CSV exported', state.currentTab);

    toast('CSV exported successfully.');

}


/* ============================================================
   LIVE CLASS
   ============================================================ */

function openLiveClassModal() {

    const classes = state.data.liveClasses.length
        ? state.data.liveClasses
        : DEFAULT_SCHEDULE;

    html('liveClassList', classes.map(item => `
        <div class="live-select-row">
            <div>
                <strong>${escapeHTML(item.title || 'Live Class')}</strong>
                <small>${escapeHTML(item.subjectLabel || item.subject || '')} • ${escapeHTML(item.day || '')} • ${escapeHTML(item.time || '')}</small>
                <small>Room: ${escapeHTML(item.roomName || '')}</small>
            </div>
            <button
                class="gold-btn"
                data-host-class="${escapeHTML(item.id)}"
                type="button"
            >
                <svg class="btn-icon"><use href="#i-live"/></svg>
                <span>Start</span>
            </button>
        </div>
    `).join(''));

    show('liveClassModal');

    document
        .querySelectorAll('[data-host-class]')
        .forEach(button => {

            button.addEventListener('click', () =>
                startLiveClassById(button.dataset.hostClass)
            );

        });

}


function getLiveClass(id) {

    return (
        state.data.liveClasses.find(item => item.id === id) ||
        DEFAULT_SCHEDULE.find(item => item.id === id)
    );

}


async function startLiveClassById(id) {

    const liveClass = getLiveClass(id);

    if (!liveClass) {
        toast('Live class not found.', true);
        return;
    }

    hide('liveClassModal');

    const room =
        liveClass.roomName || `ApexLearning-${Date.now()}`;

    state.currentLiveClass = liveClass;

    text('jitsiTitle', liveClass.title || 'Apex Live Class');

    text(
        'jitsiSubtitle',
        `${liveClass.subjectLabel || liveClass.subject || 'Academy'} • ${liveClass.day || ''} ${liveClass.time || ''}`
    );

    const container = $('jitsiContainer');

    if (container) container.innerHTML = '';

    show('jitsiOverlay');

    try {

        await addDoc(collection(db, 'attendance'), {
            studentName: `${ADMIN_NAME} (Host)`,
            role: 'host',
            classId: liveClass.id,
            className: liveClass.title || 'Live Class',
            roomName: room,
            status: 'host_joined',
            joinedAt: serverTimestamp()
        });

    } catch {}

    await waitForJitsi();

    if (typeof window.JitsiMeetExternalAPI !== 'function') {

        hide('jitsiOverlay');

        toast(
            'Jitsi could not be loaded. Please refresh and try again.',
            true
        );

        return;

    }

    try {

        state.jitsi =
            new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName: room,
                parentNode: container,
                width: '100%',
                height: '100%',
                userInfo: {
                    displayName: `${ADMIN_NAME} (Host)`
                },
                configOverwrite: {
                    prejoinPageEnabled: false,
                    disableDeepLinking: true
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false,
                    DEFAULT_BACKGROUND: '#071A33',
                    TOOLBAR_ALWAYS_VISIBLE: true
                }
            });

        state.jitsi.addEventListener('videoConferenceLeft', endLiveClass);
        state.jitsi.addEventListener('readyToClose', endLiveClass);

        audit('Live class started', room);

    } catch (error) {

        hide('jitsiOverlay');

        toast(`Unable to start Jitsi: ${error.message}`, true);

    }

}


function waitForJitsi() {

    if (typeof window.JitsiMeetExternalAPI === 'function') {
        return Promise.resolve();
    }

    return new Promise(resolve => {

        let attempts = 0;

        const timer = setInterval(() => {

            attempts++;

            if (typeof window.JitsiMeetExternalAPI === 'function') {

                clearInterval(timer);
                resolve();

                return;
            }

            if (attempts >= 40) {

                clearInterval(timer);
                resolve();

            }

        }, 250);

    });

}


async function endLiveClass() {

    const liveClass = state.currentLiveClass;

    if (liveClass) {

        try {

            await addDoc(collection(db, 'attendance'), {
                studentName: `${ADMIN_NAME} (Host)`,
                role: 'host',
                classId: liveClass.id,
                className: liveClass.title || 'Live Class',
                roomName: liveClass.roomName || '',
                status: 'host_left',
                endedAt: serverTimestamp()
            });

        } catch {}

    }

    if (state.jitsi) {

        try { state.jitsi.dispose(); } catch {}

        state.jitsi = null;

    }

    state.currentLiveClass = null;

    hide('jitsiOverlay');

    const container = $('jitsiContainer');

    if (container) container.innerHTML = '';

    audit('Live class ended');

    toast('Live class ended.');

}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function closeMobileSidebar() {

    const sidebar = $('adminSidebar');

    if (sidebar) sidebar.classList.remove('mobile-open');

}


/* ============================================================
   PROFILE DROPDOWN
   ============================================================ */

function setupProfileDropdown() {

    const trigger = $('adminProfileTrigger');
    const menu = $('adminProfileMenu');

    if (!trigger || !menu) return;

    trigger.addEventListener('click', event => {

        event.stopPropagation();

        const isOpen = menu.classList.toggle('open');

        trigger.setAttribute(
            'aria-expanded',
            isOpen ? 'true' : 'false'
        );

    });

    document.addEventListener('click', event => {

        if (
            !menu.contains(event.target) &&
            !trigger.contains(event.target)
        ) {

            menu.classList.remove('open');

            trigger.setAttribute('aria-expanded', 'false');

        }

    });

    document
        .querySelectorAll('[data-profile-action]')
        .forEach(button => {

            button.addEventListener('click', async () => {

                const action = button.dataset.profileAction;

                menu.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');

                if (action === 'refresh') {

                    await loadAllData();
                    toast('Academy data refreshed.');

                } else if (action === 'audit') {

                    renderActivityLog();
                    show('activityLogModal');

                } else if (action === 'logout') {

                    await performLogout();

                }

            });

        });

}


/* ============================================================
   EVENT SETUP
   ============================================================ */

function setupEvents() {

    document
        .querySelectorAll('.nav-item')
        .forEach(button => {

            button.addEventListener('click', () =>
                switchTab(button.dataset.tab)
            );

        });

    document
        .querySelectorAll('[data-open-tab]')
        .forEach(button => {

            button.addEventListener('click', () =>
                switchTab(button.dataset.openTab)
            );

        });

    on('refreshBtn', 'click', async () => {

        await loadAllData();
        toast('Academy data refreshed.');

    });

    on('dashboardRefreshBtn', 'click', async () => {

        await loadAllData();
        toast('Dashboard refreshed.');

    });

    on('moduleRefreshBtn', 'click', async () => {

        await loadCollection(state.currentTab, true);

        updateNavigationCounts();
        renderCurrentModule();

        toast('Module refreshed.');

    });

    on('globalSearch', 'input', event => {

        state.search = event.target.value;
        renderCurrentModule();

    });

    on('courseFilter', 'change', event => {

        state.course = event.target.value;
        renderCurrentModule();

    });

    on('exportBtn', 'click', exportCSV);

    on('emailCenterModal', 'click', event => {

        if (event.target.id === 'emailCenterModal') {
            hide('emailCenterModal');
        }

    });

    on('emailRecipientType', 'change', event => {

        state.emailRecipientType = event.target.value;
        state.selectedRecipients.clear();

        renderEmailRecipients();

    });

    on('emailRecipientSearch', 'input', () => {
        renderEmailRecipients();
    });

    on('emailCourseFilter', 'change', () => {

        state.selectedRecipients.clear();
        renderEmailRecipients();

    });

    on('selectAllRecipients', 'click', () => {

        getCommunicationRecipients().forEach(recipient =>
            state.selectedRecipients.add(recipient.id)
        );

        renderEmailRecipients();

    });

    on('clearRecipients', 'click', () => {

        state.selectedRecipients.clear();
        renderEmailRecipients();

    });

    on('sendBulkEmailBtn', 'click', sendBulkEmails);

    on('bulkEmailTemplate', 'change', applyBulkTemplate);

    on('openEmailLogsBtn', 'click', openEmailLogs);

    on('replyTemplate', 'change', applyReplyTemplate);

    on('sendReplyBtn', 'click', sendReply);

    on('replyWhatsAppBtn', 'click', () => {

        if (state.replyRecipient) {
            openWhatsApp(
                state.replyRecipient,
                $('replyMessage')?.value || ''
            );
        }

    });

    document
        .querySelectorAll('[data-close-modal]')
        .forEach(button => {

            button.addEventListener('click', () =>
                hide(button.dataset.closeModal)
            );

        });

    document
        .querySelectorAll('.modal-backdrop')
        .forEach(backdrop => {

            backdrop.addEventListener('click', event => {

                if (event.target === backdrop) {

                    /*
                       Don't close confirm modal by clicking outside.
                    */

                    if (backdrop.id === 'confirmModal') {
                        return;
                    }

                    backdrop.hidden = true;
                    backdrop.classList.remove('open');

                    const anyOpen =
                        document.querySelector(
                            '.modal-backdrop.open, .jitsi-overlay:not([hidden])'
                        );

                    if (!anyOpen) {
                        document.body.classList.remove('apex-lock-scroll');
                    }

                }

            });

        });

    on('hostClassBtn', 'click', openLiveClassModal);

    on('endJitsiBtn', 'click', endLiveClass);

    on('mobileMenuBtn', 'click', () => {

        const sidebar = $('adminSidebar');

        if (sidebar) sidebar.classList.toggle('mobile-open');

    });

    document.addEventListener('keydown', event => {

        if (event.key === 'Escape') {

            /*
               Don't close confirm modal via Escape.
               Force user to make a choice.
            */

            document
                .querySelectorAll('.modal-backdrop.open')
                .forEach(modal => {

                    if (modal.id === 'confirmModal') return;

                    modal.hidden = true;
                    modal.classList.remove('open');

                });

            const jitsi = $('jitsiOverlay');

            if (jitsi && !jitsi.hidden) {
                endLiveClass();
            }

            closeMobileSidebar();

        }

    });

    window.addEventListener('online', () =>
        text('syncStatus', 'Online')
    );

    window.addEventListener('offline', () =>
        text('syncStatus', 'Offline')
    );

    setupProfileDropdown();

}


/* ============================================================
   GLOBAL SAFETY
   ============================================================ */

window.addEventListener('error', event => {

    if (event?.error) {

        try {

            audit(
                'Runtime error',
                event.error.message || 'Unknown error'
            );

        } catch {}

    }

});


window.addEventListener('unhandledrejection', event => {

    try {

        audit(
            'Unhandled promise rejection',
            event?.reason?.message || String(event?.reason || '')
        );

    } catch {}

});


/* ============================================================
   PRODUCTION READY FLAG
   ============================================================ */

window.__APEX_ADMIN_READY__ = true;
window.__APEX_ADMIN_VERSION__ = '2026.09-command-center';


/* ============================================================
   END
   ============================================================ */
