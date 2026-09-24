/* ============================================================
   APEX LEARNING ACADEMY
   Register Page Controller
   Fixed Version — 2026.09
   ============================================================ */

import { db, auth } from '../../config/firebase-config.js';

import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


let appliedCoupon = null;


/* ============================================================
   DROPDOWN & MOBILE MENU
   ============================================================ */

function toggleDropdown() {
    const dropdown = document.getElementById('moreDropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('open');
}

document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        const menu = document.getElementById('mobileMenu');
        if (menu) menu.classList.remove('open');
    });
});


/* ============================================================
   COUPON APPLY
   ============================================================ */

window.applyCoupon = async function () {

    const codeInput = document.getElementById('couponCode');
    const msgBox = document.getElementById('couponMessage');
    const btn = document.getElementById('applyCouponBtn');

    if (!codeInput || !msgBox || !btn) return;

    const code = codeInput.value.trim().toUpperCase().replace(/\s/g, '');

    msgBox.className = 'coupon-message';
    msgBox.textContent = '';
    appliedCoupon = null;

    if (!code) {
        msgBox.className = 'coupon-message error';
        msgBox.textContent = 'Please enter a coupon code.';
        return;
    }

    if (code.length < 3) {
        msgBox.className = 'coupon-message error';
        msgBox.textContent = 'Coupon code must be at least 3 characters.';
        return;
    }

    msgBox.className = 'coupon-message loading';
    msgBox.textContent = 'Checking coupon...';
    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {

        const q = query(
            collection(db, 'coupons'),
            where('code', '==', code)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            msgBox.className = 'coupon-message error';
            msgBox.textContent = 'Invalid coupon code. Please check and try again.';
            return;
        }

        const couponDoc = snap.docs[0];
        const coupon = couponDoc.data();

        if (!coupon.active) {
            msgBox.className = 'coupon-message error';
            msgBox.textContent = 'This coupon is no longer active.';
            return;
        }

        if (coupon.expiresAt) {
            const expiryDate = new Date(coupon.expiresAt);
            if (new Date() > expiryDate) {
                msgBox.className = 'coupon-message error';
                msgBox.textContent = 'This coupon has expired.';
                return;
            }
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            msgBox.className = 'coupon-message error';
            msgBox.textContent = 'This coupon has reached its maximum usage limit.';
            return;
        }

        appliedCoupon = {
            id: couponDoc.id,
            code: coupon.code,
            discountPercent: coupon.discountPercent,
            description: coupon.description || ''
        };

        let couponMsg =
            'Coupon applied successfully! You get <strong>' +
            coupon.discountPercent +
            '% OFF</strong> on your course fee.';

        if (coupon.description) {
            couponMsg +=
                ' <br><span style="font-size:12.5px;opacity:0.85;">' +
                coupon.description +
                '</span>';
        }

        msgBox.className = 'coupon-message success';
        msgBox.innerHTML = couponMsg;

        codeInput.disabled = true;
        btn.textContent = 'Applied';
        btn.style.background = '#10B981';

    } catch (err) {
        console.error('Coupon check error:', err);
        msgBox.className = 'coupon-message error';
        msgBox.textContent = 'Unable to verify coupon. Please try again.';
    } finally {
        btn.disabled = false;
    }
};


/* ============================================================
   REGISTER FORM SUBMIT
   ============================================================ */

const registerForm = document.getElementById('registerForm');

