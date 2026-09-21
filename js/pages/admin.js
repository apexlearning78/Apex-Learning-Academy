import {
    auth,
    db
} from '../../config/firebase-config.js';

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
   APEX LEARNING ACADEMY — ADMIN PANEL
   SAFE / NULL-SAFE ADMIN CONTROLLER
   ========================================================= */


/* -----------------------------
   ADMIN CONFIG
----------------------------- */

const ADMIN_UID = 'VHbqYaHK6yXP2f8IF9WKc33kkD73';

const ADMIN_NAME = 'Mukesh Kewal';

const APEX_EMAILJS_PUBLIC_KEY = '0CuJdjkOPS6ovXLmt';

const APEX_EMAILJS_SERVICE = 'service_apexacademy';

const APEX_EMAILJS_TEMPLATE = 'template_apexacademy';


/* -----------------------------
   EMAILJS SAFE INIT
----------------------------- */

if (window.emailjs?.init) {
    try {
        window.emailjs.init({
            publicKey: APEX_EMAILJS_PUBLIC_KEY
        });

        window.__apexEmailReady = true;

    } catch {
        window.__apexEmailReady = false;
    }
}


/* =========================================================
   MODULES
   ========================================================= */

const MODULES = {

    students: {
        label: 'Students',
        collection: 'students',
        icon: '👨‍🎓'
    },

    instructors: {
        label: 'Instructors',
        collection: 'instructors',
        icon: '👨‍🏫'
    },

    courses: {
        label: 'Courses',
        collection: 'courses',
        icon: '📚'
    },

    batches: {
        label: 'Batches',
        collection: 'batches',
        icon: '🗓️'
    },

    fees: {
        label: 'Fees',
        collection: 'fees',
        icon: '💳'
    },

    messages: {
        label: 'Messages',
        collection: 'messages',
        icon: '✉️'
    },

    announcements: {
        label: 'Announcements',
        collection: 'announcements',
        icon: '📢'
    },

    certificates: {
        label: 'Certificates',
        collection: 'certificates',
        icon: '🎓'
    },

    attendance: {
        label: 'Attendance',
        collection: 'attendance',
        icon: '✅'
    },

    tests: {
        label: 'Tests',
        collection: 'tests',
        icon: '📝'
    },

    results: {
        label: 'Results',
        collection: 'results',
        icon: '📊'
    },

    coupons: {
        label: 'Coupons',
        collection: 'coupons',
        icon: '🎟️'
    },

    reviews: {
        label: 'Reviews',
        collection: 'reviews',
        icon: '⭐'
    },

    emailLogs: {
        label: 'Email Logs',
        collection: 'emailLogs',
        icon: '📨'
    }

};


/* =========================================================
   DEFAULT SCHEDULE
   ========================================================= */

const DEFAULT_SCHEDULE = [
    {
        day: 'Monday',
        course: 'Web Development',
        time: '7:00 PM',
        instructor: 'Apex Instructor'
    },
    {
        day: 'Tuesday',
        course: 'Artificial Intelligence',
        time: '7:00 PM',
        instructor: 'Apex Instructor'
    },
    {
        day: 'Wednesday',
        course: 'Web Development',
        time: '7:00 PM',
        instructor: 'Apex Instructor'
    },
    {
        day: 'Thursday',
        course: 'Artificial Intelligence',
        time: '7:00 PM',
        instructor: 'Apex Instructor'
    }
];


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let currentTab = 'dashboard';

let currentRecordId = null;

let currentEditingCollection = null;

let currentLiveClass = null;

let jitsi = null;

const data = {};


/* =========================================================
   SAFE DOM HELPERS
   ========================================================= */

const makeSafeElement = (id) => {

    return new Proxy(
        {
            __missing: true,
            id,
            value: '',
            textContent: '',
            innerHTML: '',
            style: {},
            dataset: {},

            classList: {
                add() {},
                remove() {},
                toggle() {
                    return false;
                },
                contains() {
                    return false;
                }
            },

            querySelector() {
                return null;
            },

            querySelectorAll() {
                return [];
            },

            addEventListener() {},

            removeEventListener() {},

            appendChild() {},

            removeChild() {},

            prepend() {},

            focus() {},

            blur() {},

            click() {},

            remove() {},

            closest() {
                return null;
            },

            getAttribute() {
                return null;
            },

            setAttribute() {},

            hasAttribute() {
                return false;
            }
        },

        {
            get(target, property) {

                if (property in target) {
                    return target[property];
                }

                if (
                    property === 'files' ||
                    property === 'options' ||
                    property === 'children'
                ) {
                    return [];
                }

                if (
                    property === 'checked' ||
                    property === 'disabled' ||
                    property === 'hidden'
                ) {
                    return false;
                }

                if (property === 'selectedIndex') {
                    return -1;
                }

                return (...args) => undefined;
            },

            set(target, property, value) {

                target[property] = value;

                return true;
            }
        }
    );
};


const $ = (id) => {

    return document.getElementById(id) ||
        makeSafeElement(id);

};


const on = (id, event, handler) => {

    const element = $(id);

    if (
        element &&
        !element.__missing
    ) {
        element.addEventListener(
            event,
            handler
        );
    }

};


const setText = (id, value) => {

    const element = $(id);

    if (
        element &&
        !element.__missing
    ) {
        element.textContent =
            String(value ?? '');
    }

};


