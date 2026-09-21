import { db } from '../../config/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById('instructorForm');
const submitBtn = document.getElementById('submitBtn');
const modal = document.getElementById('thanksModal');

window.closeThanksModal = function() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    window.location.href = 'instructors.html';
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    const data = {

        fullName: form.fullName.value.trim(),
        fatherName: form.fatherName.value.trim(),
        dob: form.dob.value,
        gender: form.gender.value,
        cnic: form.cnic.value.trim(),
        city: form.city.value.trim(),
        address: form.address.value.trim(),

        whatsapp: form.whatsapp.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        altPhone: form.altPhone.value.trim(),

        qualification: form.qualification.value,
        field: form.field.value.trim(),
        institution: form.institution.value.trim(),
        gradYear: form.gradYear.value,

        subject: form.subject.value,
        experience: form.experience.value,
        mode: form.mode.value,
        availability: form.availability.value,
        salary: form.salary.value.trim(),

        linkedin: form.linkedin.value.trim(),
        github: form.github.value.trim(),
        portfolio: form.portfolio.value.trim(),

        motivation: form.motivation.value.trim(),
        philosophy: form.philosophy.value.trim(),
        achievements: form.achievements.value.trim(),

        type: 'instructor_application',
        status: 'pending',
        appliedAt: serverTimestamp()
    };

    if (!data.fullName || !data.email || !data.whatsapp || !data.subject) {
        alert('Please fill all required fields.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        await addDoc(collection(db, "instructorApplications"), data);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        form.reset();

    } catch (error) {
        console.error('Application error:', error);
        alert('Unable to submit application. Please try again or contact us on WhatsApp.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});
