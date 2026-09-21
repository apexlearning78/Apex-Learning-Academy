import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DEFAULT_SCHEDULE = [
    {
        id: 'coding-mon',
        subject: 'coding',
        subjectLabel: 'Coding Course',
        title: 'Python — Functions & Modules',
        day: 'Monday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-Coding-Batch1',
        platform: 'Jitsi Meet',
        status: 'scheduled'
    },
    {
        id: 'ai-tue',
        subject: 'ai',
        subjectLabel: 'AI Course',
        title: 'Introduction to Machine Learning',
        day: 'Tuesday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-AI-Batch1',
        platform: 'Jitsi Meet',
        status: 'scheduled'
    },
    {
        id: 'coding-wed',
        subject: 'coding',
        subjectLabel: 'Coding Course',
        title: 'HTML & CSS — Responsive Layouts',
        day: 'Wednesday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-Coding-Batch1',
        platform: 'Jitsi Meet',
        status: 'scheduled'
    },
    {
        id: 'ai-thu',
        subject: 'ai',
        subjectLabel: 'AI Course',
        title: 'Prompt Engineering Workshop',
        day: 'Thursday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-AI-Batch1',
        platform: 'Jitsi Meet',
        status: 'scheduled'
    },
    {
        id: 'doubt-sat',
        subject: 'doubt',
        subjectLabel: 'Doubt Session',
        title: 'Open Q&A — All Students Welcome',
        day: 'Saturday',
        time: '6:00 PM to 8:00 PM',
        roomName: 'ApexLearning-DoubtSession',
        platform: 'Jitsi Meet',
        status: 'scheduled'
    }
];

let currentUser = null;
let currentClass = null;
let jitsiApi = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;

    const authActions = document.getElementById('authActions');
    const mobileLogin = document.getElementById('mobileLoginLink');
    const mobileRegister = document.getElementById('mobileRegisterLink');
    const mobileDashboard = document.getElementById('mobileDashboardLink');
    const mobileLogout = document.getElementById('mobileLogoutLink');

    if (user) {
        if (authActions) {
            authActions.innerHTML = `
                <a href="dashboard.html" class="btn-login">Dashboard</a>
                <button id="navLogoutBtn" class="btn-header-cta" style="border:none; cursor:pointer; font-family:inherit; font-size:13.5px;">Logout</button>
            `;
            document.getElementById('navLogoutBtn').addEventListener('click', async () => {
                await signOut(auth);
                window.location.href = 'index.html';
            });
        }
        if (mobileLogin) mobileLogin.style.display = 'none';
        if (mobileRegister) mobileRegister.style.display = 'none';
        if (mobileDashboard) mobileDashboard.style.display = 'block';
        if (mobileLogout) {
            mobileLogout.style.display = 'block';
            mobileLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                await signOut(auth);
                window.location.href = 'index.html';
            });
        }
    } else {
        if (authActions) {
            authActions.innerHTML = `
                <a href="login.html" class="btn-login">Login</a>
                <a href="register.html" class="btn-header-cta">Register Now</a>
            `;
        }
        if (mobileLogin) mobileLogin.style.display = 'block';
        if (mobileRegister) mobileRegister.style.display = 'block';
        if (mobileDashboard) mobileDashboard.style.display = 'none';
        if (mobileLogout) mobileLogout.style.display = 'none';
    }
});