const setHTML = (id, value) => {

    const element = $(id);

    if (
        element &&
        !element.__missing
    ) {
        element.innerHTML =
            String(value ?? '');
    }

};


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function esc(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function fmt(value) {

    if (
        value &&
        typeof value.toDate === 'function'
    ) {
        return value
            .toDate()
            .toLocaleString();
    }

    if (
        value &&
        typeof value === 'object' &&
        typeof value.seconds === 'number'
    ) {
        return new Date(
            value.seconds * 1000
        ).toLocaleString();
    }

    if (
        value instanceof Date
    ) {
        return value.toLocaleString();
    }

    return value == null
        ? ''
        : String(value);
}


/* =========================================================
   TOAST
   ========================================================= */

const toast = (
    message,
    error = false
) => {

    const element = $('toast');

    if (element.__missing) {
        return;
    }

    element.textContent =
        String(message ?? '');

    element.className =
        'toast show' +
        (error ? ' error' : '');

    clearTimeout(
        window.__toast
    );

    window.__toast =
        setTimeout(() => {

            if (!element.__missing) {
                element.className =
                    'toast';
            }

        }, 2600);

};


/* =========================================================
   AUDIT LOG
   ========================================================= */

function log(
    action,
    detail = ''
) {

    try {

        let records = [];

        try {
            records = JSON.parse(
                localStorage.getItem(
                    'apex_admin_audit'
                ) || '[]'
            );

            if (!Array.isArray(records)) {
                records = [];
            }

        } catch {
            records = [];
        }

        records.unshift({

            action,

            detail,

            time:
                new Date().toISOString(),

            admin:
                currentUser?.email ||
                'admin'

        });

        localStorage.setItem(
            'apex_admin_audit',
            JSON.stringify(
                records.slice(0, 80)
            )
        );

    } catch {
        /* localStorage may be unavailable */
    }

    renderActivity();

}


/* =========================================================
   ACTIVITY
   ========================================================= */

function renderActivity() {

    const activity =
        $('activity');

    if (activity.__missing) {
        return;
    }

    let records = [];

    try {

        records = JSON.parse(
            localStorage.getItem(
                'apex_admin_audit'
            ) || '[]'
        );

        if (!Array.isArray(records)) {
            records = [];
        }

    } catch {

        records = [];

    }

    activity.innerHTML =

        records
            .slice(0, 8)
            .map(item => `

                <div class="activity-item">

                    <span class="activity-dot"></span>

                    <div>

                        <b>
                            ${esc(item.action)}
                        </b>

                        ${
                            item.detail
                                ? ` — ${esc(item.detail)}`
                                : ''
                        }

                        <time>
                            ${
                                esc(
                                    new Date(
                                        item.time
                                    ).toLocaleString()
                                )
                            }
                        </time>

                    </div>

                </div>

            `)
            .join('')

        ||

        `
            <div
                class="empty"
                style="padding:20px"
            >
                No activity yet.
            </div>
        `;

}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(
    title,
    body,
    foot = ''
) {

    setText(
        'modalTitle',
        title
    );

    setHTML(
        'modalBody',
        body
    );

    setHTML(
        'modalFoot',
        foot
    );

    $('modalBg')
        .classList
        .add('open');

}


function closeModal() {

    $('modalBg')
        .classList
        .remove('open');

}


on(
    'modalClose',
    'click',
    closeModal
);


on(
    'modalBg',
    'click',
    event => {

        const background =
            $('modalBg');

        if (
            !background.__missing &&
            event.target === background
        ) {
            closeModal();
        }

    }
);


/* =========================================================
   LOGIN
   ========================================================= */

on(
    'loginForm',
    'submit',
    async event => {

        event.preventDefault();

        const loginError =
            $('loginError');

        loginError
            .classList
            .add('hidden');

        try {

            await signInWithEmailAndPassword(
                auth,
                String(
                    $('email').value || ''
                ).trim(),
                String(
                    $('password').value || ''
                )
            );

            toast(
                'Secure login successful'
            );

        } catch (error) {

            loginError.textContent =
                String(
                    error?.message ||
                    'Login failed'
                )
                .replace(
                    'Firebase: ',
                    ''
                );

            loginError
                .classList
                .remove('hidden');

        }

    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

on(
    'logoutBtn',
    'click',
    async () => {

        try {

            await signOut(auth);

        } catch {

            toast(
                'Logout failed. Please try again.',
                true
            );

        }

    }
);


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;

        if (user) {

            if (
                user.uid !== ADMIN_UID
            ) {

                toast(
                    'This account is not authorized for the admin panel.',
                    true
                );

                try {
                    await signOut(auth);
                } catch {}

                return;
            }

            $('login')
                .style
                .display = 'none';

            $('app')
                .style
                .display = 'block';

            setText(
                'adminEmail',
                user.email ||
                ADMIN_NAME
            );

            setText(
                'avatar',
                (
                    user.email ||
                    'A'
                )[0]
                    .toUpperCase()
            );

            setText(
                'welcomeTitle',
                `Welcome back, ${ADMIN_NAME}`
            );

            log(
                'Admin session started',
                'Secure Firebase authentication'
            );

            await loadAll();

        } else {

            $('login')
                .style
                .display = 'grid';

            $('app')
                .style
                .display = 'none';

        }

    }
);


/* =========================================================
   LOAD FIREBASE COLLECTION
   ========================================================= */

async function loadModule(
    key
) {

    const module =
        MODULES[key];

    if (!module) {
        data[key] = [];
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    module.collection
                )
            );

        data[key] =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );

    } catch {

        data[key] = [];

        toast(
            `Unable to load ${module.label}.`,
            true
        );

    }

}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadAll() {

    setText(
        'liveStatus',
        'Syncing academy data from Firebase…'
    );

    await Promise.all(
        Object.keys(MODULES)
            .map(key =>
                loadModule(key)
            )
    );

    updateCounts();

    renderDashboard();

    if (
        currentTab !== 'dashboard'
    ) {
        renderModule();
    }

    setText(
        'liveStatus',
        `Firebase synced • ${
            new Date().toLocaleTimeString()
        }`
    );

}


/* =========================================================
   COUNTS
   ========================================================= */

function updateCounts() {

    for (
        const key of [
            'students',
            'instructors',
            'messages'
        ]
    ) {

        setText(
            `c-${key}`,
            (
                data[key] || []
            ).length
        );

    }


    for (
        const key of [
            'students',
            'instructors',
            'fees',
            'messages',
            'tests',
            'attendance'
        ]
    ) {

        setText(
            `s-${key}`,
            (
                data[key] || []
            ).length
        );

    }

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    renderActivity();

    const students =
        data.students || [];

    const instructors =
        data.instructors || [];

    const fees =
        data.fees || [];

    const messages =
        data.messages || [];

    setText(
        'dashboardStudents',
        students.length
    );

    setText(
        'dashboardInstructors',
        instructors.length
    );

    setText(
        'dashboardFees',
        fees.length
    );

    setText(
        'dashboardMessages',
        messages.length
    );


    const snapshot =
        $('snapshot');

    if (
        !snapshot.__missing
    ) {

        snapshot
            .querySelectorAll(
                '[data-open]'
            )
            .forEach(button => {

                button.addEventListener(
                    'click',
                    () => {

                        if (
                            button.dataset.open
                        ) {

                            switchTab(
                                button.dataset.open
                            );

                        }

                    }
                );

            });

    }

}


/* =========================================================
   MODULE NAVIGATION
   ========================================================= */

function switchTab(
    key
) {

    currentTab = key;

    document
        .querySelectorAll(
            '.nav-item'
        )
        .forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.tab === key
            );

        });


    const customViews = [
        'emailCenter',
        'settings',
        'audit'
    ];

    $('dashboardView')
        .classList
        .toggle(
            'hidden',
            key !== 'dashboard'
        );

    $('moduleView')
        .classList
        .toggle(
            'hidden',
            key === 'dashboard' ||
            customViews.includes(key)
        );

    $('customView')
        .classList
        .toggle(
            'hidden',
            !customViews.includes(key)
        );


    const titles = {

        emailCenter:
            'Communication Center',

        settings:
            'Academy Settings',

        audit:
            'Admin Audit'

    };


    setText(
        'pageTitle',

        key === 'dashboard'
            ? 'Overview'
            : (
                titles[key] ||
                MODULES[key]?.label ||
                'Administration'
            )
    );


    const courseFilter =
        $('studentCourseFilter');

    if (
        !courseFilter.__missing
    ) {

        courseFilter.style.display =
            key === 'students'
                ? 'inline-flex'
                : 'none';

        courseFilter.onchange =
            key === 'students'
                ? renderModule
                : null;

    }


    if (
        key === 'dashboard'
    ) {

        renderDashboard();

    } else if (
        customViews.includes(key)
    ) {

        renderCustomView(
            key
        );

    } else {

        renderModule();

    }


    $('sidebar')
        .classList
        .remove('open');

}


