import { auth, db } from "../../config/firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================================================
   ADMIN CONFIG
========================================================= */

const ADMIN_UID = "VHbqYaHK6yXP2f8IF9WKc33kkD73";
const ADMIN_NAME = "Mukesh Kewal";


/* =========================================================
   EMAILJS CONFIG
========================================================= */

const EMAILJS_PUBLIC_KEY = "0CuJdjkOPS6ovXLmt";
const EMAILJS_SERVICE = "service_bnv0t4n";
const EMAILJS_TEMPLATE = "template_r3prv9y";


function initEmailJS() {
  if (!window.emailjs) {
    console.error("EmailJS SDK is not loaded.");
    return false;
  }

  try {
    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });

    return true;
  } catch (err) {
    console.error("EmailJS initialization failed:", err);
    return false;
  }
}


/* =========================================================
   COURSES
========================================================= */

const courses = [
  "Web Development",
  "Artificial Intelligence"
];


/* =========================================================
   MODULES
========================================================= */

const modules = {

  students: {
    label: "Students",
    group: "ACADEMY",
    collection: "students",
    desc: "Manage student profiles, course assignments and account status.",
    fields: [
      ["fullName", "Full name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["course", "Course", "select", courses],
      ["status", "Status", "select", [
        "active",
        "inactive",
        "suspended"
      ]],
      ["batch", "Batch", "text"],
      ["address", "Address", "text"]
    ]
  },

  courses: {
    label: "Courses",
    group: "ACADEMY",
    collection: "courses",
    desc: "Create and maintain academy courses.",
    fields: [
      ["title", "Course title", "text"],
      ["slug", "Slug", "text"],
      ["description", "Description", "textarea"],
      ["instructor", "Instructor", "text"],
      ["level", "Level", "select", [
        "Beginner",
        "Intermediate",
        "Advanced"
      ]],
      ["duration", "Duration", "text"],
      ["price", "Price", "number"],
      ["status", "Status", "select", [
        "draft",
        "published",
        "archived"
      ]]
    ]
  },

  enrollments: {
    label: "Enrollments",
    group: "ACADEMY",
    collection: "enrollments",
    desc: "Track which students have access to which courses.",
    fields: [
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["studentEmail", "Student email", "email"],
      ["course", "Course", "select", courses],
      ["enrollmentDate", "Enrollment date", "date"],
      ["expiryDate", "Expiry date", "date"],
      ["status", "Status", "select", [
        "active",
        "completed",
        "expired",
        "cancelled"
      ]]
    ]
  },

  assignments: {
    label: "Assignments",
    group: "LEARNING",
    collection: "assignments",
    desc: "Manage assignments and deadlines.",
    fields: [
      ["title", "Title", "text"],
      ["course", "Course", "select", courses],
      ["module", "Module", "text"],
      ["description", "Description", "textarea"],
      ["dueDate", "Due date", "datetime-local"],
      ["totalMarks", "Total marks", "number"],
      ["passingMarks", "Passing marks", "number"],
      ["status", "Status", "select", [
        "draft",
        "published",
        "closed"
      ]]
    ]
  },

  quizzes: {
    label: "Quizzes",
    group: "LEARNING",
    collection: "quizzes",
    desc: "Manage quizzes and assessment settings.",
    fields: [
      ["title", "Quiz title", "text"],
      ["course", "Course", "select", courses],
      ["module", "Module", "text"],
      ["timeLimit", "Time limit (minutes)", "number"],
      ["passingPercentage", "Passing percentage", "number"],
      ["attemptsAllowed", "Attempts allowed", "number"],
      ["status", "Status", "select", [
        "draft",
        "published",
        "closed"
      ]]
    ]
  },

  exams: {
    label: "Exams & Results",
    group: "LEARNING",
    collection: "results",
    desc: "Publish and manage student results.",
    fields: [
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["exam", "Exam name", "text"],
      ["marks", "Marks", "number"],
      ["totalMarks", "Total marks", "number"],
      ["percentage", "Percentage", "number"],
      ["grade", "Grade", "text"],
      ["status", "Status", "select", [
        "pass",
        "fail",
        "pending"
      ]]
    ]
  },

  progress: {
    label: "Course Progress",
    group: "LEARNING",
    collection: "courseProgress",
    desc: "Monitor lesson and course completion.",
    fields: [
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["completedLessons", "Completed lessons", "number"],
      ["totalLessons", "Total lessons", "number"],
      ["percentage", "Progress %", "number"],
      ["lastLesson", "Last lesson", "text"]
    ]
  },

  attendance: {
    label: "Attendance",
    group: "LEARNING",
    collection: "attendance",
    desc: "Review attendance records and live-class participation.",
    fields: [
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["className", "Class name", "text"],
      ["status", "Status", "select", [
        "present",
        "absent",
        "late",
        "host_joined",
        "host_left"
      ]],
      ["date", "Date", "date"]
    ]
  },

  certificates: {
    label: "Certificates",
    group: "LEARNING",
    collection: "certificates",
    desc: "Issue, update and verify course certificates.",
    fields: [
      ["certificateId", "Certificate ID", "text"],
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["issueDate", "Issue date", "date"],
      ["status", "Status", "select", [
        "valid",
        "revoked"
      ]],
      ["verificationUrl", "Verification URL", "url"]
    ]
  },

  fees: {
    label: "Payments & Fees",
    group: "FINANCE",
    collection: "fees",
    desc: "Manage fees, installments and outstanding balances.",
    fields: [
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["amount", "Amount", "number"],
      ["paidAmount", "Paid amount", "number"],
      ["remaining", "Remaining", "number"],
      ["dueDate", "Due date", "date"],
      ["status", "Status", "select", [
        "paid",
        "pending",
        "overdue",
        "refunded"
      ]]
    ]
  },

  invoices: {
    label: "Invoices",
    group: "FINANCE",
    collection: "invoices",
    desc: "Store and manage student invoices.",
    fields: [
      ["invoiceNumber", "Invoice number", "text"],
      ["studentUid", "Student UID", "text"],
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["amount", "Amount", "number"],
      ["discount", "Discount", "number"],
      ["total", "Total", "number"],
      ["status", "Status", "select", [
        "paid",
        "pending",
        "cancelled"
      ]],
      ["date", "Date", "date"]
    ]
  },

  instructors: {
    label: "Instructors",
    group: "PEOPLE",
    collection: "instructorApplications",
    desc: "Review instructor applications and instructor records.",
    fields: [
      ["fullName", "Name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["subject", "Subject", "text"],
      ["experience", "Experience", "text"],
      ["status", "Status", "select", [
        "pending",
        "approved",
        "rejected"
      ]]
    ]
  },

  liveClasses: {
    label: "Live Classes",
    group: "OPERATIONS",
    collection: "liveClasses",
    desc: "Schedule live classes and meeting rooms.",
    fields: [
      ["title", "Class title", "text"],
      ["course", "Course", "select", courses],
      ["instructor", "Instructor", "text"],
      ["date", "Date", "date"],
      ["startTime", "Start time", "time"],
      ["endTime", "End time", "time"],
      ["meetingLink", "Meeting link", "url"],
      ["roomName", "Room name", "text"],
      ["status", "Status", "select", [
        "scheduled",
        "live",
        "completed",
        "cancelled"
      ]]
    ]
  },

  announcements: {
    label: "Announcements",
    group: "COMMUNICATION",
    collection: "announcements",
    desc: "Publish notices to academy users.",
    fields: [
      ["title", "Title", "text"],
      ["message", "Message", "textarea"],
      ["audience", "Audience", "select", [
        "all",
        "Web Development",
        "Artificial Intelligence",
        "staff"
      ]],
      ["type", "Type", "select", [
        "info",
        "success",
        "warning"
      ]],
      ["active", "Active", "select", [
        "true",
        "false"
      ]]
    ]
  },

  messages: {
    label: "Messages & Support",
    group: "COMMUNICATION",
    collection: "messages",
    desc: "Read contact and support messages and reply by email.",
    fields: [
      ["name", "Name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["subject", "Subject", "text"],
      ["message", "Message", "textarea"],
      ["status", "Status", "select", [
        "new",
        "read",
        "replied",
        "closed"
      ]]
    ]
  },

  reviews: {
    label: "Reviews",
    group: "COMMUNICATION",
    collection: "reviews",
    desc: "Moderate student course reviews.",
    fields: [
      ["studentName", "Student name", "text"],
      ["course", "Course", "select", courses],
      ["rating", "Rating", "number"],
      ["review", "Review", "textarea"],
      ["status", "Status", "select", [
        "pending",
        "approved",
        "hidden"
      ]]
    ]
  },

  coupons: {
    label: "Coupons",
    group: "MARKETING",
    collection: "coupons",
    desc: "Create and manage promotional discount codes.",
    fields: [
      ["code", "Code", "text"],
      ["type", "Type", "select", [
        "percentage",
        "fixed"
      ]],
      ["value", "Value", "number"],
      ["course", "Course", "select", [
        "all",
        ...courses
      ]],
      ["usageLimit", "Usage limit", "number"],
      ["expiryDate", "Expiry date", "date"],
      ["status", "Status", "select", [
        "active",
        "expired",
        "disabled"
      ]]
    ]
  },

  leads: {
    label: "Leads & Admissions",
    group: "MARKETING",
    collection: "leads",
    desc: "Manage prospective students and admission follow-up.",
    fields: [
      ["name", "Name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["course", "Interested course", "select", courses],
      ["source", "Source", "text"],
      ["status", "Status", "select", [
        "new",
        "contacted",
        "interested",
        "converted",
        "not_interested"
      ]],
      ["notes", "Notes", "textarea"]
    ]
  },

  visitors: {
    label: "Visitors",
    group: "ANALYTICS",
    collection: "visitors",
    desc: "Website visitor records.",
    fields: [
      ["visitorId", "Visitor ID", "text"],
      ["device", "Device", "text"],
      ["browser", "Browser", "text"],
      ["country", "Country", "text"],
      ["firstSeen", "First seen", "text"],
      ["lastSeen", "Last seen", "text"]
    ]
  },

  visits: {
    label: "Page Visits",
    group: "ANALYTICS",
    collection: "visits",
    desc: "Website page visit activity.",
    fields: [
      ["page", "Page", "text"],
      ["visitorId", "Visitor ID", "text"],
      ["path", "Path", "text"],
      ["referrer", "Referrer", "text"],
      ["timestamp", "Timestamp", "text"]
    ]
  },

  emailLogs: {
    label: "Email Logs",
    group: "COMMUNICATION",
    collection: "emailLogs",
    desc: "Delivery attempts and email history.",
    fields: [
      ["recipientEmail", "Recipient email", "email"],
      ["recipientName", "Recipient name", "text"],
      ["subject", "Subject", "text"],
      ["status", "Status", "select", [
        "sent",
        "failed"
      ]],
      ["sentVia", "Provider", "text"],
      ["error", "Error", "textarea"]
    ]
  },

  activity: {
    label: "Activity Logs",
    group: "SYSTEM",
    collection: "adminActivity",
    desc: "Administrative audit trail.",
    fields: [
      ["action", "Action", "text"],
      ["details", "Details", "textarea"],
      ["adminEmail", "Admin email", "email"]
    ]
  },

  settings: {
    label: "Academy Settings",
    group: "SYSTEM",
    collection: "academySettings",
    desc: "Store academy-wide settings.",
    fields: [
      ["academyName", "Academy name", "text"],
      ["supportEmail", "Support email", "email"],
      ["phone", "Phone", "text"],
      ["website", "Website", "url"],
      ["currency", "Currency", "text"],
      ["timezone", "Timezone", "text"],
      ["whatsapp", "WhatsApp", "text"],
      ["address", "Address", "text"]
    ]
  }

};


/* =========================================================
   NAVIGATION
========================================================= */

const navGroups = [
  ["OVERVIEW", ["dashboard"]],
  ["ACADEMY", ["students", "courses", "enrollments"]],
  ["LEARNING", [
    "assignments",
    "quizzes",
    "exams",
    "progress",
    "attendance",
    "certificates"
  ]],
  ["FINANCE", ["fees", "invoices"]],
  ["PEOPLE & OPERATIONS", [
    "instructors",
    "liveClasses"
  ]],
  ["COMMUNICATION", [
    "messages",
    "emailCenter",
    "emailLogs",
    "announcements",
    "reviews"
  ]],
  ["MARKETING", [
    "coupons",
    "leads"
  ]],
  ["ANALYTICS", [
    "visitors",
    "visits",
    "reports"
  ]],
  ["SYSTEM", [
    "activity",
    "settings"
  ]]
];


const icon = {
  dashboard: "D",
  students: "S",
  courses: "C",
  enrollments: "E",
  assignments: "A",
  quizzes: "Q",
  exams: "R",
  progress: "P",
  attendance: "T",
  certificates: "V",
  fees: "F",
  invoices: "I",
  instructors: "N",
  liveClasses: "L",
  messages: "M",
  emailCenter: "@",
  emailLogs: "H",
  announcements: "B",
  reviews: "W",
  coupons: "K",
  leads: "G",
  visitors: "Y",
  visits: "J",
  reports: "X",
  activity: "Z",
  settings: "O"
};


const state = {
  tab: "dashboard",
  data: {},
  editingId: null,
  search: "",
  course: "all",
  confirm: null
};


const $ = id => document.getElementById(id);


const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    match => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[match])
  );


const val = (object, key) =>
  object?.[key] ?? "";


function dateValue(value) {

  if (!value) return "";

  if (value?.toDate) {
    return value.toDate()
      .toISOString()
      .slice(0, 10);
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000)
      .toISOString()
      .slice(0, 10);
  }

  return String(value).slice(0, 10);
}


function display(value) {

  if (value == null || value === "") {
    return "—";
  }

  if (value?.toDate) {
    return value.toDate().toLocaleString();
  }

  if (value?.seconds) {
    return new Date(
      value.seconds * 1000
    ).toLocaleString();
  }

  return String(value);
}


function toast(message, error = false) {

  const element = $("toast");

  element.textContent = message;

  element.className =
    "toast show" +
    (error ? " error" : "");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.className = "toast";
  }, 2800);
}