if (registerForm) {

    registerForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalHTML = submitBtn.innerHTML;

        submitBtn.innerHTML = 'Submitting...';
        submitBtn.disabled = true;

        const formData = {
            fullName: document.querySelector('input[name="full_name"]').value.trim(),
            fatherName: document.querySelector('input[name="father_name"]').value.trim(),
            city: document.querySelector('input[name="city"]').value.trim(),
            whatsapp: document.querySelector('input[name="whatsapp"]').value.trim(),
            email: document.querySelector('input[name="email"]').value.trim().toLowerCase(),
            education: document.querySelector('select[name="education"]').value,
            course: document.querySelector('select[name="course"]').value,
            timing: document.querySelector('select[name="timing"]').value,
            reason: document.querySelector('textarea[name="reason"]').value.trim(),
            couponCode: appliedCoupon ? appliedCoupon.code : '',
            couponDiscount: appliedCoupon ? appliedCoupon.discountPercent : 0
        };

        if (!formData.fullName || !formData.email || !formData.whatsapp) {
            alert('Please fill all required fields.');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            return;
        }

        try {

            const tempPassword =
                'Apex@' + Math.random().toString(36).slice(-8);

            let user;

            try {

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        formData.email,
                        tempPassword
                    );

                user = userCredential.user;

            } catch (authError) {

                if (authError.code === 'auth/email-already-in-use') {
                    alert('This email is already registered. Please login instead.');
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                    return;
                }

                throw authError;
            }

            await addDoc(collection(db, 'students'), {
                uid: user.uid,
                fullName: formData.fullName,
                fatherName: formData.fatherName,
                city: formData.city,
                whatsapp: formData.whatsapp,
                email: formData.email,
                education: formData.education,
                course: formData.course,
                timing: formData.timing,
                reason: formData.reason,
                couponCode: formData.couponCode,
                couponDiscount: formData.couponDiscount,
                enrolledAt: serverTimestamp(),
                status: 'pending',
                attendance: 0,
                progress: 0
            });

            if (appliedCoupon) {
                try {
                    await updateDoc(
                        doc(db, 'coupons', appliedCoupon.id),
                        { usedCount: increment(1) }
                    );
                } catch (err) {
                    console.warn(
                        'Coupon usage increment failed:',
                        err.message
                    );
                }
            }

            await addDoc(collection(db, 'messages'), {
                type: 'new_registration',
                studentName: formData.fullName,
                email: formData.email,
                phone: formData.whatsapp,
                course: formData.course,
                coupon: formData.couponCode || 'None',
                sentAt: serverTimestamp()
            });

            const modalName = document.getElementById('modalName');
            const modalEmail = document.getElementById('modalEmail');
            const modalCourse = document.getElementById('modalCourse');

            if (modalName) modalName.textContent = formData.fullName;
            if (modalEmail) modalEmail.textContent = formData.email;
            if (modalCourse) modalCourse.textContent = formData.course;

            const modalCouponRow = document.getElementById('modalCouponRow');
            const modalCoupon = document.getElementById('modalCoupon');

            if (appliedCoupon && modalCouponRow && modalCoupon) {
                modalCouponRow.style.display = 'flex';
                modalCoupon.textContent =
                    appliedCoupon.code +
                    ' (-' +
                    appliedCoupon.discountPercent +
                    '%)';
            } else if (modalCouponRow) {
                modalCouponRow.style.display = 'none';
            }

            const successModal = document.getElementById('successModal');
            if (successModal) successModal.classList.add('active');

            document.body.style.overflow = 'hidden';

        } catch (error) {

            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);

            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;

        }

    });

}


/* ============================================================
   SUCCESS MODAL
   ============================================================ */

window.closeSuccessModal = function () {

    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('active');

    document.body.style.overflow = '';

    /*
       FIX: ../index.html (kyunki ye pages/ folder mein hai)
       Pehle 'index.html' tha — isliye 404 aata tha.
    */

    window.location.href = '../index.html';

};


const successModal = document.getElementById('successModal');

if (successModal) {

    successModal.addEventListener('click', (e) => {
        if (e.target.id === 'successModal') {
            closeSuccessModal();
        }
    });

}


/* ============================================================
   COUPON INPUT — Enter Key
   ============================================================ */

const couponCodeInput = document.getElementById('couponCode');

if (couponCodeInput) {

    couponCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyCoupon();
        }
    });

}