/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

document
    .querySelectorAll(
        '.nav-item'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                if (
                    button.dataset.tab
                ) {

                    switchTab(
                        button.dataset.tab
                    );

                }

            }
        );

    });


document
    .querySelectorAll(
        '[data-go]'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                if (
                    button.dataset.go
                ) {

                    switchTab(
                        button.dataset.go
                    );

                }

            }
        );

    });


/* =========================================================
   MOBILE MENU
   ========================================================= */

on(
    'menuBtn',
    'click',
    () => {

        $('sidebar')
            .classList
            .toggle('open');

    }
);


/* =========================================================
   REFRESH BUTTONS
   ========================================================= */

on(
    'refreshBtn',
    'click',
    async () => {

        await loadAll();

        toast(
            'Academy data refreshed'
        );

    }
);


on(
    'dashboardRefresh',
    'click',
    async () => {

        await loadAll();

        toast(
            'Dashboard refreshed'
        );

    }
);


on(
    'reloadBtn',
    'click',
    async () => {

        await loadModule(
            currentTab
        );

        renderModule();

        toast(
            'Module refreshed'
        );

    }
);


/* =========================================================
   GLOBAL SEARCH
   ========================================================= */

on(
    'globalSearch',
    'input',
    event => {

        const query =
            String(
                event.target?.value ||
                ''
            )
            .toLowerCase()
            .trim();

        if (!query) {
            return;
        }

        const found =
            Object.keys(
                MODULES
            )
            .find(key =>
                (
                    data[key] || []
                )
                .some(record =>
                    JSON.stringify(
                        record
                    )
                    .toLowerCase()
                    .includes(query)
                )
            );

        if (found) {
            switchTab(found);
        }

    }
);


on(
    'moduleSearch',
    'input',
    renderModule
);


on(
    'statusFilter',
    'change',
    renderModule
);


/* =========================================================
   BASIC BADGE HELPER
   ========================================================= */

function badge(value) {

    if (!value) {
        return '—';
    }

    const status =
        String(value)
            .toLowerCase();

    let className =
        'b-gray';


    if (
        [
            'active',
            'paid',
            'approved',
            'hired',
            'completed',
            'pass',
            'published'
        ].includes(status)
    ) {

        className =
            'b-green';

    } else if (
        [
            'rejected',
            'fail',
            'unpaid',
            'cancelled'
        ].includes(status)
    ) {

        className =
            'b-red';

    } else if (
        [
            'pending',
            'reviewed',
            'scheduled'
        ].includes(status)
    ) {

        className =
            'b-gold';

    } else if (
        [
            'live',
            'shortlisted'
        ].includes(status)
    ) {

        className =
            'b-blue';

    }


    return `
        <span class="badge ${className}">
            ${esc(value)}
        </span>
    `;

}


/* =========================================================
   SAFE DATE FIELD DETECTION
   ========================================================= */

function isDateField(
    field
) {

    return /(
        date|
        time|
        At$|
        expiresAt|
        issuedAt|
        paidAt|
        createdAt|
        updatedAt|
        submittedAt|
        publishedAt|
        joinedAt|
        leftAt|
        sentAt
    )$/ix.test(field);

}


/* =========================================================
   MODULE TABLE
   ========================================================= */

