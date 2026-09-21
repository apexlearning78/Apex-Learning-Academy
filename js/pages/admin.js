import { auth, db } from '../../config/firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_UID = 'VHbqYaHK6yXP2f8IF9WKc33kkD73';
if(window.emailjs){emailjs.init({publicKey:'0CuJdjkOPS6ovXLmt'});window.__apexEmailReady=true;}
const ADMIN_NAME = 'Mukesh Kewal';

const MODULES = {
 students:{label:'Students',collection:'students',fields:['name','email','phone','course','batch','status','createdAt']},
 instructors:{label:'Instructors',collection:'instructorApplications',fields:['name','email','phone','subject','status','createdAt']},
 messages:{label:'Messages',collection:'messages',fields:['name','email','subject','status','createdAt']},
 fees:{label:'Fees & Payments',collection:'fees',fields:['studentName','studentEmail','amount','status','method','dueDate','paidAt']},
 progress:{label:'Course Progress',collection:'courseProgress',fields:['studentName','studentEmail','course','progress','status','updatedAt']},
 attendance:{label:'Attendance',collection:'attendance',fields:['studentName','studentEmail','className','role','status','joinedAt','leftAt']},
 tests:{label:'Tests & Results',collection:'testSubmissions',fields:['studentName','studentEmail','testTitle','score','status','submittedAt']},
 certificates:{label:'Certificates',collection:'certificates',fields:['studentName','studentEmail','course','certificateId','status','issuedAt']},
 liveClasses:{label:'Live Classes',collection:'liveClasses',fields:['subjectLabel','title','day','time','roomName','status']},
 announcements:{label:'Announcements',collection:'announcements',fields:['title','message','status','audience','publishedAt']},
 reviews:{label:'Reviews',collection:'reviews',fields:['name','email','rating','review','status','createdAt']},
 coupons:{label:'Coupons',collection:'coupons',fields:['code','discount','type','status','expiresAt']},
 emailLogs:{label:'Email Logs',collection:'emailLogs',fields:['studentName','instructorName','studentEmail','instructorEmail','subject','sentVia','type','sentAt']},
 visitors:{label:'Visitors',collection:'visitors',fields:['ip','page','userAgent','createdAt']},
 visits:{label:'Page Views',collection:'visits',fields:['page','path','referrer','createdAt']},
 courses:{label:'Courses',collection:'courses',fields:['name','code','duration','fee','status','description']},
 batches:{label:'Batches',collection:'batches',fields:['name','course','timing','instructor','status','startDate']}
};
const DEFAULT_SCHEDULE=[
 {id:'default-coding-mon',subjectLabel:'Coding Course',title:'Python — Functions & Modules',day:'Monday',time:'6:00 PM to 8:00 PM',roomName:'ApexLearning-Coding-Batch1'},
 {id:'default-ai-tue',subjectLabel:'AI Course',title:'Introduction to Machine Learning',day:'Tuesday',time:'6:00 PM to 8:00 PM',roomName:'ApexLearning-AI-Batch1'},
 {id:'default-coding-wed',subjectLabel:'Coding Course',title:'HTML & CSS — Responsive Layouts',day:'Wednesday',time:'6:00 PM to 8:00 PM',roomName:'ApexLearning-Coding-Batch1'},
 {id:'default-ai-thu',subjectLabel:'AI Course',title:'Prompt Engineering Workshop',day:'Thursday',time:'6:00 PM to 8:00 PM',roomName:'ApexLearning-AI-Batch1'},
 {id:'default-doubt-sat',subjectLabel:'Doubt Session',title:'Open Q&A — All Students Welcome',day:'Saturday',time:'6:00 PM to 8:00 PM',roomName:'ApexLearning-DoubtSession'}
];

let data={}, currentTab='dashboard', currentUser=null, jitsi=null, currentClass=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>{
 if(!v)return '—';
 if(v?.seconds)return new Date(v.seconds*1000).toLocaleString();
 if(v instanceof Date)return v.toLocaleString();
 if(typeof v==='object')return JSON.stringify(v);
 return String(v);
};
const toast=(m,error=false)=>{const t=$('toast');t.textContent=m;t.className='toast show'+(error?' error':'');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.className='toast',2600)};
function log(action,detail=''){const a=JSON.parse(localStorage.getItem('apex_admin_audit')||'[]');a.unshift({action,detail,time:new Date().toISOString(),admin:currentUser?.email||'admin'});localStorage.setItem('apex_admin_audit',JSON.stringify(a.slice(0,80)));renderActivity()}

function showModal(title,body,foot=''){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalFoot').innerHTML=foot;$('modalBg').classList.add('open')}
function closeModal(){$('modalBg').classList.remove('open')}
$('modalClose').onclick=closeModal;$('modalBg').onclick=e=>{if(e.target===$('modalBg'))closeModal()};

$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginError').classList.add('hidden');try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);toast('Secure login successful')}catch(err){$('loginError').textContent=err.message.replace('Firebase: ','');$('loginError').classList.remove('hidden')}};
$('logoutBtn').onclick=()=>signOut(auth);
onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(user){
   if(user.uid!==ADMIN_UID){toast('This account is not authorized for the admin panel',true);await signOut(auth);return}
   $('login').style.display='none';$('app').style.display='block';$('adminEmail').textContent=user.email||ADMIN_NAME;$('avatar').textContent=(user.email||'A')[0].toUpperCase();
   $('welcomeTitle').textContent=`Welcome back, ${ADMIN_NAME}`;
   log('Admin session started','Secure Firebase authentication');
   await loadAll();
 }else{$('login').style.display='grid';$('app').style.display='none'}
});

