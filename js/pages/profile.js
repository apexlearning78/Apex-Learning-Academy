import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentStudentId = null;
let currentStudentData = null;

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('mobileMenu').classList.remove('open'));
});

async function doLogout() {
    await signOut(auth);
    window.location.href = 'index.html';
}
document.getElementById('navLogoutBtn').addEventListener('click', doLogout);
document.getElementById('mobileLogoutLink').addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

window.switchTab = function(e, tabId) {
    document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    e.target.closest('.profile-tab').classList.add('active');
    document.getElementById(tabId).classList.add('active');
};

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const q = query(collection(db, 'students'), where('uid', '==', user.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
            document.getElementById('loadingScreen').innerHTML = `<p style="color:#991B1B;font-weight:700;">Profile not found.</p>`;
            return;
        }

        const studentDoc = snap.docs[0];
        currentStudentId = studentDoc.id;
        currentStudentData = studentDoc.data();
        const s = currentStudentData;

        const firstName = (s.fullName || 'Student').split(' ')[0];
        document.getElementById('profileBannerName').textContent = s.fullName || 'Student';
        document.getElementById('profileBannerEmail').textContent = s.email || user.email;
        document.getElementById('profileBannerPhone').textContent = s.whatsapp || '—';

        if (s.profilePicture) {
            document.getElementById('profileAvatar').innerHTML = `<img src="${s.profilePicture}" alt="${s.fullName}">`;
        } else {
            document.getElementById('profileAvatar').textContent = firstName.charAt(0).toUpperCase();
        }

        document.getElementById('profileStatCourses').textContent = s.enrolledCourses || 1;
        document.getElementById('profileStatProgress').textContent = (s.progress || 0) + '%';
        document.getElementById('profileStatAttendance').textContent = (s.attendance || 0) + '%';

        const pf = document.getElementById('personalForm');
        pf.fullName.value = s.fullName || '';
        pf.fatherName.value = s.fatherName || '';
        pf.city.value = s.city || '';
        pf.cnic.value = s.cnic || '';
        pf.bio.value = s.bio || '';
        pf.dob.value = s.dob || '';
        pf.gender.value = s.gender || '';

        const cf = document.getElementById('contactForm');
        cf.whatsapp.value = s.whatsapp || '';
        cf.altPhone.value = s.altPhone || '';
        cf.email.value = s.email || user.email;
        cf.address.value = s.address || '';

        document.getElementById('acadCourse').textContent = s.course || '—';
        document.getElementById('acadEducation').textContent = s.education || '—';
        document.getElementById('acadTiming').textContent = s.timing || '—';
        document.getElementById('acadStatus').textContent = (s.status || 'pending').toUpperCase();
        document.getElementById('acadStudentId').textContent = s.studentId || s.uid?.slice(-8).toUpperCase() || '—';
        document.getElementById('acadAttendance').textContent = (s.attendance || 0) + '%';

        if (s.couponCode) {
            document.getElementById('acadCoupon').textContent = `${s.couponCode} (-${s.couponDiscount}%)`;
        } else {
            document.getElementById('acadCoupon').textContent = 'None';
            document.getElementById('acadCoupon').classList.add('empty');
        }

        if (s.enrolledAt && s.enrolledAt.seconds) {
            const d = new Date(s.enrolledAt.seconds * 1000);
            document.getElementById('acadEnrolledAt').textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';

    } catch (err) {
        console.error('Profile load error:', err);
        document.getElementById('loadingScreen').innerHTML = `<p style="color:#991B1B;font-weight:700;">Unable to load profile.</p>`;
    }
});

document.getElementById('personalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('savePersonalBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    try {
        const updates = {
            fullName: e.target.fullName.value.trim(),
            fatherName: e.target.fatherName.value.trim(),
            city: e.target.city.value.trim(),
            cnic: e.target.cnic.value.trim(),
            bio: e.target.bio.value.trim(),
            dob: e.target.dob.value,
            gender: e.target.gender.value,
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'students', currentStudentId), updates);

        document.getElementById('profileBannerName').textContent = updates.fullName;
        showToast('Personal info saved successfully');

    } catch (err) {
        console.error('Save error:', err);
        alert('Failed to save: ' + err.message);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveContactBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    try {
        const updates = {
            whatsapp: e.target.whatsapp.value.trim(),
            altPhone: e.target.altPhone.value.trim(),
            address: e.target.address.value.trim(),
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'students', currentStudentId), updates);

        document.getElementById('profileBannerPhone').textContent = updates.whatsapp;
        showToast('Contact info saved successfully');

    } catch (err) {
        alert('Failed to save: ' + err.message);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

window.openAvatarModal = function() {
    document.getElementById('avatarModal').classList.add('active');
};
window.closeAvatarModal = function() {
    document.getElementById('avatarModal').classList.remove('active');
};
document.getElementById('avatarModal').addEventListener('click', (e) => {
    if (e.target.id === 'avatarModal') closeAvatarModal();
});

window.handleAvatarUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Please upload an image smaller than 2 MB.');
        return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Only JPG and PNG images are allowed.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;

        try {
            await updateDoc(doc(db, 'students', currentStudentId), {
                profilePicture: base64,
                updatedAt: serverTimestamp()
            });

            document.getElementById('profileAvatar').innerHTML = `<img src="${base64}" alt="Profile">`;
            closeAvatarModal();
            showToast('Profile picture updated!');
        } catch (err) {
            alert('Failed to upload: ' + err.message);
        }
    };
    reader.readAsDataURL(file);
};
