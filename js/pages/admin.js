/* =========================================================
   APEX LEARNING ACADEMY
   ADMIN COMMAND CENTER
   Production-safe admin controller
   ========================================================= */

import { auth, db } from "../../config/firebase-config.js";

import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   CONFIG
   ========================================================= */

const ADMIN_UID = "VHbqYaHK6yXP2f8IF9WKc33kkD73";

const ADMIN_NAME = "Mukesh Kewal";

const EMAILJS_PUBLIC_KEY = "0CuJdjkOPS6ovXLmt";

/*
   If you already use EmailJS service/template IDs,
   put them here.
*/
const EMAILJS_SERVICE_ID = "";
const EMAILJS_TEMPLATE_ID = "";


/* =========================================================
   STATE
   ========================================================= */

const state = {
    currentUser: null,
    activeTab: "dashboard",
    rows: [],
    filteredRows: [],
    currentCollection: "",
    currentModule: "",
    liveApi: null,
    liveRoom: "",
    busy: false,
    listenersBound: false,
    lastModalTrigger: null
};


/* =========================================================
   MODULE DEFINITIONS
   ========================================================= */

const MODULES = {

    students: {
        title: "Students",
        collection: "students",
        search: [
            "name",
            "fullName",
            "email",
            "phone",
            "course",
            "courseName",
            "status"
        ]
    },

    instructors: {
        title: "Instructors",
        collection: "instructors",
        search: [
            "name",
            "fullName",
            "email",
            "phone",
            "status"
        ]
    },

    messages: {
        title: "Messages",
        collection: "messages",
        search: [
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "status"
        ]
    },

    fees: {
        title: "Fees & Payments",
        collection: "fees",
        search: [
            "name",
            "studentName",
            "email",
            "studentUid",
            "amount",
            "status",
            "course"
        ]
    },

    progress: {
        title: "Course Progress",
        collection: "progress",
        search: [
            "name",
            "studentName",
            "email",
            "course",
            "courseName",
            "status"
        ]
    },

    attendance: {
        title: "Attendance",
        collection: "attendance",
        search: [
            "name",
            "studentName",
            "email",
            "course",
            "status",
            "date"
        ]
    },

    tests: {
        title: "Tests & Results",
        collection: "testResults",
        search: [
            "name",
            "studentName",
            "email",
            "rollNumber",
            "course",
            "score",
            "status"
        ]
    },

    certificates: {
        title: "Certificates",
        collection: "certificates",
        search: [
            "name",
            "studentName",
            "email",
            "certificateId",
            "course",
            "status"
        ]
    },

    announcements: {
        title: "Announcements",
        collection: "announcements",
        search: [
            "title",
            "message",
            "status",
            "course"
        ]
    },

    reviews: {
        title: "Reviews",
        collection: "reviews",
        search: [
            "name",
            "email",
            "review",
            "message",
            "status",
            "rating"
        ]
    },

    coupons: {
        title: "Coupons",
        collection: "coupons",
        search: [
            "code",
            "title",
            "discount",
            "status"
        ]
    },

    emailLogs: {
        title: "Email Logs",
        collection: "emailLogs",
        search: [
            "to",
            "email",
            "subject",
            "status",
            "type"
        ]
    },

    courses: {
        title: "Courses",
        collection: "courses",
        search: [
            "title",
            "name",
            "description",
            "status"
        ]
    },

    batches: {
        title: "Batches",
        collection: "batches",
        search: [
            "name",
            "course",
            "status",
            "instructor"
        ]
    },

    visitors: {
        title: "Visitors",
        collection: "visitors",
        search: [
            "page",
            "path",
            "device",
            "browser",
            "country"
        ]
    },

    visits: {
        title: "Page Views",
        collection: "visits",
        search: [
            "page",
            "path",
            "device",
            "browser"
        ]
    },

    settings: {
        title: "Academy Settings",
        collection: "academySettings",
        search: [
            "name",
            "value",
            "key"
        ]
    },

    audit: {
        title: "Admin Audit",
        collection: "adminAudit",
        search: [
            "action",
            "module",
            "admin",
            "email"
        ]
    }

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function exists(id) {
    return !!$(id);
}


function on(id, event, handler, options) {

    const element = $(id);

    if (!element) {
        return false;
    }

    element.addEventListener(
        event,
        handler,
        options || false
    );

    return true;
}


function setText(id, value) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);
}


function setHTML(id, html) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.innerHTML = html || "";
}


function show(id) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.hidden = false;
    element.classList.remove("hidden");
}


function hide(id) {

    const element = $(id);

    if (!element) {
        return;
    }

    element.hidden = true;
    element.classList.add("hidden");
}


function toggle(id, visible) {

    if (visible) {
        show(id);
    } else {
        hide(id);
    }

}


/* =========================================================
   SECURITY / HTML ESCAPE
   ========================================================= */