async function loadModule(key){
 const m=MODULES[key]; if(!m)return[];
 try{
  const snap=await getDocs(collection(db,m.collection));
  data[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
  return data[key];
 }catch(e){data[key]=[];console.warn(key,e);return[]}
}
async function loadAll(){
 $('liveStatus').textContent='Syncing academy data from Firebase…';
 await Promise.all(Object.keys(MODULES).map(loadModule));
 updateCounts();renderDashboard();if(currentTab!=='dashboard')renderModule();$('liveStatus').textContent=`Firebase synced • ${new Date().toLocaleTimeString()}`;
}
function updateCounts(){for(const k of ['students','instructors','messages'])$(`c-${k}`).textContent=(data[k]||[]).length;for(const k of ['students','instructors','fees','messages','tests','attendance'])$(`s-${k}`).textContent=(data[k]||[]).length}
function renderActivity(){const a=JSON.parse(localStorage.getItem('apex_admin_audit')||'[]');$('activity').innerHTML=a.slice(0,8).map(x=>`<div class="activity-item"><span class="activity-dot"></span><div><b>${esc(x.action)}</b>${x.detail?` — ${esc(x.detail)}`:''}<time>${new Date(x.time).toLocaleString()}</time></div></div>`).join('')||'<div class="empty" style="padding:20px">No activity yet.</div>'}
function renderDashboard(){
 updateCounts();renderActivity();
 const rows=[
  ['Students',data.students?.length||0,'Active academy learner records','students'],
  ['Instructors',data.instructors?.length||0,'Applications / teaching team','instructors'],
  ['Fees',data.fees?.length||0,'Financial records','fees'],
  ['Messages',data.messages?.length||0,'Incoming enquiries','messages'],
  ['Tests',data.tests?.length||0,'Submitted assessments','tests'],
  ['Attendance',data.attendance?.length||0,'Class attendance events','attendance'],
  ['Live Classes',data.liveClasses?.length||0,'Scheduled rooms','liveClasses'],
  ['Certificates',data.certificates?.length||0,'Issued / managed certificates','certificates']
 ];
 $('snapshot').innerHTML=`<table><thead><tr><th>Area</th><th>Records</th><th>Purpose</th><th>Open</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td><button class="btn btn-light" data-open="${r[3]}">Manage</button></td></tr>`).join('')}</tbody></table>`;
 $('snapshot').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>switchTab(b.dataset.open));
}

const APEX_EMAILJS_PUBLIC_KEY = '0CuJdjkOPS6ovXLmt';
const APEX_EMAILJS_SERVICE = 'service_bnv0t4n';
const APEX_EMAILJS_TEMPLATE = 'template_r3prv9y';

const EMAIL_TEMPLATES = {
    welcome: { subject: 'Welcome to Apex Learning Academy!', body: `Assalam-o-Alaikum {NAME},\n\nWelcome to Apex Learning Academy! We are thrilled to have you join our learning community.\n\nYour registration has been successfully received. Our team will contact you shortly with your class schedule, batch details, and login credentials.\n\nBest regards,\nMukesh Kewal\nFounder, Apex Learning Academy\nLearn. Rise. Achieve.` },
    idCard: { subject: 'Your Student ID Card is Ready', body: `Assalam-o-Alaikum {NAME},\n\nYour Official Student ID Card is now available on your dashboard.\n\nLogin: https://apexlearning78.github.io/Apex-Learning-Academy\nSection: My ID Card\n\nBest regards,\nMukesh Kewal` },
    fees: { subject: 'Fee Reminder — Apex Learning Academy', body: `Assalam-o-Alaikum {NAME},\n\nThis is a reminder regarding your monthly fee.\n\nPlease complete the payment via JazzCash, EasyPaisa, or Bank Transfer, and share the screenshot on WhatsApp.\n\nWhatsApp: 0341 034 9929\n\nBest regards,\nMukesh Kewal` },
    classReminder: { subject: 'Class Reminder', body: `Assalam-o-Alaikum {NAME},\n\nThis is a reminder about your upcoming live class. Please join on time and make sure your audio/video is working.\n\nBest regards,\nApex Learning Academy` },
    result: { subject: 'Your Result is Ready', body: `Assalam-o-Alaikum {NAME},\n\nYour recent result has been published. You can check it on your dashboard:\nhttps://apexlearning78.github.io/Apex-Learning-Academy/check-result.html\n\nBest regards,\nApex Learning Academy` },
    certificate: { subject: 'Congratulations! Your Certificate is Ready', body: `Assalam-o-Alaikum {NAME},\n\nCongratulations on completing your course at Apex Learning Academy!\n\nYour certificate is now available on your dashboard.\n\nBest regards,\nMukesh Kewal\nFounder & Lead Instructor` },
    attendance: { subject: 'Attendance Alert — Apex Learning Academy', body: `Assalam-o-Alaikum {NAME},\n\nYour attendance has been below the required 75%. Please attend upcoming classes to remain eligible for your certificate.\n\nBest regards,\nApex Learning Academy` },
    holiday: { subject: 'Holiday Notice', body: `Assalam-o-Alaikum {NAME},\n\nPlease note that Apex Learning Academy will remain closed on the upcoming holiday. Classes will resume on the next scheduled day.\n\nBest regards,\nApex Learning Academy` },
    custom: { subject: '', body: '' }
}

