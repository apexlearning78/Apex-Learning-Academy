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

import {
    query,
    orderBy,
    limit,
    where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";


/* =========================================================
   APEX LEARNING ACADEMY
   ADMIN PANEL
   ========================================================= */

const APEX_EMAILJS_SERVICE = "YOUR_EMAILJS_SERVICE_ID";
const APEX_EMAILJS_TEMPLATE = "YOUR_EMAILJS_TEMPLATE_ID";

const ADMIN_UID = "YOUR_ADMIN_UID";
const ADMIN_NAME = "Apex Learning Academy";

let currentUser = null;
let currentTab = "dashboard";
let data = {};
let selectedStudentIds = new Set();


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


function esc(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function fmt(value) {
    if (!value) return "—";

    try {
        if (value?.toDate) {
            return value.toDate().toLocaleString();
        }

        if (value instanceof Date) {
            return value.toLocaleString();
        }

        return new Date(value).toLocaleString();
    } catch {
        return String(value);
    }
}


function toast(message, type = "success") {
    let container = $("#toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const item = document.createElement("div");

    item.className = `toast toast-${type}`;

    item.innerHTML = `
        <div class="toast-content">
            <span>${esc(message)}</span>
            <button type="button" class="toast-close">×</button>
        </div>
    `;

    container.appendChild(item);

    item.querySelector(".toast-close")?.addEventListener(
        "click",
        () => item.remove()
    );

    setTimeout(() => {
        item.remove();
    }, 4000);
}


function badge(status = "") {

    const value = String(status || "pending")
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `
        <span class="status-badge status-${esc(value)}">
            ${esc(status || "Pending")}
        </span>
    `;
}


/* =========================================================
   COURSE / SUBJECT HELPERS
   ========================================================= */

function normalizeCourse(value) {

    if (!value) {
        return "Unassigned";
    }

    const text = String(value).trim().toLowerCase();

    if (
        text.includes("artificial") ||
        text === "ai" ||
        text.includes("artificial intelligence")
    ) {
        return "Artificial Intelligence";
    }

    if (
        text.includes("web") ||
        text.includes("development") ||
        text.includes("web development")
    ) {
        return "Web Development";
    }

    return String(value).trim();
}


function studentCourseOf(student = {}) {

    return normalizeCourse(
        student.course ||
        student.subject ||
        student.courseName ||
        student.program ||
        student.programName ||
        student.subjectName ||
        ""
    );
}


function studentNameOf(student = {}) {

    return (
        student.name ||
        student.fullName ||
        student.studentName ||
        student.displayName ||
        "Student"
    );
}


function studentEmailOf(student = {}) {

    return (
        student.email ||
        student.emailAddress ||
        student.studentEmail ||
        ""
    );
}


function studentPhoneOf(student = {}) {

    return (
        student.phone ||
        student.phoneNumber ||
        student.mobile ||
        student.whatsapp ||
        ""
    );
}


function studentStatusOf(student = {}) {

    return (
        student.status ||
        student.studentStatus ||
        "active"
    );
}


/* =========================================================
   FIREBASE DATA
   ========================================================= */

const COLLECTIONS = [
    "students",
    "fees",
    "messages",
    "emailLogs",
    "announcements",
    "classes",
    "coupons",
    "certificates"
];


async function loadAllData() {

    for (const collectionName of COLLECTIONS) {

        try {

            const snapshot = await getDocs(
                collection(db, collectionName)
            );

            data[collectionName] = snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );

        } catch (error) {

            console.error(
                `Error loading ${collectionName}:`,
                error
            );

            data[collectionName] = [];
        }
    }

    renderDashboard();
    renderCurrentModule();
}


async function refreshData(collectionName = null) {

    if (collectionName) {

        try {

            const snapshot = await getDocs(
                collection(db, collectionName)
            );

            data[collectionName] = snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );

        } catch (error) {

            console.error(error);

            data[collectionName] = [];
        }

    } else {

        await loadAllData();
    }
}


/* =========================================================
   STUDENT GROUPING
   ========================================================= */

function getStudentGroups() {

    const students = data.students || [];

    const groups = {
        "Web Development": [],
        "Artificial Intelligence": [],
        "Unassigned": []
    };

    students.forEach(student => {

        const course = studentCourseOf(student);

        if (course === "Web Development") {
            groups["Web Development"].push(student);

        } else if (course === "Artificial Intelligence") {
            groups["Artificial Intelligence"].push(student);

        } else {
            groups["Unassigned"].push(student);
        }
    });

    return groups;
}


function renderStudentSegmentation(targetId) {

    const target = document.getElementById(targetId);

    if (!target) return;

    const groups = getStudentGroups();

    const total = data.students?.length || 0;

    target.innerHTML = `
        <div class="student-segmentation-header">
            <div>
                <h3>Students by Course</h3>
                <p>
                    Manage students separately according to
                    their enrolled course.
                </p>
            </div>

            <div class="student-total-box">
                <strong>${total}</strong>
                <span>Total Students</span>
            </div>
        </div>

        <div class="student-course-grid">

            <button
                type="button"
                class="student-course-card"
                data-course-filter="Web Development"
            >
                <div class="course-card-icon">💻</div>

                <div class="course-card-info">
                    <strong>Web Development</strong>
                    <span>
                        ${groups["Web Development"].length}
                        Students
                    </span>
                </div>

                <div class="course-card-arrow">→</div>
            </button>


            <button
                type="button"
                class="student-course-card"
                data-course-filter="Artificial Intelligence"
            >
                <div class="course-card-icon">🤖</div>

                <div class="course-card-info">
                    <strong>Artificial Intelligence</strong>
                    <span>
                        ${groups["Artificial Intelligence"].length}
                        Students
                    </span>
                </div>

                <div class="course-card-arrow">→</div>
            </button>


            <button
                type="button"
                class="student-course-card"
                data-course-filter="Unassigned"
            >
                <div class="course-card-icon">👤</div>

                <div class="course-card-info">
                    <strong>Unassigned</strong>
                    <span>
                        ${groups["Unassigned"].length}
                        Students
                    </span>
                </div>

                <div class="course-card-arrow">→</div>
            </button>

        </div>
    `;


    $$(".student-course-card", target)
        .forEach(button => {

            button.addEventListener("click", () => {

                const course =
                    button.dataset.courseFilter;

                switchTab("students");

                setTimeout(() => {

                    const filter =
                        $("#studentCourseFilter");

                    if (filter) {

                        filter.value = course;

                        filter.dispatchEvent(
                            new Event("change")
                        );
                    }

                }, 100);
            });
        });
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    const students =
        data.students || [];

    const fees =
        data.fees || [];

    const messages =
        data.messages || [];

    const emailLogs =
        data.emailLogs || [];


    const totalStudents =
        students.length;

    const totalFees =
        fees.length;

    const unreadMessages =
        messages.filter(
            item =>
                item.read === false ||
                item.status === "unread"
        ).length;

    const totalEmails =
        emailLogs.length;


    const studentCount =
        $("#dashboardStudentCount");

    const feeCount =
        $("#dashboardFeeCount");

    const messageCount =
        $("#dashboardMessageCount");

    const emailCount =
        $("#dashboardEmailCount");


    if (studentCount) {
        studentCount.textContent =
            totalStudents;
    }

    if (feeCount) {
        feeCount.textContent =
            totalFees;
    }

    if (messageCount) {
        messageCount.textContent =
            unreadMessages;
    }

    if (emailCount) {
        emailCount.textContent =
            totalEmails;
    }


    renderStudentSegmentation(
        "studentSegmentation"
    );
}


/* =========================================================
   STUDENTS
   ========================================================= */

function renderStudents() {

    const students =
        data.students || [];

    const table =
        $("#studentsTableBody");

    if (!table) return;


    const courseFilter =
        $("#studentCourseFilter")?.value ||
        "all";

    const search =
        ($("#studentSearch")?.value || "")
            .trim()
            .toLowerCase();


    const filtered =
        students.filter(student => {

            const course =
                studentCourseOf(student);

            const name =
                studentNameOf(student)
                    .toLowerCase();

            const email =
                studentEmailOf(student)
                    .toLowerCase();

            const phone =
                studentPhoneOf(student)
                    .toLowerCase();


            const matchesCourse =
                courseFilter === "all" ||
                course === courseFilter;


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                phone.includes(search) ||
                course.toLowerCase()
                    .includes(search);


            return (
                matchesCourse &&
                matchesSearch
            );
        });


    if (!filtered.length) {

        table.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            👨‍🎓
                        </div>

                        <h3>No students found</h3>

                        <p>
                            No students match the
                            selected filters.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        filtered.map(student => {

            const name =
                studentNameOf(student);

            const email =
                studentEmailOf(student);

            const phone =
                studentPhoneOf(student);

            const course =
                studentCourseOf(student);

            const status =
                studentStatusOf(student);


            return `
                <tr
                    data-student-id="${esc(student.id)}"
                >

                    <td>
                        <input
                            type="checkbox"
                            class="student-select"
                            value="${esc(student.id)}"
                            ${selectedStudentIds.has(student.id)
                                ? "checked"
                                : ""}
                        >
                    </td>

                    <td>
                        <div class="student-name-cell">

                            <div class="student-avatar">
                                ${esc(
                                    name
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </div>

                            <div>
                                <strong>
                                    ${esc(name)}
                                </strong>

                                <small>
                                    ${esc(
                                        student.id
                                    )}
                                </small>
                            </div>

                        </div>
                    </td>


                    <td>
                        ${
                            email
                                ? `
                                    <a
                                        href="mailto:${esc(email)}"
                                        class="student-email"
                                    >
                                        ${esc(email)}
                                    </a>
                                `
                                : "—"
                        }
                    </td>


                    <td>
                        <span class="course-badge">
                            ${esc(course)}
                        </span>
                    </td>


                    <td>
                        ${esc(phone || "—")}
                    </td>


                    <td>
                        ${badge(status)}
                    </td>


                    <td>
                        ${fmt(
                            student.createdAt ||
                            student.created_at ||
                            student.joinedAt
                        )}
                    </td>


                    <td>

                        <div class="row-actions">

                            <button
                                type="button"
                                class="action-btn"
                                title="View"
                                data-student-view="${esc(student.id)}"
                            >
                                👁
                            </button>


                            ${
                                email
                                    ? `
                                        <button
                                            type="button"
                                            class="action-btn action-primary"
                                            title="Reply"
                                            data-student-reply="${esc(student.id)}"
                                        >
                                            ✉
                                        </button>
                                    `
                                    : ""
                            }


                            <button
                                type="button"
                                class="action-btn"
                                title="Edit"
                                data-student-edit="${esc(student.id)}"
                            >
                                ✏
                            </button>


                            <button
                                type="button"
                                class="action-btn action-danger"
                                title="Delete"
                                data-student-delete="${esc(student.id)}"
                            >
                                🗑
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");


    $$(".student-select", table)
        .forEach(input => {

            input.addEventListener(
                "change",
                event => {

                    const id =
                        event.target.value;

                    if (event.target.checked) {
                        selectedStudentIds.add(id);
                    } else {
                        selectedStudentIds.delete(id);
                    }

                    updateSelectedStudentCount();
                }
            );
        });


    $$("[data-student-view]", table)
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    viewStudent(
                        button.dataset.studentView
                    )
            );
        });


    $$("[data-student-reply]", table)
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openStudentReply(
                        button.dataset.studentReply
                    )
            );
        });


    $$("[data-student-edit]", table)
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    editRecord(
                        "students",
                        button.dataset.studentEdit
                    )
            );
        });


    $$("[data-student-delete]", table)
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteRecord(
                        "students",
                        button.dataset.studentDelete
                    )
            );
        });


    updateSelectedStudentCount();
}


function updateSelectedStudentCount() {

    const element =
        $("#selectedStudentCount");

    if (element) {
        element.textContent =
            selectedStudentIds.size;
    }
}


/* =========================================================
   VIEW STUDENT
   ========================================================= */

function viewStudent(id) {

    const student =
        (data.students || [])
            .find(item => item.id === id);

    if (!student) return;


    const name =
        studentNameOf(student);

    const email =
        studentEmailOf(student);

    const course =
        studentCourseOf(student);

    const phone =
        studentPhoneOf(student);

    const status =
        studentStatusOf(student);


    showModal(`
        <div class="student-detail-modal">

            <div class="student-detail-header">

                <div class="student-detail-avatar">
                    ${esc(
                        name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>

                <div>

                    <h2>
                        ${esc(name)}
                    </h2>

                    <span>
                        ${esc(course)}
                    </span>

                </div>

            </div>


            <div class="student-detail-grid">

                <div>
                    <label>Email</label>
                    <strong>
                        ${esc(email || "—")}
                    </strong>
                </div>

                <div>
                    <label>Phone</label>
                    <strong>
                        ${esc(phone || "—")}
                    </strong>
                </div>

                <div>
                    <label>Course</label>
                    <strong>
                        ${esc(course)}
                    </strong>
                </div>

                <div>
                    <label>Status</label>
                    <strong>
                        ${badge(status)}
                    </strong>
                </div>

                <div>
                    <label>Joined</label>
                    <strong>
                        ${fmt(
                            student.createdAt ||
                            student.created_at
                        )}
                    </strong>
                </div>

                <div>
                    <label>Student ID</label>
                    <strong>
                        ${esc(student.id)}
                    </strong>
                </div>

            </div>


            <div class="modal-actions">

                ${
                    email
                        ? `
                            <button
                                type="button"
                                class="btn btn-primary"
                                id="studentReplyFromModal"
                            >
                                ✉ Reply to Student
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="btn btn-secondary"
                    data-close-modal
                >
                    Close
                </button>

            </div>

        </div>
    `);


    $("#studentReplyFromModal")
        ?.addEventListener(
            "click",
            () => {

                closeModal();

                openStudentReply(id);
            }
        );
}


/* =========================================================
   STUDENT REPLY
   ========================================================= */

function openStudentReply(id) {

    const student =
        (data.students || [])
            .find(item => item.id === id);

    if (!student) return;


    switchTab("communication");


    setTimeout(() => {

        const email =
            studentEmailOf(student);

        const name =
            studentNameOf(student);

        const course =
            studentCourseOf(student);


        const recipient =
            $("#primaryRecipient");

        const subject =
            $("#emailSubject");

        const message =
            $("#emailMessage");


        if (recipient) {
            recipient.value = email;
        }


        if (subject) {

            subject.value =
                `Reply from Apex Learning Academy – ${course}`;
        }


        if (message) {

            message.value =
`Dear ${name},

Thank you for contacting Apex Learning Academy.

We have received your message regarding your ${course} course.

Our team will review your request and assist you as soon as possible.

If you have any additional questions, please feel free to reply to this email.

Best regards,

${ADMIN_NAME}
Apex Learning Academy`;
        }


        updateCommunicationRecipients();

        toast(
            `Reply prepared for ${name}`,
            "success"
        );

    }, 150);
}


/* =========================================================
   COMMUNICATION CENTER
   ========================================================= */

const EMAIL_TEMPLATES = {

    welcome: {
        subject:
            "Welcome to Apex Learning Academy",
        message:
`Dear {name},

Welcome to Apex Learning Academy!

We are delighted to have you join our {course} program.

Our team is here to support you throughout your learning journey.

If you have any questions, please feel free to contact us.

Best regards,

Apex Learning Academy`
    },


    enrollment: {
        subject:
            "Course Enrollment Confirmation – {course}",
        message:
`Dear {name},

Your enrollment in the {course} program has been successfully confirmed.

We are excited to have you as part of Apex Learning Academy.

Please keep an eye on your email for important course updates.

Best regards,

Apex Learning Academy`
    },


    payment: {
        subject:
            "Payment Confirmation – Apex Learning Academy",
        message:
`Dear {name},

This is to confirm that your payment has been successfully received.

Course: {course}

Thank you for choosing Apex Learning Academy.

Best regards,

Apex Learning Academy`
    },


    fee: {
        subject:
            "Fee Reminder – Apex Learning Academy",
        message:
`Dear {name},

This is a friendly reminder regarding your outstanding course fee for {course}.

Please contact the academy if you need any assistance regarding your payment.

Best regards,

Apex Learning Academy`
    },


    class: {
        subject:
            "Class Reminder – Apex Learning Academy",
        message:
`Dear {name},

This is a reminder about your upcoming {course} class.

Please make sure you are available and ready before the scheduled class time.

Best regards,

Apex Learning Academy`
    },


    progress: {
        subject:
            "Course Progress Update – {course}",
        message:
`Dear {name},

We would like to share an update regarding your progress in the {course} program.

Please continue your regular practice and stay consistent with your learning.

Best regards,

Apex Learning Academy`
    },


    attendance: {
        subject:
            "Attendance Notice – Apex Learning Academy",
        message:
`Dear {name},

We are contacting you regarding your attendance in the {course} program.

Regular attendance is important for maintaining steady progress.

If there is any issue affecting your attendance, please let our team know.

Best regards,

Apex Learning Academy`
    },


    result: {
        subject:
            "Test Result – Apex Learning Academy",
        message:
`Dear {name},

Your recent test/result for the {course} program is now available.

Please contact the academy if you require any clarification.

Best regards,

Apex Learning Academy`
    },


    assignment: {
        subject:
            "Assignment Reminder – {course}",
        message:
`Dear {name},

This is a reminder regarding your upcoming assignment for the {course} program.

Please make sure your assignment is completed and submitted on time.

Best regards,

Apex Learning Academy`
    },


    certificate: {
        subject:
            "Certificate Ready – Apex Learning Academy",
        message:
`Dear {name},

Congratulations!

Your certificate related to the {course} program is now ready.

Please contact Apex Learning Academy for collection or delivery details.

Best regards,

Apex Learning Academy`
    },


    announcement: {
        subject:
            "Important Announcement – Apex Learning Academy",
        message:
`Dear {name},

We would like to share an important announcement regarding your {course} program.

Please review the latest information carefully.

If you have any questions, our team is available to assist you.

Best regards,

Apex Learning Academy`
    },


    support: {
        subject:
            "Response from Apex Learning Academy",
        message:
`Dear {name},

Thank you for contacting Apex Learning Academy.

We have received your request and our team is reviewing it.

We will assist you with the next steps as soon as possible.

Best regards,

Apex Learning Academy`
    },


    custom: {
        subject: "",
        message: ""
    }
};


function renderCommunicationCenter() {

    const students =
        data.students || [];


    const total =
        students.length;

    const web =
        students.filter(
            item =>
                studentCourseOf(item) ===
                "Web Development"
        ).length;

    const ai =
        students.filter(
            item =>
                studentCourseOf(item) ===
                "Artificial Intelligence"
        ).length;

    const emailReady =
        students.filter(
            item =>
                !!studentEmailOf(item)
        ).length;


    const totalElement =
        $("#communicationTotalStudents");

    const webElement =
        $("#communicationWebStudents");

    const aiElement =
        $("#communicationAIStudents");

    const emailElement =
        $("#communicationEmailReady");


    if (totalElement)
        totalElement.textContent = total;

    if (webElement)
        webElement.textContent = web;

    if (aiElement)
        aiElement.textContent = ai;

    if (emailElement)
        emailElement.textContent =
            emailReady;


    populateCommunicationStudents();
}


function populateCommunicationStudents() {

    const container =
        $("#communicationRecipients");

    if (!container) return;


    const students =
        data.students || [];


    const audience =
        $("#recipientAudience")?.value ||
        "all";


    const search =
        ($("#recipientSearch")?.value || "")
            .toLowerCase()
            .trim();


    let filtered =
        students.filter(student => {

            const course =
                studentCourseOf(student);

            const name =
                studentNameOf(student)
                    .toLowerCase();

            const email =
                studentEmailOf(student)
                    .toLowerCase();


            let matchesAudience = true;


            if (
                audience === "web"
            ) {

                matchesAudience =
                    course ===
                    "Web Development";

            } else if (
                audience === "ai"
            ) {

                matchesAudience =
                    course ===
                    "Artificial Intelligence";

            }


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                course.toLowerCase()
                    .includes(search);


            return (
                matchesAudience &&
                matchesSearch
            );
        });


    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ✉️
                </div>

                <h3>No recipients found</h3>

                <p>
                    No students match this
                    audience or search.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        filtered.map(student => {

            const id =
                student.id;

            const name =
                studentNameOf(student);

            const email =
                studentEmailOf(student);

            const course =
                studentCourseOf(student);


            return `
                <label class="recipient-item">

                    <input
                        type="checkbox"
                        class="recipient-checkbox"
                        value="${esc(id)}"
                        ${selectedStudentIds.has(id)
                            ? "checked"
                            : ""}
                        ${!email
                            ? "disabled"
                            : ""}
                    >

                    <span class="recipient-avatar">
                        ${esc(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </span>

                    <span class="recipient-info">

                        <strong>
                            ${esc(name)}
                        </strong>

                        <small>
                            ${esc(email || "No email")}
                        </small>

                        <small>
                            ${esc(course)}
                        </small>

                    </span>

                </label>
            `;

        }).join("");


    $$(".recipient-checkbox", container)
        .forEach(checkbox => {

            checkbox.addEventListener(
                "change",
                event => {

                    const id =
                        event.target.value;

                    if (
                        event.target.checked
                    ) {

                        selectedStudentIds
                            .add(id);

                    } else {

                        selectedStudentIds
                            .delete(id);
                    }

                    updateCommunicationSelectedCount();
                }
            );
        });


    updateCommunicationSelectedCount();
}


function updateCommunicationSelectedCount() {

    const count =
        $("#communicationSelectedCount");

    if (count) {
        count.textContent =
            selectedStudentIds.size;
    }

    updatePrimaryRecipientsField();
}


function updatePrimaryRecipientsField() {

    const input =
        $("#primaryRecipient");

    if (!input) return;


    if (selectedStudentIds.size === 0) {
        return;
    }


    const selected =
        (data.students || [])
            .filter(
                student =>
                    selectedStudentIds.has(
                        student.id
                    )
            );


    const emails =
        selected
            .map(student =>
                studentEmailOf(student)
            )
            .filter(Boolean);


    if (emails.length) {
        input.value =
            emails.join(", ");
    }
}


/* =========================================================
   TEMPLATE HANDLING
   ========================================================= */

function applyEmailTemplate(templateKey) {

    const template =
        EMAIL_TEMPLATES[templateKey];

    if (!template) return;


    const subject =
        $("#emailSubject");

    const message =
        $("#emailMessage");


    if (subject) {
        subject.value =
            template.subject;
    }


    if (message) {
        message.value =
            template.message;
    }


    personalizeEmailFields();
}


function personalizeEmailFields() {

    const subject =
        $("#emailSubject");

    const message =
        $("#emailMessage");


    if (!subject && !message) {
        return;
    }


    let name = "Student";
    let course = "your course";


    if (
        selectedStudentIds.size === 1
    ) {

        const id =
            [...selectedStudentIds][0];

        const student =
            (data.students || [])
                .find(
                    item =>
                        item.id === id
                );


        if (student) {

            name =
                studentNameOf(student);

            course =
                studentCourseOf(student);
        }
    }


    if (subject) {

        subject.value =
            subject.value
                .replaceAll(
                    "{name}",
                    name
                )
                .replaceAll(
                    "{course}",
                    course
                );
    }


    if (message) {

        message.value =
            message.value
                .replaceAll(
                    "{name}",
                    name
                )
                .replaceAll(
                    "{course}",
                    course
                );
    }
}


/* =========================================================
   SEND EMAIL
   ========================================================= */

async function sendEmailToStudent(
    student,
    subject,
    message
) {

    const email =
        studentEmailOf(student);

    if (!email) {
        throw new Error(
            `No email for ${studentNameOf(student)}`
        );
    }


    const name =
        studentNameOf(student);

    const course =
        studentCourseOf(student);


    const personalizedSubject =
        subject
            .replaceAll(
                "{name}",
                name
            )
            .replaceAll(
                "{course}",
                course
            );


    const personalizedMessage =
        message
            .replaceAll(
                "{name}",
                name
            )
            .replaceAll(
                "{course}",
                course
            );


    await emailjs.send(
        APEX_EMAILJS_SERVICE,
        APEX_EMAILJS_TEMPLATE,
        {
            to_email: email,
            recipient: email,
            subject: personalizedSubject,
            message: personalizedMessage,
            admin_name: ADMIN_NAME,
            reply_to:
                currentUser?.email || ""
        }
    );


    try {

        await addDoc(
            collection(
                db,
                "emailLogs"
            ),
            {
                recipient: email,
                recipientName: name,
                course: course,
                subject:
                    personalizedSubject,
                message:
                    personalizedMessage,
                type: "student-email",
                sentBy:
                    ADMIN_UID,
                sentByEmail:
                    currentUser?.email || "",
                createdAt:
                    serverTimestamp()
            }
        );

    } catch (logError) {

        console.error(
            "Email log failed:",
            logError
        );
    }
}


async function sendCommunicationEmail() {

    const subject =
        $("#emailSubject")?.value
            ?.trim();

    const message =
        $("#emailMessage")?.value
            ?.trim();


    if (!subject) {

        toast(
            "Please enter an email subject.",
            "error"
        );

        return;
    }


    if (!message) {

        toast(
            "Please enter an email message.",
            "error"
        );

        return;
    }


    let recipients =
        (data.students || [])
            .filter(
                student =>
                    selectedStudentIds.has(
                        student.id
                    )
            );


    if (!recipients.length) {

        const raw =
            $("#primaryRecipient")
                ?.value
                ?.trim();


        if (raw) {

            const emails =
                raw
                    .split(",")
                    .map(
                        email =>
                            email.trim()
                    )
                    .filter(Boolean);


            recipients =
                emails.map(email => ({
                    name: "Student",
                    email,
                    course: "your course"
                }));
        }
    }


    if (!recipients.length) {

        toast(
            "Please select at least one student.",
            "error"
        );

        return;
    }


    const button =
        $("#sendEmailBtn");


    if (button) {
        button.disabled = true;
        button.dataset.originalText =
            button.innerHTML;
        button.innerHTML =
            "Sending...";
    }


    let success = 0;
    let failed = 0;


    try {

        for (
            const student
            of recipients
        ) {

            try {

                await sendEmailToStudent(
                    student,
                    subject,
                    message
                );

                success++;

            } catch (error) {

                failed++;

                console.error(
                    "Email failed:",
                    error
                );
            }
        }


        if (success) {

            toast(
                `${success} email(s) sent successfully.`,
                "success"
            );
        }


        if (failed) {

            toast(
                `${failed} email(s) failed.`,
                "error"
            );
        }


        await refreshData(
            "emailLogs"
        );


        renderDashboard();


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                button.dataset.originalText ||
                "Send Email";
        }
    }
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function sendWhatsApp() {

    const message =
        $("#emailMessage")?.value?.trim();


    if (!message) {

        toast(
            "Please enter a message first.",
            "error"
        );

        return;
    }


    const students =
        (data.students || [])
            .filter(
                student =>
                    selectedStudentIds.has(
                        student.id
                    )
            );


    if (!students.length) {

        toast(
            "Please select at least one student.",
            "error"
        );

        return;
    }


    const student =
        students[0];

    const phone =
        studentPhoneOf(student)
            .replace(/\D/g, "");


    if (!phone) {

        toast(
            "Selected student has no phone number.",
            "error"
        );

        return;
    }


    const finalMessage =
        message
            .replaceAll(
                "{name}",
                studentNameOf(student)
            )
            .replaceAll(
                "{course}",
                studentCourseOf(student)
            );


    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(
            finalMessage
        )}`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   ADD RECORD
   ========================================================= */

async function addRecord(
    collectionName,
    formData
) {

    try {

        await addDoc(
            collection(
                db,
                collectionName
            ),
            {
                ...formData,
                createdAt:
                    serverTimestamp()
            }
        );


        await refreshData(
            collectionName
        );


        renderCurrentModule();

        renderDashboard();


        toast(
            "Record added successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        toast(
            error.message ||
            "Failed to add record.",
            "error"
        );
    }
}


/* =========================================================
   EDIT RECORD
   ========================================================= */

async function editRecord(
    collectionName,
    id
) {

    const records =
        data[collectionName] || [];

    const record =
        records.find(
            item => item.id === id
        );


    if (!record) return;


    if (
        collectionName ===
        "students"
    ) {

        showStudentEditModal(record);

        return;
    }


    const fields =
        Object.keys(record)
            .filter(
                key =>
                    key !== "id" &&
                    key !== "createdAt"
            );


    showModal(`
        <div class="generic-edit-modal">

            <h2>Edit Record</h2>

            <form id="genericEditForm">

                ${fields.map(field => `

                    <div class="form-group">

                        <label>
                            ${esc(
                                field
                            )}
                        </label>

                        <input
                            name="${esc(field)}"
                            value="${esc(
                                record[field] ?? ""
                            )}"
                        >

                    </div>

                `).join("")}


                <div class="modal-actions">

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Changes
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-close-modal
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `);


    $("#genericEditForm")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const form =
                    new FormData(
                        event.target
                    );


                const updates = {};


                fields.forEach(field => {

                    updates[field] =
                        form.get(field);

                });


                try {

                    await updateDoc(
                        doc(
                            db,
                            collectionName,
                            id
                        ),
                        updates
                    );


                    await refreshData(
                        collectionName
                    );


                    closeModal();

                    renderCurrentModule();

                    renderDashboard();


                    toast(
                        "Record updated successfully.",
                        "success"
                    );


                } catch (error) {

                    console.error(error);

                    toast(
                        error.message ||
                        "Update failed.",
                        "error"
                    );
                }
            }
        );
}


/* =========================================================
   STUDENT EDIT MODAL
   ========================================================= */

function showStudentEditModal(student) {

    showModal(`
        <div class="student-edit-modal">

            <h2>Edit Student</h2>

            <form id="studentEditForm">

                <div class="form-grid">

                    <div class="form-group">

                        <label>Full Name</label>

                        <input
                            name="name"
                            value="${esc(
                                studentNameOf(student)
                            )}"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            value="${esc(
                                studentEmailOf(student)
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>Phone</label>

                        <input
                            name="phone"
                            value="${esc(
                                studentPhoneOf(student)
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>Course</label>

                        <select name="course">

                            <option
                                value="Web Development"
                                ${
                                    studentCourseOf(student) ===
                                    "Web Development"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Web Development
                            </option>

                            <option
                                value="Artificial Intelligence"
                                ${
                                    studentCourseOf(student) ===
                                    "Artificial Intelligence"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Artificial Intelligence
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>Status</label>

                        <select name="status">

                            ${
                                [
                                    "active",
                                    "pending",
                                    "completed",
                                    "inactive"
                                ]
                                .map(status => `
                                    <option
                                        value="${status}"
                                        ${
                                            studentStatusOf(student) ===
                                            status
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${status}
                                    </option>
                                `)
                                .join("")
                            }

                        </select>

                    </div>

                </div>


                <div class="modal-actions">

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Changes
                    </button>

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-close-modal
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>
    `);


    $("#studentEditForm")
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const form =
                    new FormData(
                        event.target
                    );


                const updates = {

                    name:
                        form.get("name"),

                    email:
                        form.get("email"),

                    phone:
                        form.get("phone"),

                    course:
                        form.get("course"),

                    subject:
                        form.get("course"),

                    status:
                        form.get("status")
                };


                try {

                    await updateDoc(
                        doc(
                            db,
                            "students",
                            student.id
                        ),
                        updates
                    );


                    await refreshData(
                        "students"
                    );


                    closeModal();

                    renderStudents();

                    renderDashboard();

                    renderCommunicationCenter();


                    toast(
                        "Student updated successfully.",
                        "success"
                    );


                } catch (error) {

                    console.error(error);

                    toast(
                        error.message ||
                        "Failed to update student.",
                        "error"
                    );
                }
            }
        );
}


/* =========================================================
   DELETE RECORD
   ========================================================= */

async function deleteRecord(
    collectionName,
    id
) {

    const records =
        data[collectionName] || [];

    const record =
        records.find(
            item => item.id === id
        );


    const name =
        collectionName === "students"
            ? studentNameOf(record || {})
            : "this record";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete ${name}?`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                collectionName,
                id
            )
        );


        await refreshData(
            collectionName
        );


        renderCurrentModule();

        renderDashboard();


        toast(
            "Deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        toast(
            error.message ||
            "Delete failed.",
            "error"
        );
    }
}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(content) {

    let modal =
        $("#globalModal");


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "globalModal";

        modal.className =
            "modal-overlay";

        document.body.appendChild(
            modal
        );
    }


    modal.innerHTML = `
        <div class="modal-container">

            <button
                type="button"
                class="modal-close"
                data-close-modal
            >
                ×
            </button>

            <div class="modal-body">
                ${content}
            </div>

        </div>
    `;


    modal.classList.add("active");


    $$("[data-close-modal]", modal)
        .forEach(button => {

            button.addEventListener(
                "click",
                closeModal
            );
        });


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        },
        {
            once: true
        }
    );
}


function closeModal() {

    const modal =
        $("#globalModal");

    if (!modal) return;

    modal.classList.remove(
        "active"
    );
}


/* =========================================================
   MODULES
   ========================================================= */

const MODULES = {

    students: {
        title: "Students",
        collection: "students",
        render: renderStudents
    },

    communication: {
        title: "Communication Center",
        collection: "students",
        render: renderCommunicationCenter
    }

};


function renderCurrentModule() {

    if (
        currentTab ===
        "students"
    ) {

        renderStudents();

    } else if (
        currentTab ===
        "communication"
    ) {

        renderCommunicationCenter();

    } else {

        const module =
            MODULES[currentTab];

        if (
            module &&
            typeof module.render ===
            "function"
        ) {
            module.render();
        }
    }
}


/* =========================================================
   TAB SWITCHING
   ========================================================= */

function switchTab(tab) {

    currentTab = tab;


    $$(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.tab === tab
            );
        });


    $$(".page-section")
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id ===
                    `${tab}Section`
            );
        });


    const title =
        $("#pageTitle");

    if (title) {

        title.textContent =
            MODULES[tab]?.title ||
            (
                tab === "dashboard"
                    ? "Dashboard"
                    : tab
            );
    }


    renderCurrentModule();


    if (
        tab ===
        "dashboard"
    ) {
        renderDashboard();
    }
}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;


        if (!user) {

            const login =
                $("#loginScreen");

            const admin =
                $("#adminApp");


            if (login)
                login.style.display =
                    "flex";

            if (admin)
                admin.style.display =
                    "none";


            return;
        }


        if (
            ADMIN_UID &&
            ADMIN_UID !==
                "YOUR_ADMIN_UID" &&
            user.uid !== ADMIN_UID
        ) {

            toast(
                "You are not authorized to access the admin panel.",
                "error"
            );

            await signOut(auth);

            return;
        }


        const login =
            $("#loginScreen");

        const admin =
            $("#adminApp");


        if (login)
            login.style.display =
                "none";

        if (admin)
            admin.style.display =
                "block";


        await loadAllData();


        switchTab(
            "dashboard"
        );
    }
);


