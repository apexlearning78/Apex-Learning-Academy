import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loadingScreen = document.getElementById('loadingScreen');
const errorBox = document.getElementById('errorBox');
const actionBar = document.getElementById('actionBar');
const idCardWrapper = document.getElementById('idCardWrapper');

let currentStudent = null;
let currentStudentId = '';

function showError(title, message) {
    loadingScreen.style.display = 'none';
    idCardWrapper.style.display = 'none';
    actionBar.style.display = 'none';
    errorBox.style.display = 'block';
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
}

function showToast(msg, color = '#10B981', isError = false) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    const icon = toast.querySelector('svg');
    
    toastText.textContent = msg;
    toast.style.background = color;
    
    if (isError) {
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    } else {
        icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    }
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function showIDCard(student) {
    currentStudent = student;
    loadingScreen.style.display = 'none';
    errorBox.style.display = 'none';
    actionBar.style.display = 'flex';
    idCardWrapper.style.display = 'block';

    const firstName = (student.fullName || 'Student').split(' ')[0];
    const photoEl = document.getElementById('studentPhoto');
    if (student.profilePicture) {
        photoEl.innerHTML = `<img src="${student.profilePicture}" alt="${student.fullName}" onerror="this.parentElement.textContent='${firstName.charAt(0).toUpperCase()}'">`;
    } else {
        photoEl.textContent = firstName.charAt(0).toUpperCase();
    }

    document.getElementById('studentName').textContent = student.fullName || 'Student';

    let studentId = student.studentId || '';
    if (!studentId && student.uid) {
        studentId = 'APEX-' + student.uid.slice(-8).toUpperCase();
    }
    if (!studentId) studentId = 'APEX-STUDENT';
    currentStudentId = studentId;
    document.getElementById('studentId').textContent = studentId;

    document.getElementById('studentCourse').textContent = student.course || '—';
    document.getElementById('studentTiming').textContent = student.timing || '—';
    document.getElementById('studentCity').textContent = student.city || '—';
    document.getElementById('studentPhone').textContent = student.whatsapp || '—';
    
    const status = (student.status || 'active').toUpperCase();
    document.getElementById('studentStatus').textContent = status;

    const badge = document.getElementById('verifiedBadge');
    if (status === 'ACTIVE') {
        badge.style.display = 'flex';
        badge.style.background = 'linear-gradient(135deg, #10B981, #059669)';
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>VERIFIED';
    } else {
        badge.style.background = 'linear-gradient(135deg, #EF4444, #B91C1C)';
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>INACTIVE';
    }

    let enrolledStr = '—';
    if (student.enrolledAt && student.enrolledAt.seconds) {
        const d = new Date(student.enrolledAt.seconds * 1000);
        enrolledStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    document.getElementById('studentEnrolled').textContent = enrolledStr;

    const verifyUrl = `https://apexlearning78.github.io/Apex-Learning-Academy/verify.html?id=${encodeURIComponent(studentId)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&bgcolor=FFFFFF&color=0A2540&margin=0`;
    document.getElementById('qrCode').src = qrUrl;

    document.title = `${student.fullName || 'My'} ID Card | Apex Learning Academy`;
}

window.flipCard = function() {
    document.getElementById('cardContainer').classList.toggle('flipped');
};

window.copyId = function() {
    navigator.clipboard.writeText(currentStudentId).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.classList.add('copied');
        showToast('Student ID Copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
    }).catch(() => showToast('Failed to copy', '#EF4444', true));
};

window.shareCard = async function() {
    const name = currentStudent?.fullName || 'Student';
    const text = `${name}'s Official ID Card\nID: ${currentStudentId}\nApex Learning Academy\n\nVerify: https://apexlearning78.github.io/Apex-Learning-Academy/verify.html?id=${currentStudentId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: `${name} - ID Card`,
                text: text,
                url: `https://apexlearning78.github.io/Apex-Learning-Academy/verify.html?id=${currentStudentId}`
            });
        } catch (e) { /* cancelled */ }
    } else {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    }
};

window.downloadPNG = async function() {
    showToast('Generating PNG...', '#3B82F6');
    const front = document.getElementById('frontCard');
    try {
        const canvas = await html2canvas(front, {
            scale: 3,
            backgroundColor: '#FFFFFF',
            useCORS: true,
            logging: false
        });
        const link = document.createElement('a');
        link.download = `${currentStudentId}_ID_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('PNG Downloaded');
    } catch (e) {
        showToast('Failed to generate PNG', '#EF4444', true);
        console.error(e);
    }
};

window.downloadPDF = async function() {
    showToast('Generating PDF...', '#3B82F6');
    const front = document.getElementById('frontCard');
    const back = document.getElementById('backCard');
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const frontCanvas = await html2canvas(front, { scale: 3, backgroundColor: '#FFFFFF', useCORS: true });
        const backCanvas = await html2canvas(back, { scale: 3, backgroundColor: '#FFFFFF', useCORS: true });
        
        const imgWidth = 100;
        const frontHeight = (frontCanvas.height * imgWidth) / frontCanvas.width;
        const backHeight = (backCanvas.height * imgWidth) / backCanvas.width;
        
        const xPos = (210 - imgWidth) / 2;
        
        pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', xPos, 20, imgWidth, frontHeight);
        pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', xPos, 25 + frontHeight, imgWidth, backHeight);
        
        pdf.save(`${currentStudentId}_ID_Card.pdf`);
        showToast('PDF Downloaded');
    } catch (e) {
        showToast('Failed to generate PDF', '#EF4444', true);
        console.error(e);
    }
};

window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('apex_id_dark', isDark ? '1' : '0');
    const btn = document.getElementById('darkModeBtn');
    btn.innerHTML = isDark 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
};

if (localStorage.getItem('apex_id_dark') === '1') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('darkModeBtn');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        showError('Please Login', 'You need to login to view your ID card.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    try {
        const q = query(collection(db, 'students'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            showError('Profile Not Found', 'Your student profile could not be found. Please register first.');
            return;
        }

        const student = snapshot.docs[0].data();
        showIDCard(student);

    } catch (err) {
        console.error('ID Card error:', err);
        showError('Unable to Load', 'A technical error occurred. Please try again.');
    }
});