function esc(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

/*
   IMPORTANT:
   Do NOT use /.../ix here.
   JavaScript does not support the x regex flag.
*/

function isDateField(field) {

    const name = String(
        field ?? ""
    )
        .trim()
        .toLowerCase();

    const dateFields = [
        "date",
        "time",
        "expiresat",
        "issuedat",
        "paidat",
        "createdat",
        "updatedat",
        "submittedat",
        "publishedat",
        "joinedat",
        "leftat",
        "sentat"
    ];

    return dateFields.some(
        suffix => name === suffix ||
        name.endsWith(suffix)
    );
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    try {

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else if (
            value &&
            typeof value.seconds === "number"
        ) {
            date = new Date(
                value.seconds * 1000
            );
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return new Intl.DateTimeFormat(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

    } catch (_) {

        return String(value);

    }
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function toast(message, type = "info") {

    const element = $("toast");

    if (!element) {
        return;
    }

    element.textContent = message || "";
    element.className =
        "toast toast-" + type;

    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => {
            element.classList.remove("show");
        },
        3200
    );
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(
    title,
    body,
    footer = ""
) {

    const bg = $("modalBg");

    if (!bg) {
        return;
    }

    setText(
        "modalTitle",
        title
    );

    setHTML(
        "modalBody",
        body
    );

    setHTML(
        "modalFoot",
        footer
    );

    bg.classList.add("open");
    bg.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal() {

    const bg = $("modalBg");

    if (!bg) {
        return;
    }

    bg.classList.remove("open");
    bg.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    if (
        state.lastModalTrigger &&
        typeof state.lastModalTrigger.focus ===
        "function"
    ) {
        try {
            state.lastModalTrigger.focus();
        } catch (_) {}
    }

    state.lastModalTrigger = null;
}


/* =========================================================
   LIVE MODAL
   ========================================================= */

function openLiveModal() {

    const bg = $("liveBg");

    if (!bg) {
        return;
    }

    const input = $("liveRoomName");

    if (input && !input.value.trim()) {

        input.value =
            "Apex-Live-" +
            Date.now().toString().slice(-6);

    }

    bg.classList.add("open");

    bg.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    if (input) {
        setTimeout(
            () => input.focus(),
            50
        );
    }
}


function closeLiveModal() {

    const bg = $("liveBg");

    if (!bg) {
        return;
    }

    bg.classList.remove("open");

    bg.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   AUTH
   ========================================================= */

async function loginAdmin(event) {

    event.preventDefault();

    if (state.busy) {
        return;
    }

    const emailElement = $("email");
    const passwordElement = $("password");
    const submit = $("loginSubmit");
    const error = $("loginError");

    const email =
        emailElement
            ? emailElement.value.trim()
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    if (!email || !password) {

        if (error) {
            error.textContent =
                "Please enter your admin email and password.";

            error.classList.remove("hidden");
        }

        return;
    }

    state.busy = true;

    if (submit) {
        submit.disabled = true;
        submit.textContent =
            "Signing in...";
    }

    if (error) {
        error.textContent = "";
        error.classList.add("hidden");
    }

    try {

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        if (
            !result ||
            !result.user
        ) {
            throw new Error(
                "Authentication failed."
            );
        }

        if (
            result.user.uid !==
            ADMIN_UID
        ) {

            await signOut(auth);

            throw new Error(
                "This account is not authorized for the administration panel."
            );
        }

        toast(
            "Admin authentication successful.",
            "success"
        );

    } catch (errorObject) {

        const message =
            friendlyAuthError(
                errorObject
            );

        if (error) {
            error.textContent = message;
            error.classList.remove("hidden");
        }

        toast(
            message,
            "error"
        );

    } finally {

        state.busy = false;

        if (submit) {
            submit.disabled = false;
            submit.textContent =
                "Enter Command Center";
        }

    }
}


function friendlyAuthError(errorObject) {

    const code =
        errorObject &&
        errorObject.code
            ? errorObject.code
            : "";

    const map = {

        "auth/invalid-credential":
            "Invalid admin email or password.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/user-disabled":
            "This admin account has been disabled.",

        "auth/too-many-requests":
            "Too many attempts. Please wait and try again.",

        "auth/network-request-failed":
            "Network error. Check your internet connection.",

        "auth/user-not-found":
            "Invalid admin email or password.",

        "auth/wrong-password":
            "Invalid admin email or password."

    };

    return (
        map[code] ||
        "Unable to sign in. Please try again."
    );
}


async function logoutAdmin() {

    try {

        await signOut(auth);

        closeModal();
        closeLiveModal();

        toast(
            "Signed out successfully.",
            "success"
        );

    } catch (_) {

        toast(
            "Unable to sign out. Please try again.",
            "error"
        );

    }
}


/* =========================================================
   AUTH UI
   ========================================================= */

function showApplication() {

    hide("login");
    show("app");

    document.body.classList.add(
        "admin-authenticated"
    );

    setText(
        "welcomeTitle",
        "Good morning, " +
        ADMIN_NAME
    );

    setText(
        "liveStatus",
        "Firebase connected dashboard"
    );

    loadDashboard()
        .catch(() => {
            toast(
                "Dashboard loaded with limited data.",
                "warning"
            );
        });

    activateTab("dashboard");
}


function showLogin() {

    show("login");
    hide("app");

    document.body.classList.remove(
        "admin-authenticated"
    );

    const email = $("email");

    if (email) {
        setTimeout(
            () => email.focus(),
            100
        );
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function activateTab(tab) {

    state.activeTab =
        String(tab || "dashboard");

    document
        .querySelectorAll(
            ".nav-item[data-tab]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.tab ===
                state.activeTab
            );

        });

    if (
        state.activeTab ===
        "dashboard"
    ) {

        show("dashboardView");
        hide("moduleView");
        hide("customView");

        setText(
            "pageTitle",
            "Overview"
        );

        closeMobileSidebar();

        return;
    }

    hide("dashboardView");

    if (
        state.activeTab ===
        "liveClasses"
    ) {

        hide("moduleView");
        show("customView");

        setText(
            "pageTitle",
            "Live Classes"
        );

        renderLiveClassesPage();

        closeMobileSidebar();

        return;
    }

    const module =
        MODULES[state.activeTab];

    if (!module) {

        show("customView");
        hide("moduleView");

        setText(
            "pageTitle",
            state.activeTab
        );

        setHTML(
            "customViewContent",
            emptyState(
                "Module unavailable",
                "This administration section is not configured."
            )
        );

        closeMobileSidebar();

        return;
    }

    hide("customView");
    show("moduleView");

    setText(
        "pageTitle",
        module.title
    );

    state.currentModule =
        state.activeTab;

    state.currentCollection =
        module.collection;

    clearModuleControls();

    loadModule(
        state.activeTab
    )
        .catch(() => {

            setHTML(
                "moduleTable",
                emptyState(
                    "Unable to load",
                    "The module could not be loaded right now."
                )
            );

        });

    closeMobileSidebar();
}


function clearModuleControls() {

    const search = $("moduleSearch");

    if (search) {
        search.value = "";
    }

    const status = $("statusFilter");

    if (status) {
        status.value = "";
    }

    const course =
        $("studentCourseFilter");

    if (course) {

        course.hidden =
            state.activeTab !==
            "students";

        course.value = "";

    }
}


/* =========================================================
   MOBILE NAV
   ========================================================= */

function toggleMobileSidebar() {

    const sidebar = $("sidebar");
    const button = $("menuBtn");

    if (!sidebar) {
        return;
    }

    const open =
        sidebar.classList.toggle(
            "mobile-open"
        );

    document.body.classList.toggle(
        "sidebar-open",
        open
    );

    if (button) {
        button.setAttribute(
            "aria-expanded",
            String(open)
        );
    }
}


function closeMobileSidebar() {

    const sidebar = $("sidebar");
    const button = $("menuBtn");

    if (sidebar) {
        sidebar.classList.remove(
            "mobile-open"
        );
    }

    document.body.classList.remove(
        "sidebar-open"
    );

    if (button) {
        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

    const root =
        document.documentElement;

    const dark =
        root.classList.toggle(
            "admin-light"
        );

    try {
        localStorage.setItem(
            "apex_admin_theme",
            dark
                ? "light"
                : "dark"
        );
    } catch (_) {}

}


function restoreTheme() {

    try {

        const theme =
            localStorage.getItem(
                "apex_admin_theme"
            );

        if (theme === "light") {

            document.documentElement
                .classList.add(
                    "admin-light"
                );

        }

    } catch (_) {}

}


/* =========================================================
   FIRESTORE HELPERS
   ========================================================= */

async function getCollectionRows(
    collectionName,
    maxRows = 500
) {

    if (!collectionName) {
        return [];
    }

    try {

        let snapshot;

        try {

            snapshot =
                await getDocs(
                    query(
                        collection(
                            db,
                            collectionName
                        ),
                        orderBy(
                            "createdAt",
                            "desc"
                        ),
                        limit(maxRows)
                    )
                );

        } catch (_) {

            snapshot =
                await getDocs(
                    query(
                        collection(
                            db,
                            collectionName
                        ),
                        limit(maxRows)
                    )
                );

        }

        return snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );

    } catch (errorObject) {

        throw errorObject;

    }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function countCollection(
    collectionName
) {

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        collectionName
                    ),
                    limit(500)
                )
            );

        return snapshot.size;

    } catch (_) {

        return 0;

    }
}


async function loadDashboard() {

    const collections = [
        "students",
        "instructors",
        "fees",
        "messages",
        "testResults",
        "attendance"
    ];

    const values =
        await Promise.all(
            collections.map(
                countCollection
            )
        );

    setText(
        "s-students",
        values[0]
    );

    setText(
        "s-instructors",
        values[1]
    );

    setText(
        "s-fees",
        values[2]
    );

    setText(
        "s-messages",
        values[3]
    );

    setText(
        "s-tests",
        values[4]
    );

    setText(
        "s-attendance",
        values[5]
    );

    setText(
        "c-students",
        values[0]
    );

    setText(
        "c-instructors",
        values[1]
    );

    setText(
        "c-messages",
        values[3]
    );

    renderSnapshot(
        values
    );

    renderActivity();

    renderStudentSegmentation();

}


function renderSnapshot(values) {

    const names = [
        "Students",
        "Instructors",
        "Fee Records",
        "Messages",
        "Test Results",
        "Attendance"
    ];

    const html = names.map(
        (name, index) => {

            return `
                <div class="snapshot-row">
                    <span>${esc(name)}</span>
                    <strong>${esc(values[index])}</strong>
                </div>
            `;

        }
    ).join("");

    setHTML(
        "snapshot",
        html
    );
}


/* =========================================================
   STUDENT SEGMENTATION
   ========================================================= */

async function renderStudentSegmentation() {

    const target =
        $("studentSegmentation");

    if (!target) {
        return;
    }

    try {

        const rows =
            await getCollectionRows(
                "students",
                500
            );

        const counts = {};

        rows.forEach(
            row => {

                const course =
                    String(
                        row.course ||
                        row.courseName ||
                        row.program ||
                        "Unassigned / Other"
                    ).trim();

                counts[course] =
                    (counts[course] || 0) + 1;

            }
        );

        const entries =
            Object.entries(counts);

        if (!entries.length) {

            target.innerHTML = "";

            return;
        }

        target.innerHTML = `
            <div class="segmentation-grid">
                ${entries.map(
                    ([course, count]) => `
                        <button
                            class="seg-card"
                            type="button"
                            data-course="${esc(course)}"
                        >
                            <span>${esc(course)}</span>
                            <strong>${esc(count)}</strong>
                            <small>Students</small>
                        </button>
                    `
                ).join("")}
            </div>
        `;

        target
            .querySelectorAll(
                "[data-course]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        activateTab(
                            "students"
                        );

                        const filter =
                            $("studentCourseFilter");

                        if (filter) {

                            filter.hidden =
                                false;

                            filter.value =
                                button.dataset.course;

                            applyFilters();

                        }

                    }
                );

            });

    } catch (_) {

        target.innerHTML = "";

    }
}