const INSTRUCTOR_REPLY_TEMPLATES = {
    received: {
        name: 'Application Received',
        desc: 'Acknowledge application',
        subject: 'Application Received — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for your interest in joining Apex Learning Academy as an instructor. We have successfully received your application for the position of {SUBJECT}.

Our hiring team will review your profile carefully and get back to you within 3-5 working days. If your profile matches our current requirements, we will contact you for the next steps.

We appreciate the time and effort you took to apply.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy
Learn. Rise. Achieve.`
    },
    shortlisted: {
        name: 'Shortlisted',
        desc: 'Move to interview',
        subject: 'Congratulations — You Are Shortlisted! | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Congratulations! We are pleased to inform you that your application for {SUBJECT} has been shortlisted by our hiring team.

Your profile and experience impressed us, and we would like to move forward with the next stage of the hiring process.

Next Steps:
1. We will schedule a short interview (online via Google Meet/Jitsi)
2. You will be asked to give a 10-minute demo lesson
3. Final selection will be communicated within 48 hours

Please confirm your availability by replying to this email or on WhatsApp.

We look forward to speaking with you!

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },
    rejected: {
        name: 'Not Selected',
        desc: 'Polite rejection',
        subject: 'Update Regarding Your Application | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for taking the time to apply for the {SUBJECT} position at Apex Learning Academy.

After careful review of all applications, we regret to inform you that we will not be moving forward with your application at this time. This was a difficult decision, as we received many strong applications.

We truly appreciate your interest in our academy and encourage you to apply again in the future as we continue to grow.

We wish you the very best in your future endeavors.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },
    interview: {
        name: 'Interview Invite',
        desc: 'Schedule interview',
        subject: 'Interview Invitation — Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

We are pleased to invite you for an online interview for the {SUBJECT} position at Apex Learning Academy.

Interview Details:
• Format: Online (Google Meet / Jitsi)
• Duration: 20-30 minutes
• Includes: Introduction + Demo lesson

Please let us know your preferred date and time (between 4:00 PM and 9:00 PM, Monday to Saturday). We will confirm the final slot via email.

Kindly reply with:
1. Your available dates
2. Your preferred time slot
3. Any questions you may have

Looking forward to speaking with you!

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },
    hired: {
        name: 'Hired — Welcome',
        desc: 'Welcome to team',
        subject: 'Welcome to the Apex Learning Academy Team!',
        body: `Assalam-o-Alaikum {NAME},

Congratulations! We are delighted to welcome you to the Apex Learning Academy team as our new {SUBJECT}.

We were thoroughly impressed by your skills and passion for teaching, and we are excited to have you on board.

Onboarding Details:
1. Official welcome meeting will be scheduled
2. We will share your course curriculum and lesson plans
3. You will be introduced to our teaching platform (Jitsi)
4. First class schedule will be communicated shortly

Please share the following for our records:
• Your updated CV
• Your CNIC copy
• Your bank account details (for monthly payments)
• A professional profile picture

If you have any questions, feel free to reach out:
WhatsApp: 0341 034 9929
Email: mukeshkewal19@gmail.com

Welcome aboard! Let's build something amazing together.

Best regards,
Mukesh Kewal
Founder & Lead Instructor
Apex Learning Academy
Learn. Rise. Achieve.`
    },
    moreInfo: {
        name: 'Need More Info',
        desc: 'Request details',
        subject: 'Additional Information Required | Apex Learning Academy',
        body: `Assalam-o-Alaikum {NAME},

Thank you for your application for the {SUBJECT} position.

To proceed with your application, we require a bit more information from you:

1. Please share your updated CV / Resume
2. A brief description of your teaching experience
3. Any certifications or qualifications relevant to {SUBJECT}
4. Your availability for a demo lesson (day and time)
5. Your expected monthly compensation

Once we receive these details, our team will review your profile and get back to you within 2-3 working days.

Thank you for your patience.

Best regards,
Mukesh Kewal
Founder, Apex Learning Academy`
    },
    custom: {
        name: 'Custom Reply',
        desc: 'Write your own',
        subject: '',
        body: ''
    }
}

const STUDENT_REPLY_TEMPLATES = {
    thanks: `Assalam-o-Alaikum {NAME},\n\nThank you for reaching out to Apex Learning Academy. We have received your message and will respond within 24 hours.\n\nBest regards,\nApex Learning Academy Team\nWhatsApp: 0341 034 9929`,
    fees: `Assalam-o-Alaikum {NAME},\n\nCourse Fee Details:\n• Coding (Python + Web Development): Rs. 3,000/month (3 months)\n• Artificial Intelligence: Rs. 4,000/month (4 months)\n\nFor enrollment:\nWhatsApp: 0341 034 9929\n\nBest regards,\nApex Learning Academy`,
    timing: `Assalam-o-Alaikum {NAME},\n\nOur weekly class schedule:\n• Monday — Coding: 6:00 PM to 8:00 PM\n• Tuesday — AI: 6:00 PM to 8:00 PM\n• Wednesday — Coding: 6:00 PM to 8:00 PM\n• Thursday — AI: 6:00 PM to 8:00 PM\n• Saturday — Doubt Session: 6:00 PM to 8:00 PM\n\nWhatsApp: 0341 034 9929`,
    enrollment: `Assalam-o-Alaikum {NAME},\n\nEnrollment Process:\n1. Register on our website\n2. Our team contacts you within 24 hours\n3. Book your FREE demo class\n4. Make payment via JazzCash/EasyPaisa/Bank\n\nWhatsApp: 0341 034 9929`,
    demo: `Assalam-o-Alaikum {NAME},\n\nWe offer a FREE demo class. To book your slot, please share:\n1. Your preferred day\n2. Your preferred time\n\nWhatsApp: 0341 034 9929`,
    certificate: `Assalam-o-Alaikum {NAME},\n\nCertificate Details:\n• Issued after course completion\n• Requires 75% attendance\n• Unique Certificate ID for online verification\n\nWhatsApp: 0341 034 9929`,
    technical: `Assalam-o-Alaikum {NAME},\n\nWe apologize for the technical issue. Please share:\n1. A screenshot of the problem\n2. Your device and browser details\n3. When the issue occurred\n\nWhatsApp: 0341 034 9929`,
    payment: `Assalam-o-Alaikum {NAME},\n\nAccepted Payment Methods:\n1. JazzCash\n2. EasyPaisa\n3. Bank Transfer\n\nFees:\n• Coding: Rs. 3,000/month\n• AI: Rs. 4,000/month\n\nWhatsApp: 0341 034 9929`,
    custom: ''
}

let emailCenterMode='students';
let emailCourseFilter='all';
let emailSelectedIds=new Set();

function normalizeCourse(v=''){
 const x=String(v).toLowerCase();
 if(x.includes('artificial')||x==='ai'||x.includes('machine learning')) return 'Artificial Intelligence';
 if(x.includes('web')||x.includes('coding')||x.includes('python')) return 'Web Development';
 return String(v||'Unassigned');
}
function emailTargetRows(){
 if(emailCenterMode==='students') return (data.students||[]).filter(s=>emailCourseFilter==='all'||normalizeCourse(s.course)===emailCourseFilter);
 if(emailCenterMode==='instructors') return (data.instructors||[]).map(x=>({...x,fullName:x.fullName||x.name}));
 return (data.messages||[]).map(x=>({...x,fullName:x.fullName||x.name}));
}
function templateOptions(){
 const student=Object.entries(EMAIL_TEMPLATES).map(([k,v])=>`<option value="student:${k}">${v.subject||k}</option>`).join('');
 const reply=Object.entries(STUDENT_REPLY_TEMPLATES).map(([k])=>`<option value="reply:${k}">Reply • ${k}</option>`).join('');
 const inst=Object.entries(INSTRUCTOR_REPLY_TEMPLATES).map(([k,v])=>`<option value="instructor:${k}">Instructor • ${v.name||k}</option>`).join('');
 return `<option value="">Choose professional template…</option><optgroup label="Student Emails">${student}</optgroup><optgroup label="Student Response Templates">${reply}</optgroup><optgroup label="Instructor Emails">${inst}</optgroup>`;
}
function applyCommunicationTemplate(){
 const v=$('commTemplate').value;
 if(!v)return;
 const [type,key]=v.split(':'); let subject='',body='';
 const target=emailTargetRows().find(x=>emailSelectedIds.has(x.id))||emailTargetRows()[0]||{};
 const name=target.fullName||target.name||'Student';
 const course=target.course||'';
 if(type==='student'){subject=EMAIL_TEMPLATES[key].subject;body=EMAIL_TEMPLATES[key].body}
 if(type==='reply'){body=STUDENT_REPLY_TEMPLATES[key];subject=target.subject?`Re: ${target.subject}`:'Apex Learning Academy — Response'}
 if(type==='instructor'){subject=INSTRUCTOR_REPLY_TEMPLATES[key].subject;body=INSTRUCTOR_REPLY_TEMPLATES[key].body}
 const replace=(s)=>String(s||'').replace(/{NAME}/g,name).replace(/{COURSE}/g,course||'Web Development').replace(/{SUBJECT}/g,target.subject||target.position||target.course||'Instructor');
 $('commSubject').value=replace(subject);$('commBody').value=replace(body);
}
function renderCommunication(){
 const rows=emailTargetRows();
 const sent=(data.emailLogs||[]).length;
 const studentEmails=(data.students||[]).filter(x=>x.email).length;
 const instructorEmails=(data.instructors||[]).filter(x=>x.email).length;
 const courseCounts=['Web Development','Artificial Intelligence'].map(c=>`<div class="kpi"><b>${(data.students||[]).filter(s=>normalizeCourse(s.course)===c).length}</b><span>${c} Students</span></div>`).join('');
 $('customViewContent').innerHTML=`
 <div class="kpi-row">${courseCounts}<div class="kpi"><b>${sent}</b><span>Email Logs</span></div><div class="kpi"><b>${studentEmails+instructorEmails}</b><span>Email Contacts</span></div></div>
 <div class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>Professional Communication Center</h3><p style="font-size:12px;color:var(--muted);margin-top:4px">All student, instructor and website-response emails — including the original Apex templates.</p></div><div class="email-actions"><button class="btn btn-light" id="commRefresh">Refresh</button><button class="btn btn-gold" id="commLogs">Open Email Logs</button></div></div>
 <div class="course-tabs">
  <button class="course-tab ${emailCenterMode==='students'?'active':''}" data-comm-mode="students">Students</button>
  <button class="course-tab ${emailCenterMode==='instructors'?'active':''}" data-comm-mode="instructors">Instructors</button>
  <button class="course-tab ${emailCenterMode==='messages'?'active':''}" data-comm-mode="messages">Website Responses</button>
 </div>
 ${emailCenterMode==='students'?`<div class="course-tabs">
   <button class="course-tab ${emailCourseFilter==='all'?'active':''}" data-course-filter="all">All Students</button>
   <button class="course-tab ${emailCourseFilter==='Web Development'?'active':''}" data-course-filter="Web Development">🌐 Web Development</button>
   <button class="course-tab ${emailCourseFilter==='Artificial Intelligence'?'active':''}" data-course-filter="Artificial Intelligence">🤖 Artificial Intelligence</button>
 </div>`:''}
 <div class="email-layout">
  <div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Recipients (${rows.length})</b><label style="font-size:12px"><input type="checkbox" id="commSelectAll"> Select all</label></div>
   <div class="email-recipient-list">${rows.length?rows.map(x=>`<label class="email-recipient"><input type="checkbox" class="comm-recipient" value="${x.id}" ${emailSelectedIds.has(x.id)?'checked':''}><span class="email-avatar">${esc((x.fullName||x.name||'?').charAt(0).toUpperCase())}</span><span><b>${esc(x.fullName||x.name||'Unknown')}</b><small>${esc(x.email||'No email')}${x.course?' • '+esc(normalizeCourse(x.course)):''}</small></span></label>`).join(''):'<div class="empty" style="padding:30px">No email contacts in this view.</div>'}</div>
  </div>
  <div class="email-compose">
   <div class="field"><label>Professional Template</label><select id="commTemplate">${templateOptions()}</select></div>
   <div class="field"><label>Subject</label><input id="commSubject" placeholder="Email subject"></div>
   <div class="field"><label>Message</label><textarea id="commBody" placeholder="Write your professional Apex Learning Academy message…"></textarea></div>
   <div class="email-actions">
    <button class="btn btn-gold" id="commSend">✈ Send Email</button>
    <button class="btn btn-light" id="commWhatsApp">WhatsApp</button>
    <button class="btn btn-light" id="commSaveDraft">Save Draft</button>
   </div>
   <small style="color:var(--muted)">EmailJS is connected using the same service/template used by the original admin. Every successful send is recorded in <b>emailLogs</b>.</small>
  </div>
 </div></div>
 <div class="card"><div class="card-head"><h3>Recent Sent Emails</h3><button class="btn btn-light" id="commOpenLogs">View all</button></div><div class="table-wrap">${
   (data.emailLogs||[]).slice().reverse().slice(0,8).map(x=>`<table style="width:100%"><tr><td><b>${esc(x.studentName||x.instructorName||x.toName||'Recipient')}</b><br><small>${esc(x.studentEmail||x.instructorEmail||x.toEmail||'')}</small></td><td>${esc(x.subject||'')}</td><td>${esc(x.sentVia||'email')}</td><td>${esc(fmt(x.sentAt))}</td></tr></table>`).join('')||'<div class="empty" style="padding:20px">No sent emails yet.</div>'
 }</div></div>`;
 document.querySelectorAll('[data-comm-mode]').forEach(b=>b.onclick=()=>{emailCenterMode=b.dataset.commMode;emailSelectedIds.clear();renderCommunication()});
 document.querySelectorAll('[data-course-filter]').forEach(b=>b.onclick=()=>{emailCourseFilter=b.dataset.courseFilter;emailSelectedIds.clear();renderCommunication()});
 document.querySelectorAll('.comm-recipient').forEach(c=>c.onchange=()=>{if(c.checked)emailSelectedIds.add(c.value);else emailSelectedIds.delete(c.value)});
 $('commSelectAll')?.addEventListener('change',e=>{document.querySelectorAll('.comm-recipient').forEach(c=>{c.checked=e.target.checked;if(e.target.checked)emailSelectedIds.add(c.value);else emailSelectedIds.delete(c.value)})});
 $('commTemplate').onchange=applyCommunicationTemplate;
 $('commSend').onclick=sendCommunicationEmails;
 $('commWhatsApp').onclick=openCommunicationWhatsApp;
 $('commSaveDraft').onclick=()=>{localStorage.setItem('apex_email_draft',JSON.stringify({subject:$('commSubject').value,body:$('commBody').value,template:$('commTemplate').value}));toast('Email draft saved')}
 $('commRefresh').onclick=async()=>{await loadAll();renderCommunication();toast('Communication data refreshed')};
 $('commLogs').onclick=()=>switchTab('emailLogs');$('commOpenLogs').onclick=()=>switchTab('emailLogs');
}
async function sendOneEmail(target,subject,body,template){
 if(!target?.email) throw new Error('Recipient has no email');
 if(window.emailjs?.init && !window.__apexEmailReady){emailjs.init({publicKey:APEX_EMAILJS_PUBLIC_KEY});window.__apexEmailReady=true}
 await emailjs.send(APEX_EMAILJS_SERVICE,APEX_EMAILJS_TEMPLATE,{
   to_email:target.email,to_name:target.fullName||target.name||'Student',subject,
   original_message:target.message||'(Direct message from Apex Learning Academy)',
   reply_message:body,student_name:target.fullName||target.name||'Student',student_email:target.email
 });
 await addDoc(collection(db,'emailLogs'),{
   studentUid:target.uid||'',studentName:target.fullName||target.name||'',studentEmail:target.email||'',
   instructorUid:target.uid||'',instructorName:target.fullName||target.name||'',instructorEmail:target.email||'',
   subject,body,template:template||'custom',sentAt:serverTimestamp(),sentVia:'email',sentBy:'admin',
   course:target.course||'',type:emailCenterMode
 });
}
async function sendCommunicationEmails(){
 const targets=emailTargetRows().filter(x=>emailSelectedIds.has(x.id)&&x.email);
 const subject=$('commSubject').value.trim(),body=$('commBody').value.trim(),template=$('commTemplate').value;
 if(!targets.length){toast('Select at least one recipient with an email address',true);return}
 if(!subject||!body){toast('Subject and message are required',true);return}
 const btn=$('commSend');btn.disabled=true;btn.textContent='Sending…';
 let ok=0,fail=0;
 for(const t of targets){try{await sendOneEmail(t,subject,body,template);ok++}catch(e){fail++;console.warn(e)}}
 btn.disabled=false;btn.textContent='✈ Send Email';
 log('Emails sent',`${ok} successful, ${fail} failed`);
 await loadAll();renderCommunication();toast(`${ok} email(s) sent${fail?' • '+fail+' failed':''}`,fail>0);
}
function openCommunicationWhatsApp(){
 const targets=emailTargetRows().filter(x=>emailSelectedIds.has(x.id)&&x.phone);
 const body=$('commBody').value.trim();if(!targets.length||!body){toast('Select a recipient with a phone number and write a message',true);return}
 let phone=String(targets[0].phone||targets[0].whatsapp||'').replace(/\D/g,'');if(phone.startsWith('0'))phone='92'+phone.slice(1);
 window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`,'_blank');
}
function renderCustomView(key){
 if(key==='emailCenter'){renderCommunication();return}
 if(key==='settings'){renderSettings();return}
 if(key==='audit'){renderAudit();return}
}
function renderSettings(){
 const saved=JSON.parse(localStorage.getItem('apex_academy_settings')||'{}');
 $('customViewContent').innerHTML=`<div class="card"><div class="card-head"><div><h3>Academy Settings & Edit</h3><p style="font-size:12px;color:var(--muted);margin-top:4px">Edit academy identity, contact details, email defaults and course structure.</p></div><button class="btn btn-gold" id="saveSettings">Save Settings</button></div>
 <div class="setting-grid">
  <div class="field"><label>Academy Name</label><input id="setName" value="${esc(saved.name||'Apex Learning Academy')}"></div>
  <div class="field"><label>Founder / Admin Name</label><input id="setFounder" value="${esc(saved.founder||'Mukesh Kewal')}"></div>
  <div class="field"><label>WhatsApp</label><input id="setWhatsApp" value="${esc(saved.whatsapp||'0341 034 9929')}"></div>
  <div class="field"><label>Contact Email</label><input id="setEmail" value="${esc(saved.email||'mukeshkewal19@gmail.com')}"></div>
  <div class="field"><label>Website</label><input id="setWebsite" value="${esc(saved.website||'https://apexlearning78.github.io/Apex-Learning-Academy')}"></div>
  <div class="field"><label>Student Result URL</label><input id="setResult" value="${esc(saved.resultUrl||'https://apexlearning78.github.io/Apex-Learning-Academy/check-result.html')}"></div>
 </div>
 </div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><h3>Courses — Edit</h3><p style="font-size:12px;color:var(--muted)">These two courses are kept separate everywhere in the admin.</p></div><button class="btn btn-light" id="openCourses">Manage Courses</button></div>
 <div class="setting-grid">
  <div class="course-card"><div><h4>🌐 Web Development</h4><p>Primary student grouping: Web Development. Existing Coding/Python/Web records are normalized into this group for filtering.</p></div><button class="btn btn-light" data-edit-course="Web Development">Edit</button></div>
  <div class="course-card"><div><h4>🤖 Artificial Intelligence</h4><p>Primary student grouping: Artificial Intelligence. Existing AI/Machine Learning records are normalized into this group for filtering.</p></div><button class="btn btn-light" data-edit-course="Artificial Intelligence">Edit</button></div>
 </div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><h3>System Controls</h3></div><div class="email-actions">
  <button class="btn btn-light" id="saveDraftFromSettings">Open Saved Email Draft</button>
  <button class="btn btn-light" id="clearAudit">Clear Local Audit</button>
  <button class="btn btn-light" id="resetSettings">Reset Settings</button>
 </div></div>`;
 $('saveSettings').onclick=()=>{
  const s={name:$('setName').value,founder:$('setFounder').value,whatsapp:$('setWhatsApp').value,email:$('setEmail').value,website:$('setWebsite').value,resultUrl:$('setResult').value};
  localStorage.setItem('apex_academy_settings',JSON.stringify(s));toast('Academy settings saved');
 };
 $('openCourses').onclick=()=>switchTab('courses');
 $('saveDraftFromSettings').onclick=()=>{switchTab('emailCenter');setTimeout(()=>{const d=JSON.parse(localStorage.getItem('apex_email_draft')||'{}');if($('commSubject'))$('commSubject').value=d.subject||'';if($('commBody'))$('commBody').value=d.body||''},50)};
 $('clearAudit').onclick=()=>{localStorage.removeItem('apex_admin_audit');renderSettings();toast('Local audit cleared')};
 $('resetSettings').onclick=()=>{localStorage.removeItem('apex_academy_settings');renderSettings();toast('Settings reset')};
}
function renderAudit(){
 const a=JSON.parse(localStorage.getItem('apex_admin_audit')||'[]');
 $('customViewContent').innerHTML=`<div class="card"><div class="card-head"><div><h3>Admin Audit Trail</h3><p style="font-size:12px;color:var(--muted)">Local browser audit of admin actions in this Command Center.</p></div><button class="btn btn-light" id="auditClear">Clear</button></div>
 <div class="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Detail</th><th>Admin</th></tr></thead><tbody>${a.length?a.map(x=>`<tr><td>${esc(new Date(x.time).toLocaleString())}</td><td>${esc(x.action)}</td><td>${esc(x.detail||'')}</td><td>${esc(x.admin||'admin')}</td></tr>`).join(''):'<tr><td colspan="4">No audit records.</td></tr>'}</tbody></table></div></div>`;
 $('auditClear').onclick=()=>{localStorage.removeItem('apex_admin_audit');renderAudit()};
}
function normalizeStudentRows(){

 return (data.students||[]).map(s=>({...s,courseGroup:normalizeCourse(s.course)}));
}

