import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.verifyCert = async function() {
    const input = document.getElementById('certInput').value.trim().toUpperCase();
    const result = document.getElementById('result');
    const btn = document.getElementById('verifyBtn');

    if (!input) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 18px 22px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; color: #92400E; font-size: 14.5px; display: flex; align-items: center; gap: 10px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Please enter a certificate ID.
            </div>`;
        return;
    }

    if (!input.startsWith('APEX-')) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 18px 22px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; color: #92400E; font-size: 14.5px;">
                Invalid format. Certificate ID should start with <strong>APEX-</strong>
            </div>`;
        return;
    }

    btn.textContent = 'Verifying...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        const q = query(collection(db, "certificates"), where("certificateId", "==", input));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {

            result.style.display = 'block';
            result.innerHTML = `
                <div style="padding: 28px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                        <div style="width: 44px; height: 44px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="3">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </div>
                        <div>
                            <strong style="color: #991B1B; font-size: 17px; display: block;">Certificate Not Found</strong>
                            <span style="color: #991B1B; font-size: 13px; opacity: 0.8;">ID: ${input}</span>
                        </div>
                    </div>
                    <p style="font-size: 14.5px; color: #991B1B; margin: 0; line-height: 1.7;">
                        This certificate ID is not valid or does not exist in our records. 
                        Please check the ID and try again.
                    </p>
                </div>`;
        } else {

            const cert = querySnapshot.docs[0].data();
            result.style.display = 'block';
            result.innerHTML = `
                <div style="padding: 28px; background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="width: 44px; height: 44px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <div>
                            <strong style="color: #065F46; font-size: 17px; display: block;">Certificate Valid</strong>
                            <span style="color: #065F46; font-size: 13px; opacity: 0.8;">Verified on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="display: grid; gap: 14px;">
                            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
                                <span style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Student Name</span>
                                <span style="color: #0A2540; font-weight: 700; font-size: 14.5px;">${cert.studentName || 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
                                <span style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Course</span>
                                <span style="color: #0A2540; font-weight: 700; font-size: 14.5px; text-align: right;">${cert.course || 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
                                <span style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Issue Date</span>
                                <span style="color: #0A2540; font-weight: 700; font-size: 14.5px;">${cert.issueDate || 'N/A'}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #64748B; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Certificate ID</span>
                                <span style="color: #F4B400; font-weight: 800; font-size: 14.5px; letter-spacing: 1px;">${cert.certificateId || input}</span>
                            </div>
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #065F46; margin: 16px 0 0; text-align: center; opacity: 0.85;">
                        This certificate was officially issued by Apex Learning Academy.
                    </p>
                </div>`;
        }

    } catch (error) {
        console.error('Verification error:', error);
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 20px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; color: #991B1B; font-size: 14.5px;">
                <strong>Connection Error</strong><br>
                Unable to verify right now. Please try again later or contact us on WhatsApp.
            </div>`;
    } finally {
        btn.textContent = 'Verify Certificate';
        btn.disabled = false;
        btn.style.opacity = '1';
    }
};