function openModal(id) {
  $(id).hidden = false;
}


function closeModal(id) {
  $(id).hidden = true;
}


function setSync(status) {
  $("syncStatus").textContent = status;
}


/* =========================================================
   BUILD NAV
========================================================= */

function buildNav() {

  $("nav").innerHTML = navGroups
    .map(([group, items]) => {

      return `
        <div class="nav-group">
          ${group}
        </div>

        ${
          items
            .map(key => {

              const label =
                key === "emailCenter"
                  ? "Email Center"
                  : key === "reports"
                    ? "Reports"
                    : modules[key]?.label ||
                      "Dashboard";

              const count =
                key === "dashboard" ||
                key === "reports" ||
                key === "emailCenter" ||
                key === "settings"
                  ? ""
                  : `
                    <span class="count">
                      ${(state.data[key] || []).length}
                    </span>
                  `;

              return `
                <button
                  class="nav-btn ${
                    state.tab === key
                      ? "active"
                      : ""
                  }"
                  data-tab="${key}"
                  type="button"
                >
                  <span class="nav-icon">
                    ${icon[key] || "•"}
                  </span>

                  <span>
                    ${label}
                  </span>

                  ${count}
                </button>
              `;
            })
            .join("")
        }
      `;

    })
    .join("");


  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => switchTab(button.dataset.tab)
      );

    });
}