function switchTab(key){
 currentTab=key;
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.tab===key));
 const custom=['emailCenter','settings','audit'];
 $('dashboardView').classList.toggle('hidden',key!=='dashboard');
 $('moduleView').classList.toggle('hidden',key==='dashboard'||custom.includes(key));
 $('customView').classList.toggle('hidden',!custom.includes(key));
 $('pageTitle').textContent=key==='dashboard'?'Overview':(MODULES[key]?.label||key==='emailCenter'?'Communication Center':key==='settings'?'Academy Settings':key==='audit'?'Admin Audit':'Administration');
 if($('studentCourseFilter'))$('studentCourseFilter').style.display=key==='students'?'inline-flex':'none';
 if(key==='students'&&$('studentCourseFilter'))$('studentCourseFilter').onchange=renderModule;
 if(key==='dashboard')renderDashboard();
 else if(custom.includes(key))renderCustomView(key);
 else renderModule();
 $('sidebar').classList.remove('open');
}
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>switchTab(b.dataset.go));
$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
$('refreshBtn').onclick=async()=>{await loadAll();toast('Academy data refreshed')};$('dashboardRefresh').onclick=async()=>{await loadAll();toast('Dashboard refreshed')};
$('reloadBtn').onclick=async()=>{await loadModule(currentTab);renderModule();toast('Module refreshed')};
$('globalSearch').oninput=e=>{const q=e.target.value.toLowerCase().trim();if(!q)return;const found=Object.keys(MODULES).find(k=>(data[k]||[]).some(x=>JSON.stringify(x).toLowerCase().includes(q)));if(found)switchTab(found)};
$('moduleSearch').oninput=renderModule;$('statusFilter').onchange=renderModule;