/* =========================================================
   MODULE LOADING
   ========================================================= */

async function loadModule(tab) {

    const module =
        MODULES[tab];

    if (!module) {
        return;
    }

    const target =
        $("moduleTable");

    if (!target) {
        return;
    }

    target.innerHTML = `
        <div class="loader">
            Loading ${esc(module.title)}...
        </div>
    `;

    try {

        const rows =
            await getCollectionRows(
                module.collection,
                500
            );

        state.rows = rows;
        state.filteredRows = rows.slice();

        renderModule();

    } catch (errorObject) {

        state.rows = [];
        state.filteredRows = [];

        target.innerHTML =
            emptyState(
                "Unable to load data",
                "Firebase could not return this module."
            );

    }

}


function applyFilters() {

    const searchElement =
        $("moduleSearch");

    const statusElement =
        $("statusFilter");

    const courseElement =
        $("studentCourseFilter");

    const search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";

    const status =
        statusElement
            ? statusElement.value
                .trim()
                .toLowerCase()
            : "";

    const course =
        courseElement &&
        !courseElement.hidden
            ? courseElement.value
            : "";

    state.filteredRows =
        state.rows.filter(
            row => {

                if (search) {

                    const module =
                        MODULES[
                            state.activeTab
                        ];

                    const keys =
                        module &&
                        module.search
                            ? module.search
                            : Object.keys(row);

                    const found =
                        keys.some(
                            key => {

                                return String(
                                    row[key] ?? ""
                                )
                                    .toLowerCase()
                                    .includes(search);

                            }
                        );

                    if (!found) {
                        return false;
                    }

                }

                if (status) {

                    const value =
                        String(
                            row.status ||
                            row.state ||
                            row.paymentStatus ||
                            ""
                        )
                            .toLowerCase();

                    if (
                        value !== status
                    ) {
                        return false;
                    }

                }

                if (
                    course &&
                    state.activeTab ===
                    "students"
                ) {

                    const rowCourse =
                        String(
                            row.course ||
                            row.courseName ||
                            row.program ||
                            ""
                        );

                    if (
                        course ===
                        "__unassigned__"
                    ) {

                        if (
                            rowCourse.trim()
                        ) {
                            return false;
                        }

                    } else if (
                        rowCourse !==
                        course
                    ) {

                        return false;

                    }

                }

                return true;

            }
        );

    renderModule();
}