/* =========================================================
   FIRESTORE LOAD
========================================================= */

async function load(key) {

  if (
    key === "dashboard" ||
    key === "reports" ||
    key === "emailCenter"
  ) {
    return;
  }

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          modules[key].collection
        )
      );

    state.data[key] =
      snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

  } catch (error) {

    state.data[key] = [];

    console.warn(
      "Load error:",
      key,
      error
    );
  }
}


async function loadAll() {

  setSync("Syncing Firebase");

  const keys =
    Object.keys(modules);

  await Promise.all(
    keys.map(load)
  );

  buildNav();

  renderDashboard();

  if (state.tab !== "dashboard") {
    renderModule();
  }

  setSync(
    "Synced " +
    new Date().toLocaleTimeString()
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function metric(key) {
  return (state.data[key] || []).length;
}


function renderDashboard() {

  const students =
    state.data.students || [];

  const fees =
    state.data.fees || [];

  const certificates =
    state.data.certificates || [];

  const leads =
    state.data.leads || [];


  const paid =
    fees.reduce(
      (sum, item) =>
        sum +
        Number(
          item.paidAmount ??
          item.amount ??
          0
        ),
      0
    );


  const pending =
    fees.filter(
      item =>
        String(item.status)
          .toLowerCase() !== "paid"
    ).length;


  const web =
    students.filter(
      item =>
        String(item.course || "")
          .toLowerCase()
          .includes("web")
    ).length;


  const ai =
    students.filter(
      item => {

        const course =
          String(item.course || "")
            .toLowerCase();

        return (
          course.includes("artificial") ||
          course === "ai"
        );

      }
    ).length;


  $("dashboardView").innerHTML = `

    <div class="dashboard-hero">

      <div>

        <h2>
          Academy command center
        </h2>

        <p>
          Manage students, courses,
          learning, finance,
          communication and operations
          from one Firebase-connected panel.
        </p>

      </div>

      <div class="dashboard-time">
        ${new Date().toLocaleString()}
      </div>

    </div>


    <div class="stats">

      ${stat(
        "Students",
        students.length,
        "Registered students"
      )}

      ${stat(
        "Courses",
        metric("courses"),
        "Published and draft"
      )}

      ${stat(
        "Enrollments",
        metric("enrollments"),
        "Course access records"
      )}

      ${stat(
        "Revenue",
        formatMoney(paid),
        "Recorded paid amount"
      )}

      ${stat(
        "Pending fees",
        pending,
        "Unsettled fee records"
      )}

      ${stat(
        "Certificates",
        certificates.length,
        "Issued or revoked"
      )}

      ${stat(
        "Leads",
        leads.length,
        "Admissions pipeline"
      )}

      ${stat(
        "Messages",
        metric("messages"),
        "Support/contact records"
      )}

    </div>


    <div class="dashboard-grid">


      <div class="panel">

        <h3>
          Course distribution
        </h3>

        <div class="chart">

          ${bar(
            "Web Development",
            web,
            students.length
          )}

          ${bar(
            "Artificial Intelligence",
            ai,
            students.length
          )}

          ${bar(
            "Other / unassigned",
            Math.max(
              0,
              students.length -
              web -
              ai
            ),
            students.length
          )}

        </div>

      </div>


      <div class="panel">

        <h3>
          Quick actions
        </h3>

        <div class="quick-grid">

          ${quick(
            "Add student",
            "students"
          )}

          ${quick(
            "Add course",
            "courses"
          )}

          ${quick(
            "New enrollment",
            "enrollments"
          )}

          ${quick(
            "Create assignment",
            "assignments"
          )}

          ${quick(
            "Issue certificate",
            "certificates"
          )}

          ${quick(
            "Send email",
            "emailCenter"
          )}

        </div>

      </div>


      <div class="panel">

        <h3>
          Recent students
        </h3>

        ${recentStudents(students)}

      </div>


      <div class="panel">

        <h3>
          System status
        </h3>

        <p class="report-note">
          Firebase authentication and
          Firestore are connected through
          the existing academy configuration.
        </p>

        <p class="report-note">
          Use Refresh after changes made
          from another browser or the
          student portal.
        </p>

      </div>


    </div>
  `;


  document
    .querySelectorAll("[data-quick]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          switchTab(
            button.dataset.quick
          )
      );

    });
}