/* =========================================================
   LOGIN
   ========================================================= */

document.addEventListener(
    "submit",
    async event => {

        if (
            event.target.id !==
            "loginForm"
        ) {
            return;
        }


        event.preventDefault();


        const email =
            $("#loginEmail")
                ?.value
                ?.trim();

        const password =
            $("#loginPassword")
                ?.value;


        if (!email || !password) {

            toast(
                "Please enter email and password.",
                "error"
            );

            return;
        }


        try {

            const button =
                $("#loginBtn");

            if (button) {
                button.disabled = true;
                button.textContent =
                    "Signing in...";
            }


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        } catch (error) {

            console.error(error);

            toast(
                error.message ||
                "Login failed.",
                "error"
            );


        } finally {

            const button =
                $("#loginBtn");

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "Sign In";
            }
        }
    }
);


/* =========================================================
   GLOBAL EVENTS
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const nav =
            event.target.closest(
                "[data-tab]"
            );


        if (nav) {

            event.preventDefault();

            switchTab(
                nav.dataset.tab
            );

            return;
        }


        const action =
            event.target.closest(
                "[data-action]"
            );


        if (action) {

            const value =
                action.dataset.action;


            const actionMap = {

                student:
                    "students",

                students:
                    "students",

                fee:
                    "fees",

                fees:
                    "fees",

                announcement:
                    "announcements",

                announcements:
                    "announcements",

                class:
                    "classes",

                classes:
                    "classes",

                coupon:
                    "coupons",

                coupons:
                    "coupons",

                certificate:
                    "certificates",

                certificates:
                    "certificates",

                email:
                    "communication",

                communication:
                    "communication"
            };


            const tab =
                actionMap[value];


            if (tab) {

                event.preventDefault();

                switchTab(tab);
            }
        }
    }
);


/* =========================================================
   STUDENT FILTER EVENTS
   ========================================================= */