async function loadSchedule() {
    const grid = document.getElementById('liveGrid');
    let classes = DEFAULT_SCHEDULE;

    try {
        const snapshot = await getDocs(collection(db, 'liveClasses'));
        if (!snapshot.empty) {
            classes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (err) {
        console.warn('Using default schedule:', err.message);
    }

    grid.innerHTML = classes.map(cls => {
        const subjectClass = cls.subject === 'coding' ? 'coding' : (cls.subject === 'ai' ? 'ai' : 'doubt');
        const isLive = cls.status === 'live';

        return `
            <div class="live-card ${subjectClass}">
                <div class="live-info">
                    <div class="live-subject ${subjectClass}">
                        ${cls.subjectLabel || cls.subject}
                        ${isLive ? '<span class="live-live-badge">LIVE NOW</span>' : ''}
                    </div>
                    <h4 class="live-title">${cls.title}</h4>
                    <div class="live-meta">
                        <span>${cls.day} — ${cls.time}</span>
                        <span>|</span>
                        <span>${cls.platform || 'Jitsi Meet'}</span>
                    </div>
                </div>
                <button class="join-btn" onclick="openJoinModal('${cls.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                    Join Class
                </button>
            </div>
        `;
    }).join('');

    window._liveClasses = classes;
}

loadSchedule();

window.openJoinModal = function(classId) {
    const classes = window._liveClasses || DEFAULT_SCHEDULE;
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    currentClass = cls;

    document.getElementById('modalClassName').textContent = cls.title;
    document.getElementById('modalClassTime').textContent = `${cls.day} — ${cls.time}`;

    const nameInput = document.getElementById('studentJoinName');
    if (currentUser && currentUser.displayName) {
        nameInput.value = currentUser.displayName;
    } else {
        nameInput.value = '';
    }

    document.getElementById('joinModal').classList.add('active');
    setTimeout(() => nameInput.focus(), 200);
};

window.closeJoinModal = function() {
    document.getElementById('joinModal').classList.remove('active');
};

document.getElementById('joinModal').addEventListener('click', (e) => {
    if (e.target.id === 'joinModal') closeJoinModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeJoinModal();
    }
});

document.getElementById('studentJoinName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') confirmJoin();
});

window.confirmJoin = async function() {
    const name = document.getElementById('studentJoinName').value.trim();

    if (!name) {
        alert('Please enter your name to join the class.');
        return;
    }

    if (name.length < 3) {
        alert('Please enter your full name (at least 3 characters).');
        return;
    }

    try {
        await addDoc(collection(db, 'attendance'), {
            studentName: name,
            studentEmail: currentUser ? currentUser.email : 'guest',
            studentUid: currentUser ? currentUser.uid : 'guest',
            classId: currentClass.id,
            className: currentClass.title,
            subject: currentClass.subject,
            joinedAt: serverTimestamp(),
            status: 'joined'
        });
    } catch (err) {
        console.warn('Attendance save failed:', err.message);
    }

    closeJoinModal();
    startJitsi(name);
};

function startJitsi(displayName) {
    const modal = document.getElementById('jitsiModal');
    document.getElementById('jitsiTitle').textContent = currentClass.title;
    document.getElementById('jitsiSubtitle').textContent = `${currentClass.subjectLabel} | Apex Learning Academy`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const container = document.getElementById('jitsiContainer');
    container.innerHTML = '';

    const options = {
        roomName: currentClass.roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
            displayName: displayName
        },
        configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            toolbarButtons: [
                'microphone', 'camera', 'closedcaptions', 'desktop',
                'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                'raisehand', 'videoquality', 'tileview', 'select-background',
                'download', 'help', 'mute-everyone', 'settings'
            ]
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_BACKGROUND: '#0A2540',
            TOOLBAR_ALWAYS_VISIBLE: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false
        }
    };

    try {
        jitsiApi = new JitsiMeetExternalAPI('meet.jit.si', options);

        jitsiApi.addEventListener('participantJoined', (participant) => {
        });

        jitsiApi.addEventListener('participantLeft', (participant) => {
        });

        jitsiApi.addEventListener('videoConferenceLeft', () => {
            leaveClass();
        });

        jitsiApi.addEventListener('readyToClose', () => {
            leaveClass();
        });

    } catch (err) {
        console.error('Jitsi error:', err);
        alert('Unable to start live class. Please try again.');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.leaveClass = async function() {

    if (currentClass && currentUser) {
        try {
            await addDoc(collection(db, 'attendance'), {
                studentName: currentUser.displayName || 'Student',
                studentEmail: currentUser.email,
                studentUid: currentUser.uid,
                classId: currentClass.id,
                className: currentClass.title,
                subject: currentClass.subject,
                leftAt: serverTimestamp(),
                status: 'left'
            });
        } catch (err) {
            console.warn('Leave save failed:', err.message);
        }
    }

    if (jitsiApi) {
        try {
            jitsiApi.dispose();
        } catch (e) {}
        jitsiApi = null;
    }

    document.getElementById('jitsiModal').classList.remove('active');
    document.getElementById('jitsiContainer').innerHTML = '';
    document.body.style.overflow = '';

    currentClass = null;
};