function stat(title, value, description) {

  return `
    <div class="stat">

      <small>
        ${title}
      </small>

      <strong>
        ${esc(value)}
      </strong>

      <span>
        ${description}
      </span>

    </div>
  `;
}


function formatMoney(number) {

  return `Rs. ${
    Number(number || 0)
      .toLocaleString("en-PK")
  }`;
}


function bar(label, number, total) {

  const percentage =
    total
      ? Math.round(
          number / total * 100
        )
      : 0;

  return `
    <div class="bar">

      <span>
        ${esc(label)}
      </span>

      <div class="bar-track">

        <div
          class="bar-fill"
          style="width:${percentage}%"
        ></div>

      </div>

      <b>
        ${number}
      </b>

    </div>
  `;
}


function quick(label, key) {

  return `
    <button
      class="quick"
      data-quick="${key}"
      type="button"
    >

      <strong>
        ${esc(label)}
      </strong>

      <span>
        Open management
      </span>

    </button>
  `;
}


function recentStudents(students) {

  const rows =
    students
      .slice()
      .reverse()
      .slice(0, 6);


  if (!rows.length) {

    return `
      <div class="empty">
        No students found.
      </div>
    `;

  }


  return rows
    .map(student => {

      return `
        <div
          class="quick"
          style="margin-bottom:7px"
        >

          <strong>
            ${esc(
              student.fullName ||
              student.name ||
              "Student"
            )}
          </strong>

          <span>
            ${esc(
              student.email ||
              "No email"
            )}

            ·

            ${esc(
              student.course ||
              "No course"
            )}

          </span>

        </div>
      `;

    })
    .join("");
}


/* =========================================================
   SWITCH TAB
========================================================= */

function switchTab(tab) {

  state.tab = tab;
  state.search = "";
  state.course = "all";

  $("searchInput").value = "";
  $("courseFilter").value = "all";

  buildNav();


  if (tab === "dashboard") {

    $("dashboardView").hidden = false;
    $("moduleView").hidden = true;
    $("pageTitle").textContent =
      "Dashboard";

    return;
  }


  if (tab === "emailCenter") {

    openEmailModal();

    return;
  }


  if (tab === "reports") {

    renderReports();

    return;
  }


  $("dashboardView").hidden = true;
  $("moduleView").hidden = false;

  renderModule();


  if (window.innerWidth < 801) {
    $("sidebar")
      .classList
      .remove("open");
  }
}


/* =========================================================
   MODULE RENDER
========================================================= */

function renderModule() {

  const module =
    modules[state.tab];

  if (!module) return;


  $("pageTitle").textContent =
    module.label;

  $("moduleTitle").textContent =
    module.label;

  $("moduleDescription").textContent =
    module.desc;


  $("addBtn").textContent =
    state.tab === "activity"
      ? "Add log"
      : "Add record";


  const data =
    filteredData();


  renderStats(
    module,
    data
  );

  renderTable(
    module,
    data
  );
}


function filteredData() {

  let data =
    state.data[state.tab] || [];


  const search =
    state.search
      .trim()
      .toLowerCase();


  if (search) {

    data =
      data.filter(item =>
        Object.values(item)
          .some(value =>
            String(
              value ?? ""
            )
              .toLowerCase()
              .includes(search)
          )
      );

  }


  if (state.course !== "all") {

    data =
      data.filter(
        item =>
          String(
            item.course || ""
          ).toLowerCase() ===
          state.course.toLowerCase()
      );

  }


  return data;
}


