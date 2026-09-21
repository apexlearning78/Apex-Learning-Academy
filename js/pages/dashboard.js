import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

async function doLogout() {
    await signOut(auth);
    window.location.href = 'index.html';
}

document.getElementById('navLogoutBtn').addEventListener('click', doLogout);
document.getElementById('mobileLogoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    doLogout();
});

let currentRating = 0;

window.setRating = function(rating) {
    currentRating = rating;
    document.getElementById('reviewRating').value = rating;
    document.querySelectorAll('#starRating span').forEach(star => {
        const r = parseInt(star.dataset.rating);
        if (r <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
};

window.closeReviewSuccessModal = function() {
    document.getElementById('reviewSuccessModal').classList.remove('active');
};

async function loadAnnouncements() {
    try {
        const snapshot = await getDocs(collection(db, 'announcements'));
        const announcements = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(a => a.active === true)
            .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (announcements.length === 0) return;

        const ticker = document.getElementById('announcementTicker');
        const content = document.getElementById('tickerContent');

        const itemsHTML = announcements.map(a => `
            <div class="ticker-item ${a.type || 'info'}">
                <span class="ticker-item-icon"></span>
                <strong>${a.title}:</strong>
                <span>${a.message}</span>
            </div>
            <span class="ticker-item-separator">◆</span>
        `).join('');

        content.innerHTML = itemsHTML + itemsHTML;

        const duration = Math.max(20, announcements.length * 8);
        content.style.animationDuration = duration + 's';

        ticker.classList.add('active');
    } catch (err) {
        console.warn('Announcements load failed:', err.message);
    }
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const q = query(collection(db, 'students'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn('No student record found');
            document.getElementById('loadingScreen').innerHTML = `
                <p style="color:#991B1B; font-weight:700;">Profile not found. Please contact support.</p>
            `;
            return;
        }

        const student = snapshot.docs[0].data();

        const firstName = (student.fullName || 'Student').split(' ')[0];
        document.getElementById('profileName').textContent = student.fullName || 'Student';
        document.getElementById('profileAvatar').textContent = firstName.charAt(0).toUpperCase();
        document.getElementById('profileEmail').textContent = student.email || user.email;
        document.getElementById('profilePhone').textContent = student.whatsapp || '—';
        document.getElementById('profileCity').textContent = student.city || '—';

        document.getElementById('statCourses').textContent = student.enrolledCourses || 1;
        document.getElementById('statProgress').textContent = (student.progress || 0) + '%';
        document.getElementById('statAssignments').textContent = student.pendingAssignments || 0;
        document.getElementById('statAttendance').textContent = (student.attendance || 0) + '%';

        document.getElementById('infoFullName').textContent = student.fullName || '—';
        document.getElementById('infoFatherName').textContent = student.fatherName || '—';
        document.getElementById('infoEmail').textContent = student.email || user.email;
        document.getElementById('infoWhatsapp').textContent = student.whatsapp || '—';
        document.getElementById('infoCity').textContent = student.city || '—';
        document.getElementById('infoEducation').textContent = student.education || '—';
        document.getElementById('infoCourse').textContent = student.course || '—';
        document.getElementById('infoTiming').textContent = student.timing || '—';
        document.getElementById('infoStatus').textContent = (student.status || 'pending').toUpperCase();

        let enrolledStr = '—';
        if (student.enrolledAt && student.enrolledAt.seconds) {
            const d = new Date(student.enrolledAt.seconds * 1000);
            enrolledStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        document.getElementById('infoEnrolledAt').textContent = enrolledStr;

        const codingProg = student.codingProgress || 0;
        const aiProg = student.aiProgress || 0;
        document.getElementById('codingProgress').textContent = codingProg + '%';
        document.getElementById('codingBar').style.width = codingProg + '%';
        document.getElementById('aiProgress').textContent = aiProg + '%';
        document.getElementById('aiBar').style.width = aiProg + '%';

        await loadCertificateStatus(user, student);

        await loadAnnouncements();

        await loadExistingReview(user);

        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';

    } catch (err) {
        console.error('Dashboard error:', err);
        document.getElementById('loadingScreen').innerHTML = `
            <p style="color:#991B1B; font-weight:700;">Unable to load dashboard. Please try again.</p>
        `;
    }
});

async function loadCertificateStatus(user, student) {
    const certTitle = document.getElementById('certTitle');
    const certDesc = document.getElementById('certDesc');
    const certActions = document.getElementById('certActions');

    try {
        let certSnap = await getDocs(
            query(collection(db, 'certificates'), where('email', '==', user.email))
        );

        if (certSnap.empty) {
            certSnap = await getDocs(
                query(collection(db, 'certificates'), where('uid', '==', user.uid))
            );
        }

        if (!certSnap.empty) {
            const cert = certSnap.docs[0].data();
            certTitle.textContent = 'Your Certificate is Ready';
            certDesc.innerHTML = `
                <strong>${cert.course || 'Course'}</strong><br>
                Certificate ID: <strong>${cert.certificateId || '—'}</strong><br>
                Issued on ${cert.issueDate || '—'}
            `;
            certActions.innerHTML = `
                <a href="certificate.html" class="btn-cert-view">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    View Certificate
                </a>
            `;
        } else {
            certTitle.textContent = 'Certificate Not Issued Yet';
            certDesc.textContent = 'Your certificate will be issued after you complete your course requirements including attendance and final project.';
            certActions.innerHTML = `
                <div class="cert-pending">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Pending
                </div>
            `;
        }
    } catch (err) {
        console.warn('Certificate check failed:', err.message);
        certTitle.textContent = 'Certificate Status Unavailable';
        certDesc.textContent = 'Please try again later.';
        certActions.innerHTML = '';
    }
}

async function loadExistingReview(user) {
    try {
        const q = query(collection(db, 'reviews'), where('studentUid', '==', user.uid));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const review = snap.docs[0].data();
            document.getElementById('reviewForm').style.display = 'none';
            document.getElementById('alreadyReviewed').style.display = 'block';

            const stars = '★'.repeat(review.rating || 0);
            document.getElementById('existingReviewText').textContent =
                `You rated ${review.rating} star${review.rating > 1 ? 's' : ''} (${stars}): "${review.reviewText}"`;
        }
    } catch (err) {
        console.warn('Review load failed:', err.message);
    }
}

const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const rating = parseInt(document.getElementById('reviewRating').value);
        const reviewText = document.getElementById('reviewText').value.trim();

        if (!rating || rating < 1 || rating > 5) {
            alert('Please select a rating (1-5 stars).');
            return;
        }

        if (!reviewText || reviewText.length < 10) {
            alert('Please write at least 10 characters in your review.');
            return;
        }

        const btn = document.getElementById('reviewSubmitBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Submitting...';
        btn.disabled = true;

        try {
            const user = auth.currentUser;
            const studentQuery = query(collection(db, 'students'), where('uid', '==', user.uid));
            const studentSnap = await getDocs(studentQuery);
            const student = studentSnap.empty ? {} : studentSnap.docs[0].data();

            await addDoc(collection(db, 'reviews'), {
                studentUid: user.uid,
                studentName: student.fullName || 'Student',
                studentEmail: user.email,
                course: student.course || 'Course',
                rating: rating,
                reviewText: reviewText,
                status: 'pending',
                submittedAt: serverTimestamp()
            });

            reviewForm.style.display = 'none';
            document.getElementById('alreadyReviewed').style.display = 'block';

            const stars = '★'.repeat(rating);
            document.getElementById('existingReviewText').textContent =
                `You rated ${rating} star${rating > 1 ? 's' : ''} (${stars}): "${reviewText}"`;

            document.getElementById('reviewSuccessModal').classList.add('active');

        } catch (err) {
            console.error('Review submit error:', err);
            alert('Failed to submit review. Please try again.');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    });
}