document.addEventListener(
    "input",
    event => {

        if (
            event.target.id ===
            "studentSearch"
        ) {

            renderStudents();
        }


        if (
            event.target.id ===
            "recipientSearch"
        ) {

            populateCommunicationStudents();
        }
    }
);


document.addEventListener(
    "change",
    event => {

        if (
            event.target.id ===
            "studentCourseFilter"
        ) {

            renderStudents();
        }


        if (
            event.target.id ===
            "recipientAudience"
        ) {

            populateCommunicationStudents();
        }


        if (
            event.target.id ===
            "emailTemplate"
        ) {

            applyEmailTemplate(
                event.target.value
            );
        }


        if (
            event.target.id ===
            "selectAllRecipients"
        ) {

            const checked =
                event.target.checked;


            const visible =
                $$(".recipient-checkbox");


            visible.forEach(
                checkbox => {

                    if (
                        checkbox.disabled
                    ) {
                        return;
                    }


                    checkbox.checked =
                        checked;


                    const id =
                        checkbox.value;


                    if (checked) {

                        selectedStudentIds
                            .add(id);

                    } else {

                        selectedStudentIds
                            .delete(id);
                    }
                }
            );


            updateCommunicationSelectedCount();
        }


        if (
            event.target.id ===
            "selectAllStudents"
        ) {

            const checked =
                event.target.checked;


            $$(".student-select")
                .forEach(
                    checkbox => {

                        checkbox.checked =
                            checked;


                        const id =
                            checkbox.value;


                        if (checked) {

                            selectedStudentIds
                                .add(id);

                        } else {

                            selectedStudentIds
                                .delete(id);
                        }
                    }
                );


            updateSelectedStudentCount();
        }
    }
);