function renderStats(module, data) {

  const total =
    data.length;


  const active =
    data.filter(item =>
      [
        "active",
        "published",
        "approved",
        "paid",
        "valid",
        "present",
        "new",
        "scheduled"
      ].includes(
        String(item.status)
          .toLowerCase()
      )
    ).length;


  $("moduleStats").innerHTML = [

    stat(
      "Visible records",
      total,
      "After filters"
    ),

    stat(
      "Active / current",
      active,
      "Status-based count"
    ),

    stat(
      "Web Development",
      data.filter(item =>
        String(item.course || "")
          .toLowerCase()
          .includes("web")
      ).length,
      "Course records"
    ),

    stat(
      "Artificial Intelligence",
      data.filter(item => {

        const course =
          String(item.course || "")
            .toLowerCase();

        return (
          course.includes("artificial") ||
          course === "ai"
        );

      }).length,
      "Course records"
    )

  ].join("");
}


function renderTable(module, data) {

  const fields =
    module.fields.map(
      field => field[0]
    );


  const visible =
    fields.slice(0, 5);


  $("tableHead").innerHTML = `

    <tr>

      ${
        visible
          .map(
            key =>
              `<th>
                ${esc(
                  labelFor(
                    module,
                    key
                  )
                )}
              </th>`
          )
          .join("")
      }

      <th>
        Actions
      </th>

    </tr>
  `;


  if (!data.length) {

    $("tableBody").innerHTML = `

      <tr>

        <td
          colspan="${visible.length + 1}"
          class="empty"
        >
          No records found.
        </td>

      </tr>
    `;

    return;
  }


  $("tableBody").innerHTML =
    data
      .map(row => {

        return `
          <tr>

            ${
              visible
                .map(
                  key =>
                    `<td>
                      ${cell(
                        row[key],
                        key
                      )}
                    </td>`
                )
                .join("")
            }


            <td>

              <div class="row-actions">

                <button
                  data-view="${esc(row.id)}"
                  type="button"
                >
                  View
                </button>

                <button
                  data-edit="${esc(row.id)}"
                  type="button"
                >
                  Edit
                </button>

                <button
                  data-delete="${esc(row.id)}"
                  type="button"
                >
                  Delete
                </button>

                ${
                  state.tab === "students" &&
                  getEmail(row)
                    ? `
                      <button
                        data-email="${esc(row.id)}"
                        type="button"
                      >
                        Email
                      </button>
                    `
                    : ""
                }

              </div>

            </td>

          </tr>
        `;

      })
      .join("");


  document
    .querySelectorAll("[data-view]")
    .forEach(button =>
      button.onclick =
        () =>
          viewRecord(
            button.dataset.view
          )
    );


  document
    .querySelectorAll("[data-edit]")
    .forEach(button =>
      button.onclick =
        () =>
          editRecord(
            button.dataset.edit
          )
    );


  document
    .querySelectorAll("[data-delete]")
    .forEach(button =>
      button.onclick =
        () =>
          confirmDelete(
            button.dataset.delete
          )
    );


  document
    .querySelectorAll("[data-email]")
    .forEach(button =>
      button.onclick =
        () =>
          openEmailModal(
            button.dataset.email
          )
    );
}


function labelFor(module, key) {

  return (
    module.fields.find(
      field => field[0] === key
    )?.[1] ||
    key
  );
}


function cell(value, key) {

  if (
    value === true ||
    value === "true"
  ) {

    return `
      <span class="badge success">
        Active
      </span>
    `;
  }


  if (
    value === false ||
    value === "false"
  ) {

    return `
      <span class="badge">
        Inactive
      </span>
    `;
  }


  const text =
    display(value);


  const lower =
    text.toLowerCase();


  if (
    ["status", "type"]
      .includes(key)
  ) {

    let className = "";


    if (
      lower.includes("fail") ||
      lower.includes("reject") ||
      lower.includes("cancel") ||
      lower.includes("overdue")
    ) {

      className = "danger";

    } else if (
      lower.includes("pending") ||
      lower.includes("draft")
    ) {

      className = "warn";

    } else if (
      lower === "paid" ||
      lower === "active" ||
      lower === "approved" ||
      lower === "valid" ||
      lower === "present"
    ) {

      className = "success";

    }


    return `
      <span class="badge ${className}">
        ${esc(text)}
      </span>
    `;
  }


  return esc(
    text.length > 80
      ? text.slice(0, 80) + "…"
      : text
  );
}


function getEmail(student) {

  return (
    student.email ||
    student.studentEmail ||
    student.recipientEmail ||
    ""
  );
}


/* =========================================================
   FORM FIELDS
========================================================= */

function buildFields(
  module,
  record = {}
) {

  return module.fields
    .map(
      ([
        key,
        label,
        type,
        options
      ]) => {

        let value =
          record[key] ?? "";


        if (
          type === "date" ||
          type === "datetime-local"
        ) {

          value =
            dateValue(value);
        }


        if (type === "select") {

          return `
            <label>

              ${esc(label)}

              <select
                name="${esc(key)}"
              >

                ${
                  options
                    .map(
                      option =>
                        `
                        <option
                          value="${esc(option)}"
                          ${
                            String(value) ===
                            String(option)
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(option)}
                        </option>
                        `
                    )
                    .join("")
                }

              </select>

            </label>
          `;
        }


        if (type === "textarea") {

          return `
            <label class="full">

              ${esc(label)}

              <textarea
                name="${esc(key)}"
              >${esc(value)}</textarea>

            </label>
          `;
        }


        return `
          <label>

            ${esc(label)}

            <input
              name="${esc(key)}"
              type="${type}"
              value="${esc(value)}"
            >

          </label>
        `;

      }
    )
    .join("");
}