function renderModule() {

    const module =
        MODULES[currentTab];

    const table =
        $('moduleTable');

    if (
        table.__missing ||
        !module
    ) {
        return;
    }

    const rows =
        data[currentTab] || [];


    const search =
        String(
            $('moduleSearch').value ||
            ''
        )
        .toLowerCase()
        .trim();


    const status =
        String(
            $('statusFilter').value ||
            ''
        )
        .toLowerCase()
        .trim();


    let filtered =
        rows.filter(record => {

            const searchable =
                JSON.stringify(
                    record
                )
                .toLowerCase();

            const matchesSearch =
                !search ||
                searchable.includes(search);

            const matchesStatus =
                !status ||
                String(
                    record.status ||
                    ''
                )
                .toLowerCase() === status;

            return (
                matchesSearch &&
                matchesStatus
            );

        });


    if (
        currentTab === 'students'
    ) {

        const course =
            String(
                $('studentCourseFilter').value ||
                ''
            )
            .toLowerCase()
            .trim();

        if (course) {

            filtered =
                filtered.filter(
                    record =>
                        String(
                            record.course ||
                            ''
                        )
                        .toLowerCase()
                        .includes(course)
                );

        }

    }


    if (!filtered.length) {

        table.innerHTML = `
            <div class="empty">
                No ${esc(module.label)}
                records found.
            </div>
        `;

        return;
    }


    const keys =
        [
            ...new Set(
                filtered.flatMap(
                    record =>
                        Object.keys(record)
                )
            )
        ]
        .filter(
            key =>
                key !== 'id' &&
                key !== 'password'
        )
        .slice(0, 7);


    table.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        ${keys
                            .map(
                                key =>
                                    `<th>${esc(key)}</th>`
                            )
                            .join('')}

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${filtered
                        .map(
                            record => `

                                <tr>

                                    ${keys
                                        .map(
                                            key => {

                                                const value =
                                                    record[key];

                                                return `
                                                    <td>
                                                        ${
                                                            key === 'status'
                                                                ? badge(value)
                                                                : esc(fmt(value))
                                                        }
                                                    </td>
                                                `;

                                            }
                                        )
                                        .join('')}

                                    <td>

                                        <div class="row-actions">

                                            <button
                                                class="view"
                                                data-id="${esc(record.id)}"
                                                type="button"
                                            >
                                                View
                                            </button>

                                            <button
                                                class="edit"
                                                data-id="${esc(record.id)}"
                                                type="button"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                class="del"
                                                data-id="${esc(record.id)}"
                                                type="button"
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `
                        )
                        .join('')}

                </tbody>

            </table>

        </div>

    `;


    table
        .querySelectorAll(
            '.view'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () =>
                    viewRecord(
                        button.dataset.id
                    )
            );

        });


    table
        .querySelectorAll(
            '.edit'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () =>
                    editRecord(
                        button.dataset.id
                    )
            );

        });


    table
        .querySelectorAll(
            '.del'
        )
        .forEach(button => {

            button.addEventListener(
                'click',
                () =>
                    deleteRecord(
                        button.dataset.id
                    )
            );

        });

}


/* =========================================================
   VIEW RECORD
   ========================================================= */

function viewRecord(
    id
) {

    const records =
        data[currentTab] || [];

    const record =
        records.find(
            item =>
                item.id === id
        );

    if (!record) {
        return;
    }


    const body = Object.entries(
        record
    )
    .filter(
        ([key]) =>
            key !== 'id' &&
            key !== 'password'
    )
    .map(
        ([key, value]) => `

            <div class="detail-row">

                <strong>
                    ${esc(key)}
                </strong>

                <span>
                    ${esc(fmt(value))}
                </span>

            </div>

        `
    )
    .join('');


    showModal(
        `${MODULES[currentTab]?.label || 'Record'} Details`,
        body,
        `
            <button
                id="modalDone"
                type="button"
                class="btn btn-primary"
            >
                Close
            </button>
        `
    );


    on(
        'modalDone',
        'click',
        closeModal
    );

}


/* =========================================================
   ADD RECORD
   ========================================================= */

async function addRecord() {

    const module =
        MODULES[currentTab];

    if (!module) {
        return;
    }


    currentRecordId =
        null;

    currentEditingCollection =
        module.collection;


    const fields = [

        'name',
        'email',
        'phone',
        'course',
        'status',
        'amount',
        'date',
        'message'

    ];


    const body = fields
        .map(
            field => `

                <label
                    class="admin-field"
                >

                    <span>
                        ${esc(field)}
                    </span>

                    <input
                        id="field_${esc(field)}"
                        name="${esc(field)}"
                        ${
                            field === 'amount'
                                ? 'type="number"'
                                : field === 'date'
                                    ? 'type="datetime-local"'
                                    : 'type="text"'
                        }
                    >

                </label>

            `
        )
        .join('');


    showModal(
        `Add ${module.label}`,
        `
            <form id="recordForm">

                ${body}

            </form>
        `,
        `
            <button
                id="cancel"
                type="button"
                class="btn btn-secondary"
            >
                Cancel
            </button>

            <button
                id="save"
                type="button"
                class="btn btn-primary"
            >
                Save
            </button>
        `
    );


    on(
        'cancel',
        'click',
        closeModal
    );


    on(
        'save',
        'click',
        async () => {

            await saveRecord();

        }
    );

}


/* =========================================================
   SAVE RECORD
   ========================================================= */

async function saveRecord(
    id = null
) {

    const module =
        MODULES[currentTab];

    if (!module) {
        return;
    }


    const form =
        $('recordForm');

    const payload = {};


    if (
        form &&
        !form.__missing
    ) {

        form
            .querySelectorAll(
                'input, textarea, select'
            )
            .forEach(input => {

                if (
                    input.name &&
                    input.value !== ''
                ) {

                    payload[input.name] =
                        input.value;

                }

            });

    }


    try {

        if (id) {

            await updateDoc(
                doc(
                    db,
                    module.collection,
                    id
                ),
                {
                    ...payload,
                    updatedAt:
                        serverTimestamp()
                }
            );

            log(
                `${module.label} updated`,
                id
            );

            toast(
                `${module.label} updated successfully`
            );

        } else {

            await addDoc(
                collection(
                    db,
                    module.collection
                ),
                {
                    ...payload,
                    createdAt:
                        serverTimestamp()
                }
            );

            log(
                `${module.label} created`
            );

            toast(
                `${module.label} created successfully`
            );

        }


        closeModal();

        await loadModule(
            currentTab
        );

        updateCounts();

        renderModule();

    } catch (error) {

        toast(
            error?.message ||
            'Unable to save record.',
            true
        );

    }

}


/* =========================================================
   EDIT RECORD
   ========================================================= */

async function editRecord(
    id
) {

    const records =
        data[currentTab] || [];

    const record =
        records.find(
            item =>
                item.id === id
        );

    if (!record) {
        return;
    }


    const fields =
        Object.keys(record)
            .filter(
                key =>
                    key !== 'id' &&
                    key !== 'password'
            );


    const body =
        fields
            .map(
                field => {

                    const value =
                        record[field];

                    return `

                        <label
                            class="admin-field"
                        >

                            <span>
                                ${esc(field)}
                            </span>

                            <input
                                id="field_${esc(field)}"
                                name="${esc(field)}"
                                value="${esc(fmt(value))}"
                            >

                        </label>

                    `;

                }
            )
            .join('');


    showModal(
        `Edit ${MODULES[currentTab]?.label || 'Record'}`,
        `
            <form id="recordForm">

                ${body}

            </form>
        `,
        `
            <button
                id="cancel"
                type="button"
                class="btn btn-secondary"
            >
                Cancel
            </button>

            <button
                id="save"
                type="button"
                class="btn btn-primary"
            >
                Save Changes
            </button>
        `
    );


    on(
        'cancel',
        'click',
        closeModal
    );


    on(
        'save',
        'click',
        () =>
            saveRecord(id)
    );

}


/* =========================================================
   DELETE RECORD
   ========================================================= */

async function deleteRecord(
    id
) {

    const module =
        MODULES[currentTab];

    if (!module) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete this ${module.label.slice(0, -1)}? This action cannot be undone.`
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
            `${module.label} deleted`,
            id
        );

        toast(
            'Record deleted successfully'
        );

        await loadModule(
            currentTab
        );

        updateCounts();

        renderModule();

    } catch (error) {

        toast(
            error?.message ||
            'Unable to delete record.',
            true
        );

    }

}


/* =========================================================
   ADD BUTTON
   ========================================================= */

on(
    'addBtn',
    'click',
    addRecord
);


/* =========================================================
   CSV EXPORT
   ========================================================= */