function badge(v){if(!v)return'—';const x=String(v).toLowerCase();let c='b-gray';if(['active','paid','approved','hired','completed','pass','published'].includes(x))c='b-green';else if(['pending','unpaid','reviewed','scheduled'].includes(x))c='b-gold';else if(['rejected','fail','unpaid','cancelled'].includes(x))c='b-red';else if(['live','shortlisted'].includes(x))c='b-blue';return `<span class="badge ${c}">${esc(v)}</span>`}
function renderModule(){
 const m=MODULES[currentTab];if(!m)return;
 let rows=currentTab==='students'?normalizeStudentRows():(data[currentTab]||[]);
 if(currentTab==='students'){
   const existing=$('studentCourseFilter');
   if(existing) rows=rows.filter(x=>existing.value==='all'||x.courseGroup===existing.value);
 }
 const q=($('moduleSearch').value||'').toLowerCase().trim(),st=$('statusFilter').value;
 if(q)rows=rows.filter(x=>JSON.stringify(x).toLowerCase().includes(q));if(st)rows=rows.filter(x=>String(x.status||'').toLowerCase()===st);
 if(!rows.length){$('moduleTable').innerHTML='<div class="empty"><strong>No records found</strong><span>Try changing your search/filter or add a new record.</span></div>';return}
 const fields=m.fields;
 $('moduleTable').innerHTML=`<table><thead><tr>${fields.map(f=>`<th>${esc(f.replace(/([A-Z])/g,' $1'))}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map(x=>`<tr>${fields.map(f=>`<td>${f.toLowerCase().includes('status')?badge(x[f]):`<span title="${esc(fmt(x[f]))}">${esc(fmt(x[f]))}</span>`}</td>`).join('')}<td class="actions"><button class="btn btn-blue view" data-id="${x.id}">View</button><button class="btn btn-light edit" data-id="${x.id}">Edit</button><button class="btn btn-danger del" data-id="${x.id}">Delete</button></td></tr>`).join('')}</tbody></table>`;
 $('moduleTable').querySelectorAll('.view').forEach(b=>b.onclick=()=>viewRecord(b.dataset.id));
 $('moduleTable').querySelectorAll('.edit').forEach(b=>b.onclick=()=>editRecord(b.dataset.id));
 $('moduleTable').querySelectorAll('.del').forEach(b=>b.onclick=()=>deleteRecord(b.dataset.id));
 addStudentEmailButtons();
}
function addStudentEmailButtons(){
 if(currentTab!=='students')return;
 document.querySelectorAll('#moduleTable tbody tr').forEach((tr,i)=>{
   const rows=normalizeStudentRows(); const q=($('moduleSearch').value||'').toLowerCase().trim();
   let filtered=rows.filter(x=>!q||JSON.stringify(x).toLowerCase().includes(q));
   if($('studentCourseFilter')?.value&&$('studentCourseFilter').value!=='all')filtered=filtered.filter(x=>x.courseGroup===$('studentCourseFilter').value);
   const r=filtered[i]; const actions=tr.querySelector('.actions');
   if(r&&actions&&!actions.querySelector('.quick-email')){const b=document.createElement('button');b.className='btn btn-blue quick-email';b.textContent='Email';b.onclick=()=>{emailCenterMode='students';emailCourseFilter=normalizeCourse(r.course);emailSelectedIds=new Set([r.id]);switchTab('emailCenter')};actions.prepend(b)}
 });
}

function viewRecord(id){
 const x=(data[currentTab]||[]).find(r=>r.id===id);if(!x)return;
 const html=`<div class="detail-grid">${Object.entries(x).filter(([k])=>k!=='id').map(([k,v])=>`<div class="detail"><small>${esc(k.replace(/([A-Z])/g,' $1'))}</small><b>${esc(fmt(v))}</b></div>`).join('')}</div>`;
 showModal(`${MODULES[currentTab].label} • Record`,html,`<button class="btn btn-light" id="modalDone">Close</button>`);$('modalDone').onclick=closeModal;
}
function formFor(item={}){
 const fields=MODULES[currentTab].fields;
 return `<div class="form-grid">${fields.map(f=>{
  const val=item[f];const isLong=['message','review','description','notes'].some(x=>f.toLowerCase().includes(x));
  const isDate=['date','at','expires'].some(x=>f.toLowerCase().endsWith(x)||f.toLowerCase().includes(x));
  if(isLong)return `<div class="field full"><label>${esc(f)}</label><textarea id="f_${f}" rows="4">${esc(fmt(val)==='—'?'':fmt(val))}</textarea></div>`;
  return `<div class="field"><label>${esc(f)}</label><input id="f_${f}" ${isDate?'type="datetime-local"':''} value="${esc(isDate&&val?.seconds?new Date(val.seconds*1000).toISOString().slice(0,16):fmt(val)==='—'?'':fmt(val))}"></div>`;
 }).join('')}</div>`;
}
function addRecord(){
 showModal(`Add ${MODULES[currentTab].label}`,formFor(),`<button class="btn btn-light" id="cancel">Cancel</button><button class="btn btn-primary" id="save">Save Record</button>`);
 $('cancel').onclick=closeModal;$('save').onclick=async()=>{await saveRecord()};
}
async function saveRecord(id=null){
 const m=MODULES[currentTab],payload={};
 for(const f of m.fields){const el=$(`f_${f}`);if(!el)continue;payload[f]=el.value.trim()}
 try{
  if(id){await updateDoc(doc(db,m.collection,id),payload);log('Record updated',`${m.label} • ${id}`);toast('Record updated')}
  else{payload.createdAt=serverTimestamp();await addDoc(collection(db,m.collection),payload);log('Record created',m.label);toast('Record created')}
  closeModal();await loadModule(currentTab);renderModule();updateCounts();renderDashboard();
 }catch(e){toast(e.message,true)}
}
function editRecord(id){const x=(data[currentTab]||[]).find(r=>r.id===id);if(!x)return;showModal(`Edit ${MODULES[currentTab].label}`,formFor(x),`<button class="btn btn-light" id="cancel">Cancel</button><button class="btn btn-primary" id="save">Save Changes</button>`);$('cancel').onclick=closeModal;$('save').onclick=()=>saveRecord(id)}
async function deleteRecord(id){if(!confirm('Delete this record permanently from Firestore?'))return;try{await deleteDoc(doc(db,MODULES[currentTab].collection,id));log('Record deleted',`${MODULES[currentTab].label} • ${id}`);toast('Record deleted');await loadModule(currentTab);renderModule();updateCounts();renderDashboard()}catch(e){toast(e.message,true)}}
$('addBtn').onclick=addRecord;
$('exportBtn').onclick=()=>{
 const rows=data[currentTab]||[];if(!rows.length)return toast('Nothing to export',true);
 const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))].filter(k=>k!=='id');
 const csv=[keys.join(','),...rows.map(x=>keys.map(k=>{let v=fmt(x[k]);return `"${String(v).replace(/"/g,'""')}"`}).join(','))].join('\\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`apex-${currentTab}-${new Date().toISOString().slice(0,10)}.csv`;a.click();log('CSV exported',MODULES[currentTab].label);toast('CSV exported')
};