/* =========================================================
   RECORD MODAL
========================================================= */

function openRecordForm(id = null) {

  const module =
    modules[state.tab];


  state.editingId = id;


  const record =
    id
      ? (
          state.data[state.tab] || []
        ).find(
          item => item.id === id
        ) || {}
      : {};


  $("modalEyebrow").textContent =
    module.label.toUpperCase();


  $("modalTitle").textContent =
    id
      ? "Edit record"
      : "Add record";


  $("recordFields").innerHTML =
    buildFields(
      module,
      record
    );


  openModal(
    "recordModal"
  );
}


function editRecord(id) {

  openRecordForm(id);
}


function viewRecord(id) {

  const module =
    modules[state.tab];


  const record =
    (
      state.data[state.tab] || []
    ).find(
      item => item.id === id
    );


  if (!record) return;


  $("detailTitle").textContent =
    record.fullName ||
    record.name ||
    record.title ||
    record.studentName ||
    module.label;


  $("detailBody").innerHTML = `

    <div class="detail-grid">

      ${
        module.fields
          .map(
            ([key, label]) =>
              `
              <div class="detail-item">

                <small>
                  ${esc(label)}
                </small>

                <div>
                  ${esc(
                    display(
                      record[key]
                    )
                  )}
                </div>

              </div>
              `
          )
          .join("")
      }


      <div class="detail-item">

        <small>
          Firestore document ID
        </small>

        <div>
          ${esc(record.id)}
        </div>

      </div>

    </div>
  `;


  openModal(
    "detailModal"
  );
}


function openAdd() {

  openRecordForm();
}


/* =========================================================
   SAVE RECORD
========================================================= */