function renderModule() {

    const target =
        $("moduleTable");

    if (!target) {
        return;
    }

    const rows =
        state.filteredRows;

    if (!rows.length) {

        target.innerHTML =
            emptyState(
                "No records found",
                "No records match the current filters."
            );

        return;
    }

    const columns =
        getColumns(rows);

    target.innerHTML = `
        <div class="table-scroll">
            <table class="admin-table">
                <thead>
                    <tr>
                        ${columns.map(
                            column =>
                                `<th>${esc(
                                    prettyLabel(column)
                                )}</th>`
                        ).join("")}
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(
                        row =>
                            renderTableRow(
                                row,
                                columns
                            )
                    ).join("")}
                </tbody>
            </table>
        </div>
    `;

    target
        .querySelectorAll(
            "[data-view-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const row =
                            state.rows.find(
                                item =>
                                    item.id ===
                                    button.dataset.viewId
                            );

                        if (row) {
                            showRecord(
                                row
                            );
                        }

                    }
                );

            }
        );

    target
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const row =
                            state.rows.find(
                                item =>
                                    item.id ===
                                    button.dataset.deleteId
                            );

                        if (row) {
                            confirmDelete(
                                row
                            );
                        }

                    }
                );

            }
        );

    target
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const row =
                            state.rows.find(
                                item =>
                                    item.id ===
                                    button.dataset.editId
                            );

                        if (row) {
                            editRecord(
                                row
                            );
                        }

                    }
                );

            }
        );
}


function getColumns(rows) {

    const ignored = new Set([
        "id",
        "password",
        "token",
        "refreshToken",
        "accessToken",
        "apiKey"
    ]);

    const columns = [];

    rows.forEach(
        row => {

            Object.keys(row)
                .forEach(
                    key => {

                        if (
                            ignored.has(key)
                        ) {
                            return;
                        }

                        if (
                            columns.length >= 7
                        ) {
                            return;
                        }

                        if (
                            !columns.includes(key)
                        ) {
                            columns.push(key);
                        }

                    }
                );

        }
    );

    return columns.slice(0, 7);
}