document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const map={student:'students',fee:'fees',announcement:'announcements',coupon:'coupons',certificate:'certificates'};if(b.dataset.action==='class')return openLive();switchTab(map[b.dataset.action]);setTimeout(addRecord,50)});
$('quickStudent').onclick=()=>{switchTab('students');setTimeout(addRecord,50)};$('quickAnnouncement').onclick=()=>{switchTab('announcements');setTimeout(addRecord,50)};

async function openLive(){
 $('classList').innerHTML='<div class="loader">Loading live class schedule…</div>';$('liveBg').classList.add('open');
 const classes=data.liveClasses?.length?data.liveClasses:DEFAULT_SCHEDULE;
 $('classList').innerHTML=classes.map((c,i)=>`<div style="padding:14px;border:1px solid var(--line);border-radius:13px;margin-bottom:9px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>${esc(c.title||'Live Class')}</b><div style="font-size:10px;color:#7d8998;margin-top:3px">${esc(c.subjectLabel||c.subject||'')} • ${esc(c.day||'')} ${esc(c.time||'')}<br>Room: ${esc(c.roomName||'')}</div></div><button class="btn btn-success" data-start="${i}">Start Host</button></div>`).join('');
 $('classList').querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>startLive(classes[Number(b.dataset.start)]));
}
$('liveBtn').onclick=openLive;$('liveClose').onclick=()=>$('liveBg').classList.remove('open');$('liveBg').onclick=e=>{if(e.target===$('liveBg'))$('liveBg').classList.remove('open')};
async function startLive(cls){
 currentClass=cls;$('liveBg').classList.remove('open');$('liveOverlay').classList.add('open');$('liveTitle').textContent=cls.title||'Apex Live Class';$('jitsiContainer').innerHTML='';
 try{await addDoc(collection(db,'attendance'),{studentName:ADMIN_NAME+' (Host)',role:'host',classId:cls.id,className:cls.title,joinedAt:serverTimestamp(),status:'host_joined'})}catch(e){}
 try{
  jitsi=new JitsiMeetExternalAPI('meet.jit.si',{roomName:cls.roomName||('Apex-'+Date.now()),width:'100%',height:'100%',parentNode:$('jitsiContainer'),userInfo:{displayName:ADMIN_NAME+' (Host)'},configOverwrite:{prejoinPageEnabled:false,disableDeepLinking:true},interfaceConfigOverwrite:{SHOW_JITSI_WATERMARK:false,SHOW_BRAND_WATERMARK:false,DEFAULT_BACKGROUND:'#071A33'}});
  jitsi.addEventListener('videoConferenceLeft',endLive);
 }catch(e){toast(e.message,true);endLive()}
}
async function endLive(){
 if(currentClass)try{await addDoc(collection(db,'attendance'),{studentName:ADMIN_NAME+' (Host)',role:'host',classId:currentClass.id,className:currentClass.title,endedAt:serverTimestamp(),status:'host_left'})}catch(e){}
 if(jitsi)try{jitsi.dispose()}catch(e){}jitsi=null;currentClass=null;$('liveOverlay').classList.remove('open');$('jitsiContainer').innerHTML='';log('Live class ended');toast('Live class ended')
}
$('endLive').onclick=endLive;

$('themeBtn').onclick=()=>{document.body.classList.toggle('dark');document.documentElement.style.setProperty('--bg',document.body.classList.contains('dark')?'#08111F':'#F4F7FB');toast('Display mode toggled')};
renderActivity();
