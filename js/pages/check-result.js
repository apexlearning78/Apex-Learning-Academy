import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentType = 'certificate';

window.switchTab = function(type) {
    currentType = type;

    document.querySelectorAll('.verify-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });

    const labels = {
        certificate: 'Certificate ID',
        result: 'Result ID',
        attendance: 'Student ID',
        marksheet: 'Marksheet ID'
    };
    const placeholders = {
        certificate: 'APEX-2026-001',
        result: 'APEX-RES-2026-001',
        attendance: 'APEX-2026-001',
        marksheet: 'APEX-MAR-2026-001'
    };
    document.getElementById('inputLabel').textContent = labels[type];
    document.getElementById('certInput').placeholder = placeholders[type];

    document.getElementById('result').style.display = 'none';
    document.getElementById('certInput').value = '';
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function notFoundBox(id, typeName) {
    return `
        <div style="padding: 28px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                <div style="width: 44px; height: 44px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="3">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </div>
                <div>
                    <strong style="color: #991B1B; font-size: 17px; display: block;">${typeName} Not Found</strong>
                    <span style="color: #991B1B; font-size: 13px; opacity: 0.8;">ID: ${escapeHtml(id)}</span>
                </div>
            </div>
            <p style="font-size: 14.5px; color: #991B1B; margin: 0; line-height: 1.7;">
                This ${typeName.toLowerCase()} ID is not valid or does not exist in our records. Please check the ID and try again.
            </p>
        </div>`;
}

function successHeader(title, subtitle) {
    return `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 44px; height: 44px; background: rgba(16, 185, 129, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div>
                <strong style="color: #065F46; font-size: 17px; display: block;">${title}</strong>
                <span style="color: #065F46; font-size: 13px; opacity: 0.8;">${subtitle}</span>
            </div>
        </div>`;
}

function row(label, value, valueClass = '') {
    return `
        <div class="result-row">
            <span class="result-label">${label}</span>
            <span class="result-value ${valueClass}">${escapeHtml(value || 'N/A')}</span>
        </div>`;
}

async function verifyCertificate(input) {
    const q = query(collection(db, "certificates"), where("certificateId", "==", input));
    const snap = await getDocs(q);
    if (snap.empty) return notFoundBox(input, 'Certificate');
    const c = snap.docs[0].data();
    return `
        <div style="padding: 28px; background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 12px;">
            ${successHeader('Certificate Valid', 'Verified on ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}
            <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
                ${row('Student Name', c.studentName)}
                ${row('Course', c.course)}
                ${row('Issue Date', c.issueDate)}
                ${row('Grade', c.grade || '—', 'green')}
                ${row('Certificate ID', c.certificateId || input, 'gold')}
            </div>
            <p style="font-size: 13px; color: #065F46; margin: 16px 0 0; text-align: center; opacity: 0.85;">
                This certificate was officially issued by Apex Learning Academy.
            </p>
        </div>`;
}

async function verifyResult(input) {
    const q = query(collection(db, "results"), where("resultId", "==", input));
    const snap = await getDocs(q);
    if (snap.empty) return notFoundBox(input, 'Result');
    const r = snap.docs[0].data();
    const status = (r.status || 'PASS').toUpperCase();
    const statusClass = status === 'PASS' ? 'green' : 'red';
    return `
        <div style="padding: 28px; background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 12px;">
            ${successHeader('Result Verified', 'Verified on ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}
            <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
                ${row('Student Name', r.studentName)}
                ${row('Course', r.course)}
                ${row('Exam Type', r.examType || 'Final')}
                ${row('Total Marks', r.totalMarks)}
                ${row('Obtained Marks', r.obtainedMarks)}
                ${row('Percentage', r.percentage ? r.percentage + '%' : '—', 'gold')}
                ${row('Grade', r.grade || '—', 'gold')}
                ${row('Status', status, statusClass)}
                ${row('Result ID', r.resultId || input, 'gold')}
            </div>
        </div>`;
}

async function verifyAttendance(input) {
    const q = query(collection(db, "attendance"), where("studentId", "==", input));
    const snap = await getDocs(q);
    if (snap.empty) return notFoundBox(input, 'Attendance Record');
    const a = snap.docs[0].data();
    
    const total = a.totalClasses || 0;
    const attended = a.attendedClasses || 0;
    const absent = total - attended;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    let barClass = '';
    if (percentage < 60) barClass = 'danger';
    else if (percentage < 75) barClass = 'warning';
    
    return `
        <div style="padding: 28px; background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 12px;">
            ${successHeader('Attendance Verified', 'Verified on ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}
            <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
                ${row('Student Name', a.studentName)}
                ${row('Course', a.course)}
                ${row('Student ID', a.studentId || input, 'gold')}
                
                <div style="margin-top: 18px;">
                    <div class="attendance-stats">
                        <div class="att-stat">
                            <div class="att-stat-value">${total}</div>
                            <div class="att-stat-label">Total</div>
                        </div>
                        <div class="att-stat">
                            <div class="att-stat-value green">${attended}</div>
                            <div class="att-stat-label">Present</div>
                        </div>
                        <div class="att-stat">
                            <div class="att-stat-value red">${absent}</div>
                            <div class="att-stat-label">Absent</div>
                        </div>
                    </div>
                    
                    <div class="att-progress">
                        <div class="att-progress-fill ${barClass}" style="width: ${percentage}%;"></div>
                    </div>
                    <p style="text-align: center; font-size: 14px; font-weight: 700; color: #0A2540; margin: 0;">
                        Attendance: <span style="color: ${percentage >= 75 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444'};">${percentage}%</span>
                    </p>
                </div>
            </div>
        </div>`;
}

async function verifyMarksheet(input) {
    const q = query(collection(db, "marksheets"), where("marksheetId", "==", input));
    const snap = await getDocs(q);
    if (snap.empty) return notFoundBox(input, 'Marksheet');
    const m = snap.docs[0].data();
    
    const subjects = Array.isArray(m.subjects) ? m.subjects : [];
    let subjectRows = '';
    let totalObtained = 0;
    let totalMax = 0;
    
    subjects.forEach(s => {
        const obtained = Number(s.obtained) || 0;
        const max = Number(s.max) || 100;
        totalObtained += obtained;
        totalMax += max;
        const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
        const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
        subjectRows += `
            <tr>
                <td>${escapeHtml(s.name)}</td>
                <td>${obtained} / ${max}</td>
                <td style="color: ${color}; font-weight: 800;">${pct}%</td>
            </tr>`;
    });
    
    const totalPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    
    return `
        <div style="padding: 28px; background: #ECFDF5; border-left: 4px solid #10B981; border-radius: 12px;">
            ${successHeader('Marksheet Verified', 'Verified on ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}
            <div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.2);">
                ${row('Student Name', m.studentName)}
                ${row('Course', m.course)}
                ${row('Exam Date', m.examDate)}
                ${row('Marksheet ID', m.marksheetId || input, 'gold')}
                
                ${subjects.length > 0 ? `
                    <table class="marksheet-table" style="margin-top: 18px;">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Marks</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectRows}
                            <tr class="total-row">
                                <td>Total</td>
                                <td>${totalObtained} / ${totalMax}</td>
                                <td>${totalPct}%</td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="text-align: center; font-size: 14px; font-weight: 800; color: #0A2540; margin: 16px 0 0;">
                        Overall Grade: <span style="color: #F4B400; letter-spacing: 1px;">${escapeHtml(m.grade || '—')}</span>
                    </p>
                ` : '<p style="text-align: center; color: #64748B; font-size: 13px; margin-top: 16px;">No subject details available.</p>'}
            </div>
        </div>`;
}

window.verifyDoc = async function() {
    const input = document.getElementById('certInput').value.trim().toUpperCase();
    const result = document.getElementById('result');
    const btn = document.getElementById('verifyBtn');

    if (!input) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 18px 22px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; color: #92400E; font-size: 14.5px; display: flex; align-items: center; gap: 10px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Please enter a valid ID.
            </div>`;
        return;
    }

    if (!input.startsWith('APEX-')) {
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 18px 22px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; color: #92400E; font-size: 14.5px;">
                Invalid format. ID should start with <strong>APEX-</strong>
            </div>`;
        return;
    }

    const originalText = btn.textContent;
    btn.innerHTML = '<span class="btn-loading-spinner"></span>Checking...';
    btn.disabled = true;
    btn.style.opacity = '0.85';

    try {
        let html = '';
        if (currentType === 'certificate') html = await verifyCertificate(input);
        else if (currentType === 'result') html = await verifyResult(input);
        else if (currentType === 'attendance') html = await verifyAttendance(input);
        else if (currentType === 'marksheet') html = await verifyMarksheet(input);

        result.style.display = 'block';
        result.innerHTML = html;

    } catch (error) {
        console.error('Verification error:', error);
        result.style.display = 'block';
        result.innerHTML = `
            <div style="padding: 20px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; color: #991B1B; font-size: 14.5px;">
                <strong>Connection Error</strong><br>
                Unable to check right now. Please try again later or contact us on WhatsApp.
            </div>`;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
};