function renderTableRow(
    row,
    columns
) {

    return `
        <tr>

            ${columns.map(
                key => {

                    const value =
                        row[key];

                    return `
                        <td>
                            ${esc(
                                displayValue(
                                    key,
                                    value
                                )
                            )}
                        </td>
                    `;

                }
            ).join("")}

            <td>

                <div class="row-actions">

                    <button
                        class="table-action"
                        type="button"
                        data-view-id="${esc(row.id)}"
                    >
                        View
                    </button>

                    <button
                        class="table-action"
                        type="button"
                        data-edit-id="${esc(row.id)}"
                    >
                        Edit
                    </button>

                    <button
                        class="table-action danger"
                        type="button"
                        data-delete-id="${esc(row.id)}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;
}


function displayValue(
    key,
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    if (
        isDateField(key)
    ) {
        return formatDate(value);
    }

    if (
        typeof value === "object"
    ) {

        if (
            typeof value.toDate ===
            "function"
        ) {
            return formatDate(
                value
            );
        }

        try {
            return JSON.stringify(
                value
            );
        } catch (_) {
            return "[Object]";
        }

    }

    return String(value);
}


function prettyLabel(value) {

    return String(value)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}


/* =========================================================
   RECORD VIEW
   ========================================================= */

function showRecord(row) {

    state.lastModalTrigger =
        document.activeElement;

    const entries =
        Object.entries(row);

    const html = `
        <div class="record-list">
            ${entries.map(
                ([key, value]) => `
                    <div class="record-item">

                        <span>
                            ${esc(
                                prettyLabel(
                                    key
                                )
                            )}
                        </span>

                        <strong>
                            ${esc(
                                displayValue(
                                    key,
                                    value
                                )
                            )}
                        </strong>

                    </div>
                `
            ).join("")}
        </div>
    `;

    openModal(
        "Record Details",
        html
    );
}


/* =========================================================
   EDIT RECORD
   ========================================================= */

function editRecord(row) {

    state.lastModalTrigger =
        document.activeElement;

    const editableKeys =
        Object.keys(row)
            .filter(
                key =>
                    key !== "id" &&
                    key !== "createdAt" &&
                    key !== "updatedAt"
            )
            .slice(0, 20);

    const html = `
        <form id="editRecordForm">

            ${editableKeys.map(
                key => {

                    const value =
                        row[key];

                    const stringValue =
                        typeof value === "object"
                            ? ""
                            : String(
                                value ?? ""
                            );

                    return `
                        <div class="admin-field">

                            <label
                                for="edit_${esc(key)}"
                            >
                                ${esc(
                                    prettyLabel(
                                        key
                                    )
                                )}
                            </label>

                            <input
                                id="edit_${esc(key)}"
                                name="${esc(key)}"
                                value="${esc(stringValue)}"
                                maxlength="2000"
                            >

                        </div>
                    `;

                }
            ).join("")}

        </form>
    `;

    const footer = `
        <button
            class="btn btn-light"
            type="button"
            data-close-modal
        >
            Cancel
        </button>

        <button
            class="btn btn-primary"
            type="button"
            id="saveEditRecord"
        >
            Save Changes
        </button>
    `;

    openModal(
        "Edit Record",
        html,
        footer
    );

    on(
        "saveEditRecord",
        "click",
        () => saveEditedRecord(
            row,
            editableKeys
        )
    );

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    closeModal
                )
        );
}


async function saveEditedRecord(
    row,
    keys
) {

    if (state.busy) {
        return;
    }

    state.busy = true;

    try {

        const updates = {};

        keys.forEach(
            key => {

                const input =
                    document.getElementById(
                        "edit_" + key
                    );

                if (input) {
                    updates[key] =
                        input.value.trim();
                }

            }
        );

        updates.updatedAt =
            serverTimestamp();

        await updateDoc(
            doc(
                db,
                state.currentCollection,
                row.id
            ),
            updates
        );

        await writeAudit(
            "update",
            state.currentModule,
            row.id
        );

        closeModal();

        toast(
            "Record updated successfully.",
            "success"
        );

        await loadModule(
            state.currentModule
        );

    } catch (_) {

        toast(
            "Unable to update this record.",
            "error"
        );

    } finally {

        state.busy = false;

    }
}


/* =========================================================
   DELETE
   ========================================================= */

function confirmDelete(row) {

    state.lastModalTrigger =
        document.activeElement;

    const title =
        row.name ||
        row.fullName ||
        row.email ||
        row.id;

    const body = `
        <div class="danger-box">

            <strong>
                Delete this record?
            </strong>

            <p>
                This action cannot be undone.
            </p>

            <div class="danger-record">
                ${esc(title)}
            </div>

        </div>
    `;

    const footer = `
        <button
            class="btn btn-light"
            type="button"
            data-close-modal
        >
            Cancel
        </button>

        <button
            class="btn btn-danger"
            type="button"
            id="confirmDelete"
        >
            Delete Permanently
        </button>
    `;

    openModal(
        "Confirm Delete",
        body,
        footer
    );

    on(
        "confirmDelete",
        "click",
        () => deleteRecord(
            row
        )
    );

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    closeModal
                )
        );
}


async function deleteRecord(row) {

    if (state.busy) {
        return;
    }

    state.busy = true;

    try {

        await deleteDoc(
            doc(
                db,
                state.currentCollection,
                row.id
            )
        );

        await writeAudit(
            "delete",
            state.currentModule,
            row.id
        );

        closeModal();

        toast(
            "Record deleted successfully.",
            "success"
        );

        await loadModule(
            state.currentModule
        );

    } catch (_) {

        toast(
            "Unable to delete this record.",
            "error"
        );

    } finally {

        state.busy = false;

    }
}


/* =========================================================
   ADD RECORD
   ========================================================= */

function openAddModal() {

    const module =
        MODULES[state.activeTab];

    if (!module) {
        return;
    }

    const fields =
        module.search || [
            "name",
            "email",
            "status"
        ];

    const html = `
        <form id="addRecordForm">

            ${fields
                .slice(0, 10)
                .map(
                    key => `
                        <div class="admin-field">

                            <label
                                for="add_${esc(key)}"
                            >
                                ${esc(
                                    prettyLabel(
                                        key
                                    )
                                )}
                            </label>

                            <input
                                id="add_${esc(key)}"
                                name="${esc(key)}"
                                maxlength="2000"
                            >

                        </div>
                    `
                )
                .join("")}

        </form>
    `;

    const footer = `
        <button
            class="btn btn-light"
            type="button"
            data-close-modal
        >
            Cancel
        </button>

        <button
            class="btn btn-primary"
            type="button"
            id="saveAddRecord"
        >
            Create Record
        </button>
    `;

    openModal(
        "Add " + module.title,
        html,
        footer
    );

    on(
        "saveAddRecord",
        "click",
        saveAddRecord
    );

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    closeModal
                )
        );
}


async function saveAddRecord() {

    if (state.busy) {
        return;
    }

    state.busy = true;

    try {

        const module =
            MODULES[state.activeTab];

        if (!module) {
            return;
        }

        const data = {};

        (
            module.search || []
        ).slice(0, 10)
            .forEach(
                key => {

                    const input =
                        document.getElementById(
                            "add_" + key
                        );

                    if (
                        input &&
                        input.value.trim()
                    ) {
                        data[key] =
                            input.value.trim();
                    }

                }
            );

        data.createdAt =
            serverTimestamp();

        data.updatedAt =
            serverTimestamp();

        data.createdBy =
            ADMIN_UID;

        const result =
            await addDoc(
                collection(
                    db,
                    module.collection
                ),
                data
            );

        await writeAudit(
            "create",
            state.activeTab,
            result.id
        );

        closeModal();

        toast(
            "Record created successfully.",
            "success"
        );

        await loadModule(
            state.activeTab
        );

    } catch (_) {

        toast(
            "Unable to create this record.",
            "error"
        );

    } finally {

        state.busy = false;

    }
}


/* =========================================================
   AUDIT
   ========================================================= */

async function writeAudit(
    action,
    module,
    recordId
) {

    try {

        await addDoc(
            collection(
                db,
                "adminAudit"
            ),
            {
                action,
                module,
                recordId:
                    recordId || "",
                adminUid:
                    ADMIN_UID,
                adminName:
                    ADMIN_NAME,
                createdAt:
                    serverTimestamp()
            }
        );

    } catch (_) {
        /* audit failure must not break main action */
    }
}


function renderActivity() {

    const target =
        $("activity");

    if (!target) {
        return;
    }

    try {

        const raw =
            localStorage.getItem(
                "apex_admin_activity"
            );

        const items =
            raw
                ? JSON.parse(raw)
                : [];

        if (
            !Array.isArray(items) ||
            !items.length
        ) {

            target.innerHTML = `
                <div class="empty">
                    No activity yet.
                </div>
            `;

            return;
        }

        target.innerHTML =
            items
                .slice(0, 10)
                .map(
                    item => `
                        <div class="activity-item">
                            <strong>
                                ${esc(
                                    item.action
                                )}
                            </strong>
                            <small>
                                ${esc(
                                    item.time
                                )}
                            </small>
                        </div>
                    `
                )
                .join("");

    } catch (_) {

        target.innerHTML = `
            <div class="empty">
                No activity yet.
            </div>
        `;

    }
}


/* =========================================================
   LIVE CLASSES
   ========================================================= */

function renderLiveClassesPage() {

    setHTML(
        "customViewContent",
        `
            <div class="live-dashboard">

                <div class="card live-card-main">

                    <div class="card-head">

                        <div>
                            <div class="eyebrow">
                                ACADEMY LIVE
                            </div>

                            <h3>
                                Live Class Control
                            </h3>
                        </div>

                        <button
                            class="btn btn-primary"
                            id="pageStartLive"
                            type="button"
                        >
                            Start Live Class
                        </button>

                    </div>

                    <div class="live-info-grid">

                        <div>
                            <span>Status</span>
                            <strong>
                                Ready
                            </strong>
                        </div>

                        <div>
                            <span>Platform</span>
                            <strong>
                                Jitsi Meet
                            </strong>
                        </div>

                        <div>
                            <span>Security</span>
                            <strong>
                                Admin controlled
                            </strong>
                        </div>

                    </div>

                </div>

            </div>
        `
    );

    on(
        "pageStartLive",
        "click",
        openLiveModal
    );
}


async function startLiveClass() {

    const input =
        $("liveRoomName");

    const room =
        input
            ? input.value.trim()
            : "";

    if (!room) {

        toast(
            "Please enter a meeting room name.",
            "warning"
        );

        if (input) {
            input.focus();
        }

        return;
    }

    if (
        !/^[A-Za-z0-9_-]{3,100}$/.test(
            room
        )
    ) {

        toast(
            "Use only letters, numbers, hyphens and underscores.",
            "warning"
        );

        return;
    }

    closeLiveModal();

    const overlay =
        $("liveClassOverlay");

    const container =
        $("jitsiContainer");

    const fallback =
        $("jitsiFallback");

    const title =
        $("liveTitle");

    if (!overlay || !container) {
        return;
    }

    if (title) {
        title.textContent =
            "Apex Live Class — " +
            room;
    }

    overlay.classList.add("open");

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );

    container.innerHTML = "";

    if (fallback) {
        fallback.hidden = true;
        fallback.innerHTML = "";
    }

    if (
        typeof window.JitsiMeetExternalAPI !==
        "function"
    ) {

        if (fallback) {

            fallback.hidden = false;

            fallback.innerHTML = `
                <div class="jitsi-error">
                    <strong>
                        Live classroom unavailable
                    </strong>

                    <p>
                        Jitsi could not be loaded.
                        Please check your connection and try again.
                    </p>

                    <a
                        href="https://meet.jit.si/${encodeURIComponent(room)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open meeting manually
                    </a>
                </div>
            `;

        }

        toast(
            "Jitsi is not ready. Please try again.",
            "error"
        );

        return;
    }

    try {

        state.liveRoom = room;

        state.liveApi =
            new window.JitsiMeetExternalAPI(
                "meet.jit.si",
                {
                    roomName: room,
                    parentNode: container,
                    width: "100%",
                    height: "100%",
                    userInfo: {
                        displayName:
                            ADMIN_NAME
                    },
                    configOverwrite: {
                        prejoinPageEnabled: false,
                        disableDeepLinking: true
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false
                    }
                }
            );

        if (
            state.liveApi &&
            typeof state.liveApi.addEventListener ===
            "function"
        ) {

            state.liveApi.addEventListener(
                "readyToClose",
                endLiveClass
            );

        }

        toast(
            "Live class started.",
            "success"
        );

    } catch (_) {

        if (fallback) {

            fallback.hidden = false;

            fallback.innerHTML = `
                <div class="jitsi-error">
                    <strong>
                        Could not start classroom
                    </strong>

                    <p>
                        Please try again.
                    </p>
                </div>
            `;

        }

        toast(
            "Unable to start live class.",
            "error"
        );

    }
}


function endLiveClass() {

    try {

        if (
            state.liveApi &&
            typeof state.liveApi.dispose ===
            "function"
        ) {
            state.liveApi.dispose();
        }

    } catch (_) {}

    state.liveApi = null;
    state.liveRoom = "";

    const overlay =
        $("liveClassOverlay");

    const container =
        $("jitsiContainer");

    const fallback =
        $("jitsiFallback");

    if (container) {
        container.innerHTML = "";
    }

    if (fallback) {
        fallback.hidden = true;
        fallback.innerHTML = "";
    }

    if (overlay) {

        overlay.classList.remove(
            "open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

    }

    toast(
        "Live class ended.",
        "success"
    );
}


/* =========================================================
   QUICK ACTIONS
   ========================================================= */

function handleQuickAction(action) {

    switch (action) {

        case "student":
            activateTab("students");
            setTimeout(
                openAddModal,
                100
            );
            break;

        case "fee":
            activateTab("fees");
            setTimeout(
                openAddModal,
                100
            );
            break;

        case "announcement":
            activateTab("announcements");
            setTimeout(
                openAddModal,
                100
            );
            break;

        case "coupon":
            activateTab("coupons");
            setTimeout(
                openAddModal,
                100
            );
            break;

        case "certificate":
            activateTab("certificates");
            setTimeout(
                openAddModal,
                100
            );
            break;

        case "class":
            activateTab("liveClasses");
            setTimeout(
                openLiveModal,
                100
            );
            break;

        default:
            break;

    }
}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {

    const rows =
        state.filteredRows;

    if (!rows.length) {

        toast(
            "There is no data to export.",
            "warning"
        );

        return;
    }

    const columns =
        getColumns(rows);

    const csvRows = [];

    csvRows.push(
        columns.map(csvEscape).join(",")
    );

    rows.forEach(
        row => {

            csvRows.push(
                columns
                    .map(
                        key =>
                            csvEscape(
                                displayValue(
                                    key,
                                    row[key]
                                )
                            )
                    )
                    .join(",")
            );

        }
    );

    const blob =
        new Blob(
            [
                "\uFEFF" +
                csvRows.join("\n")
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = url;

    anchor.download =
        (
            state.currentModule ||
            "admin"
        ) +
        "-" +
        new Date()
            .toISOString()
            .slice(0, 10) +
        ".csv";

    document.body.appendChild(
        anchor
    );

    anchor.click();

    anchor.remove();

    setTimeout(
        () =>
            URL.revokeObjectURL(url),
        1000
    );

    toast(
        "CSV export created.",
        "success"
    );
}


function csvEscape(value) {

    const text =
        String(
            value ?? ""
        );

    return (
        '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"'
    );
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function emptyState(
    title,
    message
) {

    return `
        <div class="empty-state">

            <div class="empty-icon">
                ⌁
            </div>

            <h3>
                ${esc(title)}
            </h3>

            <p>
                ${esc(message)}
            </p>

        </div>
    `;
}


/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindEvents() {

    if (state.listenersBound) {
        return;
    }

    state.listenersBound = true;


    /* Login */

    on(
        "loginForm",
        "submit",
        loginAdmin
    );


    /* Logout */

    on(
        "logoutBtn",
        "click",
        logoutAdmin
    );


    /* Mobile */

    on(
        "menuBtn",
        "click",
        toggleMobileSidebar
    );


    /* Theme */

    on(
        "themeBtn",
        "click",
        toggleTheme
    );


    /* Main modal */

    on(
        "modalClose",
        "click",
        closeModal
    );


    on(
        "modalBg",
        "click",
        event => {

            const bg =
                $("modalBg");

            if (
                bg &&
                event.target === bg
            ) {
                closeModal();
            }

        }
    );


    /* Live modal */

    on(
        "liveClose",
        "click",
        closeLiveModal
    );


    on(
        "liveBg",
        "click",
        event => {

            const bg =
                $("liveBg");

            if (
                bg &&
                event.target === bg
            ) {
                closeLiveModal();
            }

        }
    );


    on(
        "startLiveClass",
        "click",
        startLiveClass
    );


    on(
        "endLive",
        "click",
        endLiveClass
    );


    /* Navigation */

    document
        .querySelectorAll(
            ".nav-item[data-tab]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const tab =
                            button.dataset.tab;

                        if (tab) {
                            activateTab(tab);
                        }

                    }
                );

            }
        );


    /* Dashboard stat navigation */

    document
        .querySelectorAll(
            ".stat[data-go]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const target =
                            card.dataset.go;

                        if (target) {
                            activateTab(
                                target
                            );
                        }

                    }
                );

            }
        );


    /* Quick actions */

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        handleQuickAction(
                            element.dataset.action
                        );

                    }
                );

            }
        );


    /* Search */

    on(
        "moduleSearch",
        "input",
        applyFilters
    );


    /* Status */

    on(
        "statusFilter",
        "change",
        applyFilters
    );


    /* Course */

    on(
        "studentCourseFilter",
        "change",
        applyFilters
    );


    /* Reload */

    on(
        "reloadBtn",
        "click",
        () => {

            if (
                state.currentModule
            ) {

                loadModule(
                    state.currentModule
                );

            }

        }
    );


    /* Dashboard refresh */

    on(
        "dashboardRefresh",
        "click",
        async () => {

            const button =
                $("dashboardRefresh");

            if (button) {
                button.disabled = true;
            }

            try {

                await loadDashboard();

                toast(
                    "Dashboard refreshed.",
                    "success"
                );

            } catch (_) {

                toast(
                    "Refresh failed.",
                    "error"
                );

            } finally {

                if (button) {
                    button.disabled = false;
                }

            }

        }
    );


    /* Add */

    on(
        "addBtn",
        "click",
        openAddModal
    );


    /* Export */

    on(
        "exportBtn",
        "click",
        exportCSV
    );


    /* Keyboard */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();
                closeLiveModal();

            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() ===
                "k"
            ) {

                event.preventDefault();

                const search =
                    $("moduleSearch");

                if (
                    search &&
                    !search.hidden
                ) {
                    search.focus();
                }

            }

        }
    );


    /* Online / offline */

    window.addEventListener(
        "online",
        () => {

            setText(
                "liveStatus",
                "Connection restored"
            );

        }
    );


    window.addEventListener(
        "offline",
        () => {

            setText(
                "liveStatus",
                "You are offline"
            );

            toast(
                "Internet connection lost.",
                "warning"
            );

        }
    );

}


/* =========================================================
   AUTH STATE
   ========================================================= */

function initAuth() {

    onAuthStateChanged(
        auth,
        user => {

            if (!user) {

                state.currentUser =
                    null;

                showLogin();

                return;
            }

            if (
                user.uid !==
                ADMIN_UID
            ) {

                state.currentUser =
                    null;

                signOut(auth)
                    .catch(() => {});

                showLogin();

                const error =
                    $("loginError");

                if (error) {

                    error.textContent =
                        "This account is not authorized for the admin panel.";

                    error.classList.remove(
                        "hidden"
                    );

                }

                return;
            }

            state.currentUser =
                user;

            showApplication();

        },
        () => {

            showLogin();

            toast(
                "Unable to verify admin session.",
                "error"
            );

        }
    );

}


/* =========================================================
   GLOBAL SAFETY
   ========================================================= */

function installSafetyHandlers() {

    window.addEventListener(
        "error",
        event => {

            /*
               Do not expose internal errors
               to visitors/admin UI.
            */

            if (
                event &&
                event.error
            ) {
                try {
                    console.error(
                        "Apex Admin:",
                        event.error
                    );
                } catch (_) {}
            }

        }
    );


    window.addEventListener(
        "unhandledrejection",
        event => {

            try {

                if (
                    event &&
                    event.reason
                ) {
                    console.error(
                        "Apex Admin Promise:",
                        event.reason
                    );
                }

            } catch (_) {}

        }
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function init() {

    restoreTheme();

    bindEvents();

    installSafetyHandlers();

    initAuth();

    window.__APEX_ADMIN_READY__ =
        true;

    window.__APEX_ADMIN_VERSION__ =
        "2026.09-production";
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once: true
        }
    );

} else {

    init();

}