async function saveRecord(event) {

  event.preventDefault();


  const module =
    modules[state.tab];


  const formData =
    new FormData(
      event.target
    );


  const payload = {};


  module.fields.forEach(
    ([key, label, type]) => {

      let value =
        formData.get(key);


      if (
        type === "number" &&
        value !== ""
      ) {

        value = Number(value);
      }


      if (
        key === "active" &&
        value === "true"
      ) {

        value = true;
      }


      if (
        key === "active" &&
        value === "false"
      ) {

        value = false;
      }


      payload[key] = value;

    }
  );


  payload.updatedAt =
    serverTimestamp();


  payload.updatedBy =
    auth.currentUser?.uid ||
    ADMIN_UID;


  try {

    if (state.editingId) {

      await updateDoc(
        doc(
          db,
          module.collection,
          state.editingId
        ),
        payload
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
    }


    await audit(
      `${
        state.editingId
          ? "Updated"
          : "Created"
      } ${module.label}`,
      JSON.stringify(
        payload
      ).slice(0, 500)
    );


    closeModal(
      "recordModal"
    );


    toast(
      "Record saved successfully."
    );


    await load(
      state.tab
    );


    buildNav();
    renderModule();


  } catch (error) {

    toast(
      error.message ||
      "Could not save record.",
      true
    );
  }
}


/* =========================================================
   DELETE
========================================================= */

function confirmDelete(id) {

  state.confirm =
    async () => {

      try {

        await deleteDoc(
          doc(
            db,
            modules[state.tab]
              .collection,
            id
          )
        );


        await audit(
          `Deleted ${modules[state.tab].label}`,
          id
        );


        toast(
          "Record deleted."
        );


        closeModal(
          "confirmModal"
        );


        await load(
          state.tab
        );


        buildNav();
        renderModule();


      } catch (error) {

        toast(
          error.message ||
          "Delete failed.",
          true
        );
      }
    };


  $("confirmTitle").textContent =
    "Delete record";


  $("confirmText").textContent =
    "This action permanently deletes the selected Firestore document. Continue only if you are sure.";


  openModal(
    "confirmModal"
  );
}


/* =========================================================
   AUDIT
========================================================= */

async function audit(
  action,
  details = ""
) {

  try {

    await addDoc(
      collection(
        db,
        "adminActivity"
      ),
      {
        action,
        details,
        adminUid:
          auth.currentUser?.uid ||
          ADMIN_UID,
        adminEmail:
          auth.currentUser?.email ||
          "",
        createdAt:
          serverTimestamp()
      }
    );

  } catch (error) {

    console.warn(
      "Audit log unavailable",
      error
    );
  }
}


/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV() {

  const module =
    modules[state.tab];


  const data =
    filteredData();


  if (!data.length) {

    toast(
      "There is no data to export.",
      true
    );

    return;
  }


  const keys =
    module.fields.map(
      field => field[0]
    );


  const rows = [
    keys,
    ...data.map(
      record =>
        keys.map(
          key =>
            String(
              record[key] ?? ""
            ).replaceAll(
              '"',
              '""'
            )
        )
    )
  ];


  const csv =
    rows
      .map(
        row =>
          row
            .map(
              value =>
                `"${value}"`
            )
            .join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );


  const anchor =
    document.createElement("a");


  anchor.href =
    URL.createObjectURL(
      blob
    );


  anchor.download =
    `apex-${state.tab}-${Date.now()}.csv`;


  anchor.click();


  URL.revokeObjectURL(
    anchor.href
  );
}


/* =========================================================
   EMAIL TEMPLATES
========================================================= */

const templates = {

  welcome: [
    "Welcome to Apex Learning Academy",

    `Assalam-o-Alaikum {NAME},

Welcome to Apex Learning Academy. Your registration has been received successfully.

Our team will contact you with the next steps.

Best regards,
Apex Learning Academy`
  ],


  fee: [
    "Fee Reminder - Apex Learning Academy",

    `Assalam-o-Alaikum {NAME},

This is a reminder regarding your course fee for {COURSE}.

Please contact the academy team if you need payment assistance.

Best regards,
Apex Learning Academy`
  ],


  certificate: [
    "Your Certificate is Ready",

    `Assalam-o-Alaikum {NAME},

Congratulations on completing {COURSE}. Your certificate is now available.

Best regards,
Apex Learning Academy`
  ],


  class: [
    "Class Reminder - Apex Learning Academy",

    `Assalam-o-Alaikum {NAME},

This is a reminder about your upcoming {COURSE} class. Please join on time.

Best regards,
Apex Learning Academy`
  ]

};


/* =========================================================
   EMAIL MODAL
========================================================= */

function openEmailModal(
  studentId = null
) {

  const students =
    (state.data.students || [])
      .filter(getEmail);


  $("emailRecipients").innerHTML =
    students
      .map(
        student =>
          `
          <option
            value="${esc(student.id)}"
            ${
              studentId === student.id
                ? "selected"
                : ""
            }
          >
            ${esc(
              student.fullName ||
              student.name ||
              "Student"
            )}
            -
            ${esc(
              getEmail(student)
            )}
          </option>
          `
      )
      .join("");


  $("emailStatus").textContent =
    "";


  openModal(
    "emailModal"
  );
}


function applyTemplate(key) {

  const [
    subject,
    body
  ] = templates[key];


  $("emailSubject").value =
    subject;


  const selected =
    [
      ...$("emailRecipients")
        .selectedOptions
    ];


  const name =
    selected[0]
      ?.textContent
      .split(" - ")[0]
      ?.trim() ||
    "Student";


  $("emailBody").value =
    body
      .replaceAll(
        "{NAME}",
        name
      )
      .replaceAll(
        "{COURSE}",
        "your course"
      );
}


/* =========================================================
   SEND EMAILS
========================================================= */

async function sendEmails(event) {

  event.preventDefault();


  const recipientSelect =
    $("emailRecipients");


  const subject =
    $("emailSubject")
      .value
      .trim();


  const body =
    $("emailBody")
      .value
      .trim();


  const ids =
    [
      ...recipientSelect
        .selectedOptions
    ]
      .map(
        option => option.value
      )
      .filter(Boolean);


  if (!ids.length) {

    $("emailStatus").textContent =
      "Please select at least one recipient.";

    return;
  }


  if (!subject) {

    $("emailStatus").textContent =
      "Please enter an email subject.";

    return;
  }


  if (!body) {

    $("emailStatus").textContent =
      "Please enter an email message.";

    return;
  }


  if (!initEmailJS()) {

    $("emailStatus").textContent =
      "EmailJS is not loaded. Check that the EmailJS SDK is included in admin.html.";

    return;
  }


  let sent = 0;
  let failed = 0;


  $("emailStatus").textContent =
    "Sending emails...";


  for (const id of ids) {

    const student =
      (
        state.data.students || []
      ).find(
        item => item.id === id
      );


    if (!student) {

      failed++;

      continue;
    }


    const recipientEmail =
      getEmail(student)
        .trim();


    const recipientName =
      student.fullName ||
      student.name ||
      "Student";


    if (!recipientEmail) {

      console.warn(
        "Student has no email:",
        recipientName
      );

      failed++;

      continue;
    }


    const personalizedMessage =
      body
        .replaceAll(
          "{NAME}",
          recipientName
        )
        .replaceAll(
          "{COURSE}",
          student.course ||
          "your course"
        );


    const templateParams = {

      to_email:
        recipientEmail,

      to_name:
        recipientName,

      subject:
        subject,

      reply_message:
        personalizedMessage,

      student_name:
        recipientName,

      student_email:
        recipientEmail

    };


    try {

      console.log(
        "Sending EmailJS email:",
        {
          service:
            EMAILJS_SERVICE,

          template:
            EMAILJS_TEMPLATE,

          recipient:
            recipientEmail,

          params:
            templateParams
        }
      );


      await window.emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        templateParams
      );


      await addDoc(
        collection(
          db,
          "emailLogs"
        ),
        {
          recipientEmail,
          recipientName,

          studentUid:
            student.uid ||
            student.id,

          subject,

          body:
            personalizedMessage,

          status:
            "sent",

          sentVia:
            "EmailJS",

          sentBy:
            auth.currentUser?.uid ||
            ADMIN_UID,

          createdAt:
            serverTimestamp(),

          sentAt:
            serverTimestamp()
        }
      );


      sent++;


    } catch (error) {

      console.error(
        "EmailJS send failed:",
        error
      );


      console.error(
        "EmailJS status:",
        error?.status
      );


      console.error(
        "EmailJS response:",
        error?.text
      );


      console.error(
        "EmailJS message:",
        error?.message
      );


      failed++;


      try {

        await addDoc(
          collection(
            db,
            "emailLogs"
          ),
          {
            recipientEmail,
            recipientName,

            studentUid:
              student.uid ||
              student.id,

            subject,

            body:
              personalizedMessage,

            status:
              "failed",

            sentVia:
              "EmailJS",

            error:
              error?.text ||
              error?.message ||
              `EmailJS request failed with status ${
                error?.status ||
                "unknown"
              }`,

            sentBy:
              auth.currentUser?.uid ||
              ADMIN_UID,

            createdAt:
              serverTimestamp()
          }
        );

      } catch (logError) {

        console.warn(
          "Could not save EmailJS failure log:",
          logError
        );

      }

    }

  }


  $("emailStatus").textContent =
    `Completed: ${sent} sent, ${failed} failed.`;


  if (sent > 0) {

    toast(
      `${sent} email(s) sent successfully.`
    );

  }


  if (
    failed > 0 &&
    sent === 0
  ) {

    toast(
      "No emails were sent. Check the EmailJS template/configuration.",
      true
    );

  }


  await load(
    "emailLogs"
  );


  buildNav();
}