on(
    'exportBtn',
    'click',
    () => {

        const rows =
            data[currentTab] || [];

        if (!rows.length) {

            toast(
                'Nothing to export',
                true
            );

            return;
        }


        const keys =
            [
                ...new Set(
                    rows.flatMap(
                        item =>
                            Object.keys(item)
                    )
                )
            ]
            .filter(
                key =>
                    key !== 'id'
            );


        const csv = [

            keys.join(','),

            ...rows.map(
                item =>
                    keys
                        .map(
                            key => {

                                const value =
                                    fmt(
                                        item[key]
                                    );

                                return `"${String(
                                    value
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`;

                            }
                        )
                        .join(',')
            )

        ].join('\n');


        const url =
            URL.createObjectURL(
                new Blob(
                    [csv],
                    {
                        type:
                            'text/csv;charset=utf-8'
                    }
                )
            );


        const link =
            document.createElement(
                'a'
            );

        link.href = url;

        link.download =
            `apex-${currentTab}-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        setTimeout(
            () =>
                URL.revokeObjectURL(url),
            1000
        );


        log(
            'CSV exported',
            MODULES[currentTab]?.label ||
            currentTab
        );


        toast(
            'CSV exported successfully'
        );

    }
);
/* =========================================================
   PART 2 — COMMUNICATION / LIVE CLASS / SETTINGS / AUDIT
   ========================================================= */


/* =========================================================
   CUSTOM VIEWS
   ========================================================= */

function renderCustomView(key) {

    const container =
        $('customView');

    if (container.__missing) {
        return;
    }


    if (key === 'emailCenter') {

        renderEmailCenter();

        return;
    }


    if (key === 'settings') {

        renderSettings();

        return;
    }


    if (key === 'audit') {

        renderAudit();

        return;
    }

}


/* =========================================================
   EMAIL / COMMUNICATION CENTER
   ========================================================= */

function renderEmailCenter() {

    const container =
        $('customView');

    if (container.__missing) {
        return;
    }


    container.innerHTML = `

        <section class="admin-panel-card">

            <div class="panel-head">

                <div>

                    <h2>
                        Communication Center
                    </h2>

                    <p>
                        Send professional communications
                        to Apex Learning Academy users.
                    </p>

                </div>

            </div>


            <div class="communication-grid">

                <div class="admin-field">

                    <label for="commRecipient">
                        Recipient Email
                    </label>

                    <input
                        id="commRecipient"
                        type="email"
                        placeholder="student@example.com"
                        autocomplete="email"
                    >

                </div>


                <div class="admin-field">

                    <label for="commSubject">
                        Subject
                    </label>

                    <input
                        id="commSubject"
                        type="text"
                        placeholder="Apex Learning Academy"
                        maxlength="180"
                    >

                </div>


                <div class="admin-field">

                    <label for="commTemplate">
                        Template
                    </label>

                    <select id="commTemplate">

                        <option value="">
                            Select template
                        </option>

                        <option value="welcome">
                            Welcome Email
                        </option>

                        <option value="enrollment">
                            Course Enrollment
                        </option>

                        <option value="payment">
                            Payment Confirmation
                        </option>

                        <option value="class">
                            Class Reminder
                        </option>

                        <option value="certificate">
                            Certificate Ready
                        </option>

                        <option value="announcement">
                            Announcement
                        </option>

                        <option value="custom">
                            Custom Message
                        </option>

                    </select>

                </div>


                <div class="admin-field">

                    <label for="commMessage">
                        Message
                    </label>

                    <textarea
                        id="commMessage"
                        rows="10"
                        maxlength="5000"
                        placeholder="Write your professional message..."
                    ></textarea>

                </div>


                <div class="communication-actions">

                    <button
                        id="commSend"
                        type="button"
                        class="btn btn-primary"
                    >
                        Send Email
                    </button>

                    <button
                        id="commWhatsApp"
                        type="button"
                        class="btn btn-secondary"
                    >
                        WhatsApp
                    </button>

                    <button
                        id="commClear"
                        type="button"
                        class="btn btn-secondary"
                    >
                        Clear
                    </button>

                </div>

            </div>

        </section>

    `;


    bindCommunicationEvents();

}


/* =========================================================
   COMMUNICATION EVENTS
   ========================================================= */

function bindCommunicationEvents() {

    on(
        'commTemplate',
        'change',
        applyCommunicationTemplate
    );


    on(
        'commSend',
        'click',
        sendCommunicationEmail
    );


    on(
        'commWhatsApp',
        'click',
        openWhatsAppMessage
    );


    on(
        'commClear',
        'click',
        clearCommunicationForm
    );

}


/* =========================================================
   EMAIL TEMPLATES
   ========================================================= */

const COMMUNICATION_TEMPLATES = {

    welcome: {

        subject:
            'Welcome to Apex Learning Academy',

        message:
`Hello,

Welcome to Apex Learning Academy.

We are pleased to have you join our learning community.

Our team is here to support you throughout your learning journey.

Regards,
Apex Learning Academy Team`

    },


    enrollment: {

        subject:
            'Course Enrollment Confirmation — Apex Learning Academy',

        message:
`Hello,

Your course enrollment with Apex Learning Academy has been successfully processed.

You can access your student dashboard and course resources using your registered account.

Regards,
Apex Learning Academy Team`

    },


    payment: {

        subject:
            'Payment Confirmation — Apex Learning Academy',

        message:
`Hello,

We have received your payment successfully.

Thank you for choosing Apex Learning Academy.

Please keep this email for your records.

Regards,
Apex Learning Academy Team`

    },


    class: {

        subject:
            'Class Reminder — Apex Learning Academy',

        message:
`Hello,

This is a reminder about your upcoming class at Apex Learning Academy.

Please join your class on time and keep your learning resources ready.

Regards,
Apex Learning Academy Team`

    },


    certificate: {

        subject:
            'Your Certificate Is Ready — Apex Learning Academy',

        message:
`Hello,

Your Apex Learning Academy certificate is now ready.

Please log in to your student dashboard to view or verify your certificate.

Congratulations on completing your learning journey.

Regards,
Apex Learning Academy Team`

    },


    announcement: {

        subject:
            'Important Announcement — Apex Learning Academy',

        message:
`Hello,

We have an important announcement for Apex Learning Academy students.

Please check your dashboard for the latest information.

Regards,
Apex Learning Academy Team`

    }

};


/* =========================================================
   APPLY EMAIL TEMPLATE
   ========================================================= */

function applyCommunicationTemplate() {

    const template =
        $('commTemplate').value;

    const selected =
        COMMUNICATION_TEMPLATES[
            template
        ];


    if (!selected) {
        return;
    }


    setText(
        'commSubject',
        selected.subject
    );

    setText(
        'commMessage',
        selected.message
    );


    const subject =
        $('commSubject');

    const message =
        $('commMessage');


    if (!subject.__missing) {
        subject.value =
            selected.subject;
    }


    if (!message.__missing) {
        message.value =
            selected.message;
    }

}


/* =========================================================
   SEND EMAIL
   ========================================================= */

async function sendCommunicationEmail() {

    const recipient =
        String(
            $('commRecipient').value ||
            ''
        )
        .trim();


    const subject =
        String(
            $('commSubject').value ||
            ''
        )
        .trim();


    const message =
        String(
            $('commMessage').value ||
            ''
        )
        .trim();


    if (!recipient) {

        toast(
            'Please enter recipient email.',
            true
        );

        return;
    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(recipient)
    ) {

        toast(
            'Please enter a valid email address.',
            true
        );

        return;
    }


    if (!subject) {

        toast(
            'Please enter email subject.',
            true
        );

        return;
    }


    if (!message) {

        toast(
            'Please enter your message.',
            true
        );

        return;
    }


    if (
        !window.emailjs ||
        !window.__apexEmailReady
    ) {

        toast(
            'Email service is not available right now.',
            true
        );

        return;
    }


    const button =
        $('commSend');


    if (!button.__missing) {

        button.disabled = true;

        button.textContent =
            'Sending…';

    }


    try {

        await window.emailjs.send(

            APEX_EMAILJS_SERVICE,

            APEX_EMAILJS_TEMPLATE,

            {

                to_email:
                    recipient,

                recipient:
                    recipient,

                subject:
                    subject,

                message:
                    message,

                admin_name:
                    ADMIN_NAME,

                reply_to:
                    currentUser?.email ||
                    ''

            }

        );


        try {

            await addDoc(
                collection(
                    db,
                    'emailLogs'
                ),
                {

                    recipient,

                    subject,

                    message,

                    sentBy:
                        currentUser?.uid ||
                        ADMIN_UID,

                    sentByEmail:
                        currentUser?.email ||
                        '',

                    createdAt:
                        serverTimestamp()

                }
            );

        } catch {
            /*
             * Email succeeded even if
             * audit-log write is unavailable.
             */
        }


        log(
            'Email sent',
            `${recipient} — ${subject}`
        );


        toast(
            'Email sent successfully'
        );


        const messageInput =
            $('commMessage');

        if (
            !messageInput.__missing
        ) {
            messageInput.value = '';
        }


    } catch (error) {

        toast(
            error?.text ||
            error?.message ||
            'Unable to send email.',
            true
        );

    } finally {

        if (!button.__missing) {

            button.disabled = false;

            button.textContent =
                'Send Email';

        }

    }

}


/* =========================================================
   WHATSAPP
   ========================================================= */

function openWhatsAppMessage() {

    const recipient =
        String(
            $('commRecipient').value ||
            ''
        )
        .trim();


    const message =
        String(
            $('commMessage').value ||
            ''
        )
        .trim();


    if (!message) {

        toast(
            'Please enter a message first.',
            true
        );

        return;
    }


    let phone =
        recipient
            .replace(
                /[^0-9+]/g,
                ''
            );


    /*
     * If an email was entered instead of
     * a phone number, WhatsApp can still
     * open with the message.
     */

    const url =
        `https://wa.me/${
            phone.replace(
                /^\+/,
                ''
            )
        }?text=${
            encodeURIComponent(message)
        }`;


    window.open(
        url,
        '_blank',
        'noopener,noreferrer'
    );


    log(
        'WhatsApp communication opened'
    );

}


/* =========================================================
   CLEAR COMMUNICATION FORM
   ========================================================= */

function clearCommunicationForm() {

    [
        'commRecipient',
        'commSubject',
        'commMessage'
    ]
    .forEach(id => {

        const element =
            $(id);

        if (
            !element.__missing
        ) {
            element.value = '';
        }

    });


    const template =
        $('commTemplate');

    if (
        !template.__missing
    ) {
        template.value = '';
    }

}


/* =========================================================
   LIVE CLASS CENTER
   ========================================================= */

function openLiveClass(
    roomName = ''
) {

    const safeRoom =
        String(
            roomName ||
            `Apex-Live-${Date.now()}`
        )
        .trim()
        .replace(
            /[^a-zA-Z0-9_-]/g,
            '-'
        );


    currentLiveClass = safeRoom;


    const overlay =
        $('liveClassOverlay');


    if (
        overlay.__missing
    ) {

        showModal(

            'Live Class',

            `

                <div class="live-class-fallback">

                    <p>
                        Live class room:
                    </p>

                    <strong>
                        ${esc(safeRoom)}
                    </strong>

                    <br><br>

                    <a
                        href="https://meet.jit.si/${encodeURIComponent(safeRoom)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open Jitsi Meeting
                    </a>

                </div>

            `,

            `

                <button
                    id="closeLiveFallback"
                    type="button"
                    class="btn btn-secondary"
                >
                    Close
                </button>

            `

        );


        on(
            'closeLiveFallback',
            'click',
            closeModal
        );


        return;

    }


    overlay.classList.add(
        'open'
    );


    loadJitsiRoom(
        safeRoom
    );

}


/* =========================================================
   JITSI LOADER
   ========================================================= */

function loadJitsiRoom(
    roomName
) {

    const container =
        $('jitsiContainer');


    if (
        container.__missing
    ) {

        toast(
            'Jitsi container is not available.',
            true
        );

        return;
    }


    if (
        typeof window.JitsiMeetExternalAPI !==
        'function'
    ) {

        toast(
            'Jitsi is still loading. Please try again.',
            true
        );

        const fallback =
            $('jitsiFallback');

        if (
            !fallback.__missing
        ) {

            fallback.innerHTML = `

                <p>
                    Jitsi could not be loaded.
                </p>

                <a
                    href="https://meet.jit.si/${encodeURIComponent(roomName)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Meeting
                </a>

            `;

        }

        return;
    }


    try {

        if (jitsi) {

            try {
                jitsi.dispose();
            } catch {}

            jitsi = null;

        }


        container.innerHTML = '';


        jitsi =
            new window.JitsiMeetExternalAPI(
                'meet.jit.si',
                {

                    roomName,

                    parentNode:
                        container,

                    width:
                        '100%',

                    height:
                        '100%',

                    configOverwrite: {

                        prejoinPageEnabled:
                            true,

                        disableDeepLinking:
                            true

                    },

                    interfaceConfigOverwrite: {

                        SHOW_JITSI_WATERMARK:
                            false

                    }

                }
            );


        log(
            'Jitsi live class started',
            roomName
        );


    } catch (error) {

        toast(
            'Unable to start live class.',
            true
        );


        const fallback =
            $('jitsiFallback');


        if (
            !fallback.__missing
        ) {

            fallback.innerHTML = `

                <p>
                    Unable to embed Jitsi.
                </p>

                <a
                    href="https://meet.jit.si/${encodeURIComponent(roomName)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Jitsi Meeting
                </a>

            `;

        }

    }

}


/* =========================================================
   CLOSE LIVE CLASS
   ========================================================= */

function closeLiveClass() {

    const overlay =
        $('liveClassOverlay');


    if (
        !overlay.__missing
    ) {

        overlay.classList.remove(
            'open'
        );

    }


    if (jitsi) {

        try {
            jitsi.dispose();
        } catch {}

        jitsi = null;

    }


    currentLiveClass =
        null;

}


on(
    'liveClassClose',
    'click',
    closeLiveClass
);


on(
    'closeLiveClass',
    'click',
    closeLiveClass
);


/* =========================================================
   LIVE CLASS BUTTON
   ========================================================= */

on(
    'startLiveClass',
    'click',
    () => {

        const room =
            String(
                $('liveRoomName').value ||
                ''
            )
            .trim();


        openLiveClass(
            room ||
            `Apex-Live-${Date.now()}`
        );

    }
);


/* =========================================================
   QUICK LIVE CLASS
   ========================================================= */

on(
    'quickLiveClass',
    'click',
    () => {

        openLiveClass(
            `Apex-Live-${Date.now()}`
        );

    }
);


/* =========================================================
   SCHEDULE VIEW
   ========================================================= */

function renderSchedule() {

    const container =
        $('scheduleList');

    if (
        container.__missing
    ) {
        return;
    }


    container.innerHTML =
        DEFAULT_SCHEDULE
            .map(
                item => `

                    <div class="schedule-item">

                        <div>

                            <strong>
                                ${esc(item.course)}
                            </strong>

                            <span>
                                ${esc(item.instructor)}
                            </span>

                        </div>

                        <div>

                            <b>
                                ${esc(item.day)}
                            </b>

                            <span>
                                ${esc(item.time)}
                            </span>

                        </div>

                    </div>

                `
            )
            .join('');

}


/* =========================================================
   SETTINGS VIEW
   ========================================================= */

function renderSettings() {

    const container =
        $('customView');

    if (
        container.__missing
    ) {
        return;
    }


    container.innerHTML = `

        <section class="admin-panel-card">

            <div class="panel-head">

                <div>

                    <h2>
                        Academy Settings
                    </h2>

                    <p>
                        Manage admin-side preferences.
                    </p>

                </div>

            </div>


            <div class="settings-grid">

                <label class="setting-item">

                    <span>
                        Admin Name
                    </span>

                    <input
                        id="settingsAdminName"
                        value="${esc(ADMIN_NAME)}"
                        readonly
                    >

                </label>


                <label class="setting-item">

                    <span>
                        Admin Email
                    </span>

                    <input
                        id="settingsAdminEmail"
                        value="${esc(
                            currentUser?.email ||
                            ''
                        )}"
                        readonly
                    >

                </label>


                <label class="setting-item">

                    <span>
                        Firebase Authentication
                    </span>

                    <input
                        value="Connected"
                        readonly
                    >

                </label>


                <label class="setting-item">

                    <span>
                        Admin UID
                    </span>

                    <input
                        value="${esc(ADMIN_UID)}"
                        readonly
                    >

                </label>

            </div>


            <div class="settings-actions">

                <button
                    id="settingsRefresh"
                    type="button"
                    class="btn btn-primary"
                >
                    Refresh Firebase Data
                </button>

                <button
                    id="settingsTheme"
                    type="button"
                    class="btn btn-secondary"
                >
                    Toggle Theme
                </button>

            </div>

        </section>

    `;


    on(
        'settingsRefresh',
        'click',
        async () => {

            await loadAll();

            toast(
                'Firebase data refreshed'
            );

        }
    );


    on(
        'settingsTheme',
        'click',
        toggleTheme
    );


    renderSchedule();

}


/* =========================================================
   AUDIT VIEW
   ========================================================= */

function renderAudit() {

    const container =
        $('customView');

    if (
        container.__missing
    ) {
        return;
    }


    let records = [];


    try {

        records =
            JSON.parse(
                localStorage.getItem(
                    'apex_admin_audit'
                ) || '[]'
            );

        if (!Array.isArray(records)) {
            records = [];
        }

    } catch {

        records = [];

    }


    container.innerHTML = `

        <section class="admin-panel-card">

            <div class="panel-head">

                <div>

                    <h2>
                        Admin Audit
                    </h2>

                    <p>
                        Recent administrative actions
                        recorded in this browser.
                    </p>

                </div>


                <button
                    id="clearAudit"
                    type="button"
                    class="btn btn-secondary"
                >
                    Clear Local Audit
                </button>

            </div>


            <div class="audit-list">

                ${
                    records.length

                    ?

                    records
                        .map(
                            item => `

                                <div class="audit-item">

                                    <strong>
                                        ${esc(item.action)}
                                    </strong>

                                    <span>
                                        ${esc(item.detail)}
                                    </span>

                                    <time>
                                        ${esc(
                                            new Date(
                                                item.time
                                            ).toLocaleString()
                                        )}
                                    </time>

                                </div>

                            `
                        )
                        .join('')

                    :

                    `
                        <div class="empty">
                            No audit activity found.
                        </div>
                    `
                }

            </div>

        </section>

    `;


    on(
        'clearAudit',
        'click',
        () => {

            const confirmed =
                window.confirm(
                    'Clear local admin audit history?'
                );

            if (!confirmed) {
                return;
            }


            try {

                localStorage.removeItem(
                    'apex_admin_audit'
                );

            } catch {}


            renderAudit();

            toast(
                'Local audit history cleared'
            );

        }
    );

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    document.body
        .classList
        .toggle('admin-light');


    const light =
        document.body
            .classList
            .contains(
                'admin-light'
            );


    try {

        localStorage.setItem(
            'apex_admin_theme',
            light
                ? 'light'
                : 'dark'
        );

    } catch {}


    toast(
        light
            ? 'Light theme enabled'
            : 'Dark theme enabled'
    );

}


/* =========================================================
   RESTORE THEME
   ========================================================= */

try {

    if (
        localStorage.getItem(
            'apex_admin_theme'
        ) === 'light'
    ) {

        document.body
            .classList
            .add(
                'admin-light'
            );

    }

} catch {}


/* =========================================================
   THEME BUTTON
   ========================================================= */

on(
    'themeBtn',
    'click',
    toggleTheme
);


/* =========================================================
   PROFILE MENU
   ========================================================= */

on(
    'adminProfile',
    'click',
    () => {

        $('profileMenu')
            .classList
            .toggle('open');

    }
);


/* =========================================================
   CLOSE PROFILE MENU OUTSIDE
   ========================================================= */

document.addEventListener(
    'click',
    event => {

        const menu =
            $('profileMenu');

        const profile =
            $('adminProfile');


        if (
            menu.__missing ||
            profile.__missing
        ) {
            return;
        }


        if (
            !menu.contains(
                event.target
            ) &&
            !profile.contains(
                event.target
            )
        ) {

            menu.classList.remove(
                'open'
            );

        }

    }
);


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

on(
    'quickAddStudent',
    'click',
    () => {

        switchTab(
            'students'
        );

        setTimeout(
            addRecord,
            0
        );

    }
);


on(
    'quickAddInstructor',
    'click',
    () => {

        switchTab(
            'instructors'
        );

        setTimeout(
            addRecord,
            0
        );

    }
);


on(
    'quickAnnouncement',
    'click',
    () => {

        switchTab(
            'announcements'
        );

        setTimeout(
            addRecord,
            0
        );

    }
);


on(
    'quickEmail',
    'click',
    () => {

        switchTab(
            'emailCenter'
        );

    }
);


/* =========================================================
   MESSAGE QUICK VIEW
   ========================================================= */

on(
    'viewMessages',
    'click',
    () => {

        switchTab(
            'messages'
        );

    }
);


/* =========================================================
   STUDENT QUICK FILTER
   ========================================================= */

on(
    'allStudents',
    'click',
    () => {

        switchTab(
            'students'
        );

        const filter =
            $('studentCourseFilter');

        if (
            !filter.__missing
        ) {
            filter.value = '';
        }

        renderModule();

    }
);


/* =========================================================
   COURSE FILTER
   ========================================================= */

on(
    'courseFilter',
    'change',
    renderModule
);


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Escape'
        ) {

            closeModal();

            closeLiveClass();

        }

    }
);


/* =========================================================
   ENTERPRISE SAFETY CHECK
   ========================================================= */

window.addEventListener(
    'error',
    event => {

        /*
         * Prevent one UI component error from
         * taking down the whole admin interface.
         */

        if (
            event?.error
        ) {

            try {

                console.error(
                    '[Apex Admin]',
                    event.error
                );

            } catch {}

        }

    }
);


/* =========================================================
   UNHANDLED PROMISE SAFETY
   ========================================================= */

window.addEventListener(
    'unhandledrejection',
    event => {

        try {

            console.error(
                '[Apex Admin Promise]',
                event.reason
            );

        } catch {}

    }
);


/* =========================================================
   READY FLAG
   ========================================================= */

window.__APEX_ADMIN_READY__ = true;


/* =========================================================
   INITIAL ACTIVITY
   ========================================================= */

renderActivity();
/* =========================================================
   PART 3/3 — FINAL INITIALIZATION & SAFETY
   ========================================================= */


/* =========================================================
   ADMIN UI INITIALIZATION
   ========================================================= */

function initializeAdminPanel() {

    try {

        /* -------------------------
           Initial dashboard state
        ------------------------- */

        if (currentTab === 'dashboard') {
            renderDashboard();
        }


        /* -------------------------
           Initial activity
        ------------------------- */

        renderActivity();


        /* -------------------------
           Default student filter
        ------------------------- */

        const studentFilter =
            $('studentCourseFilter');

        if (
            studentFilter &&
            !studentFilter.__missing
        ) {

            if (!studentFilter.value) {
                studentFilter.value = '';
            }

        }


        /* -------------------------
           Search reset
        ------------------------- */

        const moduleSearch =
            $('moduleSearch');

        if (
            moduleSearch &&
            !moduleSearch.__missing
        ) {

            moduleSearch.value =
                moduleSearch.value || '';

        }


        /* -------------------------
           Status filter
        ------------------------- */

        const statusFilter =
            $('statusFilter');

        if (
            statusFilter &&
            !statusFilter.__missing
        ) {

            statusFilter.value =
                statusFilter.value || '';

        }


        /* -------------------------
           Page ready indicator
        ------------------------- */

        document.documentElement
            .classList
            .add('apex-admin-ready');


        document.body
            .classList
            .add('apex-admin-ready');


    } catch (error) {

        console.error(
            '[Apex Admin] Initialization error:',
            error
        );

    }

}


/* =========================================================
   SAFE WINDOW LOAD
   ========================================================= */

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeAdminPanel,
        {
            once: true
        }
    );

} else {

    initializeAdminPanel();

}


/* =========================================================
   GLOBAL MODAL SAFETY
   ========================================================= */

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Escape'
        ) {

            try {
                closeModal();
            } catch {}

            try {
                closeLiveClass();
            } catch {}

        }

    }
);


/* =========================================================
   CLICK OUTSIDE DROPDOWNS
   ========================================================= */

document.addEventListener(
    'click',
    event => {

        try {

            document
                .querySelectorAll(
                    '.dropdown.open, .profile-menu.open'
                )
                .forEach(menu => {

                    if (
                        !menu.contains(
                            event.target
                        )
                    ) {

                        menu.classList.remove(
                            'open'
                        );

                    }

                });

        } catch {}

    }
);


/* =========================================================
   MOBILE SIDEBAR SAFETY
   ========================================================= */

on(
    'sidebarClose',
    'click',
    () => {

        const sidebar =
            $('sidebar');

        if (
            !sidebar.__missing
        ) {

            sidebar.classList.remove(
                'open'
            );

        }

    }
);


on(
    'mobileOverlay',
    'click',
    () => {

        const sidebar =
            $('sidebar');

        if (
            !sidebar.__missing
        ) {

            sidebar.classList.remove(
                'open'
            );

        }

    }
);


/* =========================================================
   BODY SCROLL SAFETY
   ========================================================= */

function updateAdminBodyState() {

    try {

        const sidebar =
            $('sidebar');

        const modal =
            $('modalBg');

        const live =
            $('liveOverlay');


        const sidebarOpen =
            sidebar &&
            !sidebar.__missing &&
            sidebar.classList.contains(
                'open'
            );


        const modalOpen =
            modal &&
            !modal.__missing &&
            modal.classList.contains(
                'open'
            );


        const liveOpen =
            live &&
            !live.__missing &&
            live.classList.contains(
                'open'
            );


        document.body.classList.toggle(
            'apex-lock-scroll',
            Boolean(
                sidebarOpen ||
                modalOpen ||
                liveOpen
            )
        );

    } catch {}

}


const originalCloseModal =
    closeModal;


function safeCloseModal() {

    try {

        originalCloseModal();

    } catch {}

    updateAdminBodyState();

}


const originalCloseLiveClass =
    closeLiveClass;


function safeCloseLiveClass() {

    try {

        originalCloseLiveClass();

    } catch {}

    updateAdminBodyState();

}


/* =========================================================
   MODAL OBSERVER
   ========================================================= */

try {

    const modal =
        $('modalBg');

    if (
        modal &&
        !modal.__missing
    ) {

        const observer =
            new MutationObserver(
                updateAdminBodyState
            );

        observer.observe(
            modal,
            {
                attributes: true,
                attributeFilter: [
                    'class'
                ]
            }
        );

    }

} catch {}


/* =========================================================
   JITSI SAFETY
   ========================================================= */

window.addEventListener(
    'beforeunload',
    () => {

        try {

            if (jitsi) {
                jitsi.dispose();
            }

        } catch {}

    }
);


/* =========================================================
   FIREBASE AUTH SAFETY
   ========================================================= */

window.addEventListener(
    'online',
    () => {

        const status =
            $('liveStatus');

        if (
            status &&
            !status.__missing
        ) {

            status.textContent =
                'Connection restored';

        }

    }
);


window.addEventListener(
    'offline',
    () => {

        const status =
            $('liveStatus');

        if (
            status &&
            !status.__missing
        ) {

            status.textContent =
                'You are offline — Firebase sync paused';

        }

        toast(
            'Internet connection lost.',
            true
        );

    }
);


/* =========================================================
   FIREBASE DATA REFRESH ON TAB RETURN
   ========================================================= */

document.addEventListener(
    'visibilitychange',
    async () => {

        if (
            document.visibilityState !==
            'visible'
        ) {
            return;
        }


        if (
            !currentUser
        ) {
            return;
        }


        try {

            await loadAll();

        } catch {

            /*
             * Do not break the admin panel if
             * background refresh fails.
             */

        }

    }
);


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    'keydown',
    event => {

        /*
         * Ctrl + K
         * Focus global search
         */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === 'k'
        ) {

            event.preventDefault();

            const search =
                $('globalSearch');

            if (
                search &&
                !search.__missing
            ) {

                search.focus();

            }

        }


        /*
         * Ctrl + R
         * Refresh Firebase data
         */

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === 'r'
        ) {

            /*
             * Don't override the browser's
             * native refresh.
             */

            return;

        }

    }
);


/* =========================================================
   PREVENT DOUBLE SUBMIT
   ========================================================= */

document.addEventListener(
    'submit',
    event => {

        const form =
            event.target;

        if (
            !form ||
            !form.querySelector
        ) {
            return;
        }


        if (
            form.dataset.submitting === 'true'
        ) {

            event.preventDefault();

            return;

        }


        form.dataset.submitting =
            'true';


        setTimeout(
            () => {

                try {

                    delete form.dataset.submitting;

                } catch {}

            },
            5000
        );

    }
);


/* =========================================================
   SAFE ERROR REPORTING
   ========================================================= */

window.addEventListener(
    'error',
    event => {

        try {

            console.error(
                '[Apex Admin Error]',
                {
                    message:
                        event.message,

                    source:
                        event.filename,

                    line:
                        event.lineno,

                    column:
                        event.colno
                }
            );

        } catch {}

    }
);


window.addEventListener(
    'unhandledrejection',
    event => {

        try {

            console.error(
                '[Apex Admin Promise Error]',
                event.reason
            );

        } catch {}

    }
);


/* =========================================================
   FINAL READY STATE
   ========================================================= */

window.__APEX_ADMIN_READY__ =
    true;


window.__APEX_ADMIN_VERSION__ =
    '2026.09-secure';


document.documentElement.dataset.apexAdmin =
    'ready';


console.info(
    '[Apex Admin] Admin controller initialized successfully.'
);
