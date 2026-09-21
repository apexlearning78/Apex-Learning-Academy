import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeBar = document.getElementById('noticeBar');
const noticeText = document.getElementById('noticeText');
const loginBtn = document.getElementById('loginBtn');
const downloadBtn = document.getElementById('downloadBtn');
const certInner = document.getElementById('certInner');

function setBlankCertificate() {
    certInner.classList.add('is-blank');
    document.getElementById('certId').textContent = 'APEX-XXXX-XXX';
    document.getElementById('studentName').textContent = 'Student Name';
    document.getElementById('courseName').textContent = 'Course Name';
    document.getElementById('issueDate').textContent = 'DD Month YYYY';
    document.getElementById('signatureName').textContent = 'Mukesh Kewal';

    const verifyUrl = `https://apexlearning78.github.io/Apex-Learning-Academy/verify.html`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&bgcolor=FFFFFF&color=0A2540&margin=0`;
    document.getElementById('qrCode').src = qrUrl;
}

function setRealCertificate(cert) {
    certInner.classList.remove('is-blank');
    document.getElementById('certId').textContent = cert.certificateId || 'APEX-XXXX-XXX';
    document.getElementById('studentName').textContent = cert.studentName || 'Student Name';
    document.getElementById('courseName').textContent = cert.course || 'Course Name';
    document.getElementById('issueDate').textContent = cert.issueDate || 'DD Month YYYY';
    document.getElementById('signatureName').textContent = 'Mukesh Kewal';

    const verifyUrl = `https://apexlearning78.github.io/Apex-Learning-Academy/verify.html?id=${encodeURIComponent(cert.certificateId || '')}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&bgcolor=FFFFFF&color=0A2540&margin=0`;
    document.getElementById('qrCode').src = qrUrl;
}

function showNotice(type, htmlContent) {
    noticeBar.className = 'notice-bar notice-' + type;
    noticeText.innerHTML = htmlContent;
}

setBlankCertificate();

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        setBlankCertificate();
        showNotice('info', 'This is a sample certificate preview. <a href="login.html">Login</a> to view and download your personal certificate.');
        loginBtn.style.display = 'inline-flex';
        downloadBtn.style.display = 'none';
        document.title = 'Sample Certificate | Apex Learning Academy';
        return;
    }

    try {
        let certSnapshot = await getDocs(
            query(collection(db, "certificates"), where("email", "==", user.email))
        );

        if (certSnapshot.empty) {
            certSnapshot = await getDocs(
                query(collection(db, "certificates"), where("uid", "==", user.uid))
            );
        }

        if (!certSnapshot.empty) {
            const cert = certSnapshot.docs[0].data();
            setRealCertificate(cert);
            showNotice('success', '<strong>Certificate verified.</strong> This is your official certificate from Apex Learning Academy. You may download or print it.');
            loginBtn.style.display = 'none';
            downloadBtn.style.display = 'inline-flex';
            document.title = `${cert.studentName || 'My Certificate'} | Apex Learning Academy`;
        } else {
            setBlankCertificate();
            showNotice('warning', 'Your certificate has not been issued yet. It will be available here after you complete your course. Need help? <a href="https://wa.me/923410349929">Contact us on WhatsApp</a>.');
            loginBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
            document.title = 'Certificate Pending | Apex Learning Academy';
        }
    } catch (error) {
        console.error('Certificate fetch error:', error);
        setBlankCertificate();
        showNotice('warning', 'Unable to load your certificate right now. Please try again later or <a href="https://wa.me/923410349929">contact us on WhatsApp</a>.');
        loginBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
    }
});