/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

  $("dashboardView").hidden =
    false;

  $("moduleView").hidden =
    true;

  $("pageTitle").textContent =
    "Reports";


  const students =
    state.data.students || [];

  const fees =
    state.data.fees || [];

  const enrollments =
    state.data.enrollments || [];

  const results =
    state.data.exams || [];


  const revenue =
    fees.reduce(
      (sum, item) =>
        sum +
        Number(
          item.paidAmount ?? 0
        ),
      0
    );


  const outstanding =
    fees.reduce(
      (sum, item) =>
        sum +
        Number(
          item.remaining ??
          Math.max(
            0,
            Number(
              item.amount || 0
            ) -
            Number(
              item.paidAmount || 0
            )
          )
        ),
      0
    );


  $("dashboardView").innerHTML = `

    <div class="dashboard-hero">

      <div>

        <h2>
          Academy reports
        </h2>

        <p>
          Current Firestore records
          grouped into operational metrics.
        </p>

      </div>

      <div class="dashboard-time">
        ${new Date().toLocaleString()}
      </div>

    </div>


    <div class="stats">

      ${stat(
        "Students",
        students.length,
        "Total profiles"
      )}

      ${stat(
        "Enrollments",
        enrollments.length,
        "Access records"
      )}

      ${stat(
        "Recorded revenue",
        formatMoney(revenue),
        "Paid amount"
      )}

      ${stat(
        "Outstanding",
        formatMoney(outstanding),
        "Estimated from fee records"
      )}

    </div>


    <div class="dashboard-grid">


      <div class="panel">

        <h3>
          Course enrollment report
        </h3>

        ${
          bar(
            "Web Development",
            enrollments.filter(
              item =>
                String(
                  item.course
                )
                  .toLowerCase()
                  .includes("web")
            ).length,
            enrollments.length
          )
        }


        ${
          bar(
            "Artificial Intelligence",
            enrollments.filter(
              item =>
                String(
                  item.course
                )
                  .toLowerCase()
                  .includes("artificial")
            ).length,
            enrollments.length
          )
        }

      </div>


      <div class="panel">

        <h3>
          Assessment report
        </h3>

        <p class="report-note">

          Result records:
          ${results.length}.

          Passed:
          ${
            results.filter(
              item =>
                String(
                  item.status
                ).toLowerCase() ===
                "pass"
            ).length
          }.

          Failed:
          ${
            results.filter(
              item =>
                String(
                  item.status
                ).toLowerCase() ===
                "fail"
            ).length
          }.

        </p>

      </div>


    </div>
  `;
}


/* =========================================================
   AUTH / SETUP
========================================================= */

function getStudentById(id) {

  return (
    state.data.students || []
  ).find(
    item => item.id === id
  );
}


function setup() {

  /*
    IMPORTANT:
    Initialize EmailJS once when
    admin panel starts.
  */

  initEmailJS();


  /* LOGIN */

  $("loginForm")
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        $("loginError")
          .textContent = "";


        $("loginBtn")
          .disabled = true;


        try {

          await signInWithEmailAndPassword(
            auth,
            $("loginEmail")
              .value
              .trim(),
            $("loginPassword")
              .value
          );


        } catch (error) {

          $("loginError")
            .textContent =
              error.code ===
              "auth/invalid-credential"

                ? "Invalid email or password."

                : error.message ||
                  "Login failed.";

        } finally {

          $("loginBtn")
            .disabled = false;

        }

      }
    );


  /* LOGOUT */

  $("logoutBtn").onclick =
    async () => {

      await audit(
        "Admin logout"
      );

      await signOut(
        auth
      );

    };


  /* BUTTONS */

  $("refreshBtn").onclick =
    loadAll;


  $("addBtn").onclick =
    openAdd;


  $("exportBtn").onclick =
    exportCSV;


  /* SEARCH */

  $("searchInput").oninput =
    event => {

      state.search =
        event.target.value;

      renderModule();

    };


  /* COURSE FILTER */

  $("courseFilter").onchange =
    event => {

      state.course =
        event.target.value;

      renderModule();

    };


  /* FORMS */

  $("recordForm").onsubmit =
    saveRecord;


  $("emailForm").onsubmit =
    sendEmails;


  /* MODAL CLOSE */

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          closeModal(
            button.dataset.close
          );

    });


  /* EMAIL TEMPLATES */

  document
    .querySelectorAll(
      "[data-template]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          applyTemplate(
            button.dataset.template
          );

    });


  /* CONFIRM MODAL */

  $("confirmCancel").onclick =
    () =>
      closeModal(
        "confirmModal"
      );


  $("confirmOk").onclick =
    () =>
      state.confirm?.();


  /* SIDEBAR */

  $("openSidebar").onclick =
    () =>
      $("sidebar")
        .classList
        .add("open");


  $("closeSidebar").onclick =
    () =>
      $("sidebar")
        .classList
        .remove("open");


  /* ESCAPE KEY */

  window.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        [
          "recordModal",
          "detailModal",
          "emailModal",
          "confirmModal"
        ]
          .forEach(
            closeModal
          );

      }

    }
  );


  buildNav();
}


/* =========================================================
   START ADMIN
========================================================= */

async function start(user) {

  if (
    user.uid !== ADMIN_UID
  ) {

    await signOut(
      auth
    );


    $("loginError")
      .textContent =
        "This account is not authorized for the academy admin panel.";

    return;
  }


  $("loginScreen").hidden =
    true;


  $("app").hidden =
    false;


  $("adminName")
    .textContent =
      ADMIN_NAME;


  $("adminEmail")
    .textContent =
      user.email ||
      "Administrator";


  $("adminAvatar")
    .textContent =
      (
        ADMIN_NAME[0] ||
        "A"
      ).toUpperCase();


  await loadAll();
}


/* =========================================================
   INITIALIZE
========================================================= */

setup();


onAuthStateChanged(
  auth,
  user => {

    if (user) {

      start(user);

    } else {

      $("loginScreen")
        .hidden = false;

      $("app")
        .hidden = true;

    }

  }
);