/* =========================================================
   COMMUNICATION BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                "#sendEmailBtn"
            )
        ) {

            sendCommunicationEmail();
        }


        if (
            event.target.closest(
                "#sendWhatsAppBtn"
            )
        ) {

            sendWhatsApp();
        }


        if (
            event.target.closest(
                "#clearEmailBtn"
            )
        ) {

            $("#primaryRecipient").value =
                "";

            $("#emailSubject").value =
                "";

            $("#emailMessage").value =
                "";

            selectedStudentIds.clear();

            populateCommunicationStudents();

            updateCommunicationSelectedCount();
        }


        if (
            event.target.closest(
                "#refreshCommunicationBtn"
            )
        ) {

            refreshData(
                "students"
            ).then(() => {

                renderCommunicationCenter();

                toast(
                    "Students refreshed.",
                    "success"
                );
            });
        }
    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

document.addEventListener(
    "click",
    async event => {

        if (
            event.target.closest(
                "#logoutBtn"
            )
        ) {

            try {

                await signOut(auth);

                toast(
                    "Logged out successfully.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                toast(
                    error.message ||
                    "Logout failed.",
                    "error"
                );
            }
        }
    }
);


/* =========================================================
   INITIAL SETUP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const template =
            $("#emailTemplate");


        if (template) {

            template.innerHTML = `

                <option value="welcome">
                    Welcome Email
                </option>

                <option value="enrollment">
                    Course Enrollment
                </option>

                <option value="payment">
                    Payment Confirmation
                </option>

                <option value="fee">
                    Fee Due Reminder
                </option>

                <option value="class">
                    Class Reminder
                </option>

                <option value="progress">
                    Course Progress Update
                </option>

                <option value="attendance">
                    Attendance Notice
                </option>

                <option value="result">
                    Test Result
                </option>

                <option value="assignment">
                    Assignment Reminder
                </option>

                <option value="certificate">
                    Certificate Ready
                </option>

                <option value="announcement">
                    Announcement
                </option>

                <option value="support">
                    Student Support Reply
                </option>

                <option value="custom">
                    Custom Message
                </option>
            `;
        }


        if (
            $("#studentSegmentation")
        ) {
            renderStudentSegmentation(
                "studentSegmentation"
            );
        }


        if (
            $("#studentModuleSegmentation")
        ) {
            renderStudentSegmentation(
                "studentModuleSegmentation"
            );
        }
    }
);
