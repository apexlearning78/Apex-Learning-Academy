import { db } from '../../config/firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DEFAULT_REPLY = `Assalam-o-Alaikum {NAME},

Thank you for contacting Apex Learning Academy.

We have received your message regarding "{SUBJECT}".

Our official team is reviewing your inquiry and will get back to you within 24 hours on WhatsApp or email.

In the meantime, feel free to:
  •  Browse our courses
  •  Join our WhatsApp community
  •  Contact us directly: 0341 034 9929

Best regards,
Apex Learning Academy Team
Learn. Rise. Achieve.`;

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('contactSubmitBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim().toLowerCase();
    const subject = document.getElementById('cSubject').value.trim();
    const message = document.getElementById('cMessage').value.trim();

    const autoReply = DEFAULT_REPLY
        .replace(/{NAME}/g, name)
        .replace(/{SUBJECT}/g, subject);

    try {

        await addDoc(collection(db, 'messages'), {
            name,
            email,
            subject,
            message,
            type: 'contact',
            status: 'unread',
            autoReply: autoReply,
            repliedAt: null,
            adminReply: null,
            sentAt: serverTimestamp()
        });

        document.getElementById('autoReplyText').innerHTML = autoReply
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        document.getElementById('successModal').classList.add('active');
        document.body.style.overflow = 'hidden';

        document.getElementById('contactForm').reset();

    } catch (err) {
        console.error('Contact submit error:', err);
        alert('Failed to send message. Please try WhatsApp instead: 0341 034 9929');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

window.closeSuccessModal = function() {
    document.getElementById('successModal').classList.remove('active');
    document.body.style.overflow = '';
    window.location.href = 'index.html';
};

function toggleDropdown() {
    document.getElementById('moreDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreDropdown');
    if (dropdown && !dropdown.contains(e.target)) dropdown.classList.remove('open');
});
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('mobileMenu').classList.remove('open'));
});
