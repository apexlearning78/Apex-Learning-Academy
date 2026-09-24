import { auth, db } from "../../config/firebase-config.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_UID = "VHbqYaHK6yXP2f8IF9WKc33kkD73";
const ADMIN_NAME = "Mukesh Kewal";
const EMAILJS_PUBLIC_KEY = "0CuJdjkOPS6ovXLmt";
const EMAILJS_SERVICE = "service_bnv0t4";
const EMAILJS_TEMPLATE = "template_r3prv9y";

const courses = ["Web Development","Artificial Intelligence"];
const modules = {
  students:{label:"Students",group:"ACADEMY",collection:"students",desc:"Manage student profiles, course assignments and account status.",fields:[
    ["fullName","Full name","text"],["email","Email","email"],["phone","Phone","text"],["course","Course","select",courses],["status","Status","select",["active","inactive","suspended"]],["batch","Batch","text"],["address","Address","text"]
  ]},
  courses:{label:"Courses",group:"ACADEMY",collection:"courses",desc:"Create and maintain academy courses.",fields:[
    ["title","Course title","text"],["slug","Slug","text"],["description","Description","textarea"],["instructor","Instructor","text"],["level","Level","select",["Beginner","Intermediate","Advanced"]],["duration","Duration","text"],["price","Price","number"],["status","Status","select",["draft","published","archived"]]
  ]},
  enrollments:{label:"Enrollments",group:"ACADEMY",collection:"enrollments",desc:"Track which students have access to which courses.",fields:[
    ["studentUid","Student UID","text"],["studentName","Student name","text"],["studentEmail","Student email","email"],["course","Course","select",courses],["enrollmentDate","Enrollment date","date"],["expiryDate","Expiry date","date"],["status","Status","select",["active","completed","expired","cancelled"]]
  ]},
  assignments:{label:"Assignments",group:"LEARNING",collection:"assignments",desc:"Manage assignments and deadlines.",fields:[
    ["title","Title","text"],["course","Course","select",courses],["module","Module","text"],["description","Description","textarea"],["dueDate","Due date","datetime-local"],["totalMarks","Total marks","number"],["passingMarks","Passing marks","number"],["status","Status","select",["draft","published","closed"]]
  ]},
  quizzes:{label:"Quizzes",group:"LEARNING",collection:"quizzes",desc:"Manage quizzes and assessment settings.",fields:[
    ["title","Quiz title","text"],["course","Course","select",courses],["module","Module","text"],["timeLimit","Time limit (minutes)","number"],["passingPercentage","Passing percentage","number"],["attemptsAllowed","Attempts allowed","number"],["status","Status","select",["draft","published","closed"]]
  ]},
  exams:{label:"Exams & Results",group:"LEARNING",collection:"results",desc:"Publish and manage student results.",fields:[
    ["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["exam","Exam name","text"],["marks","Marks","number"],["totalMarks","Total marks","number"],["percentage","Percentage","number"],["grade","Grade","text"],["status","Status","select",["pass","fail","pending"]]
  ]},
  progress:{label:"Course Progress",group:"LEARNING",collection:"courseProgress",desc:"Monitor lesson and course completion.",fields:[
    ["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["completedLessons","Completed lessons","number"],["totalLessons","Total lessons","number"],["percentage","Progress %","number"],["lastLesson","Last lesson","text"]
  ]},
  attendance:{label:"Attendance",group:"LEARNING",collection:"attendance",desc:"Review attendance records and live-class participation.",fields:[
    ["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["className","Class name","text"],["status","Status","select",["present","absent","late","host_joined","host_left"]],["date","Date","date"]
  ]},
  certificates:{label:"Certificates",group:"LEARNING",collection:"certificates",desc:"Issue, update and verify course certificates.",fields:[
    ["certificateId","Certificate ID","text"],["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["issueDate","Issue date","date"],["status","Status","select",["valid","revoked"]],["verificationUrl","Verification URL","url"]
  ]},
  fees:{label:"Payments & Fees",group:"FINANCE",collection:"fees",desc:"Manage fees, installments and outstanding balances.",fields:[
    ["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["amount","Amount","number"],["paidAmount","Paid amount","number"],["remaining","Remaining","number"],["dueDate","Due date","date"],["status","Status","select",["paid","pending","overdue","refunded"]]
  ]},
  invoices:{label:"Invoices",group:"FINANCE",collection:"invoices",desc:"Store and manage student invoices.",fields:[
    ["invoiceNumber","Invoice number","text"],["studentUid","Student UID","text"],["studentName","Student name","text"],["course","Course","select",courses],["amount","Amount","number"],["discount","Discount","number"],["total","Total","number"],["status","Status","select",["paid","pending","cancelled"]],["date","Date","date"]
  ]},
  instructors:{label:"Instructors",group:"PEOPLE",collection:"instructorApplications",desc:"Review instructor applications and instructor records.",fields:[
    ["fullName","Name","text"],["email","Email","email"],["phone","Phone","text"],["subject","Subject","text"],["experience","Experience","text"],["status","Status","select",["pending","approved","rejected"]]
  ]},
  liveClasses:{label:"Live Classes",group:"OPERATIONS",collection:"liveClasses",desc:"Schedule live classes and meeting rooms.",fields:[
    ["title","Class title","text"],["course","Course","select",courses],["instructor","Instructor","text"],["date","Date","date"],["startTime","Start time","time"],["endTime","End time","time"],["meetingLink","Meeting link","url"],["roomName","Room name","text"],["status","Status","select",["scheduled","live","completed","cancelled"]]
  ]},
  announcements:{label:"Announcements",group:"COMMUNICATION",collection:"announcements",desc:"Publish notices to academy users.",fields:[
    ["title","Title","text"],["message","Message","textarea"],["audience","Audience","select",["all","Web Development","Artificial Intelligence","staff"]],["type","Type","select",["info","success","warning"]],["active","Active","select",["true","false"]]
  ]},
  messages:{label:"Messages & Support",group:"COMMUNICATION",collection:"messages",desc:"Read contact and support messages and reply by email.",fields:[
    ["name","Name","text"],["email","Email","email"],["phone","Phone","text"],["subject","Subject","text"],["message","Message","textarea"],["status","Status","select",["new","read","replied","closed"]]
  ]},
  reviews:{label:"Reviews",group:"COMMUNICATION",collection:"reviews",desc:"Moderate student course reviews.",fields:[
    ["studentName","Student name","text"],["course","Course","select",courses],["rating","Rating","number"],["review","Review","textarea"],["status","Status","select",["pending","approved","hidden"]]
  ]},
  coupons:{label:"Coupons",group:"MARKETING",collection:"coupons",desc:"Create and manage promotional discount codes.",fields:[
    ["code","Code","text"],["type","Type","select",["percentage","fixed"]],["value","Value","number"],["course","Course","select",["all",...courses]],["usageLimit","Usage limit","number"],["expiryDate","Expiry date","date"],["status","Status","select",["active","expired","disabled"]]
  ]},
  leads:{label:"Leads & Admissions",group:"MARKETING",collection:"leads",desc:"Manage prospective students and admission follow-up.",fields:[
    ["name","Name","text"],["email","Email","email"],["phone","Phone","text"],["course","Interested course","select",courses],["source","Source","text"],["status","Status","select",["new","contacted","interested","converted","not_interested"]],["notes","Notes","textarea"]
  ]},
  visitors:{label:"Visitors",group:"ANALYTICS",collection:"visitors",desc:"Website visitor records.",fields:[
    ["visitorId","Visitor ID","text"],["device","Device","text"],["browser","Browser","text"],["country","Country","text"],["firstSeen","First seen","text"],["lastSeen","Last seen","text"]
  ]},
  visits:{label:"Page Visits",group:"ANALYTICS",collection:"visits",desc:"Website page visit activity.",fields:[
    ["page","Page","text"],["visitorId","Visitor ID","text"],["path","Path","text"],["referrer","Referrer","text"],["timestamp","Timestamp","text"]
  ]},
  emailLogs:{label:"Email Logs",group:"COMMUNICATION",collection:"emailLogs",desc:"Delivery attempts and email history.",fields:[
    ["recipientEmail","Recipient email","email"],["recipientName","Recipient name","text"],["subject","Subject","text"],["status","Status","select",["sent","failed"]],["sentVia","Provider","text"],["error","Error","textarea"]
  ]},
  activity:{label:"Activity Logs",group:"SYSTEM",collection:"adminActivity",desc:"Administrative audit trail.",fields:[
    ["action","Action","text"],["details","Details","textarea"],["adminEmail","Admin email","email"]
  ]},
  settings:{label:"Academy Settings",group:"SYSTEM",collection:"academySettings",desc:"Store academy-wide settings. One record can be used as the primary settings document.",fields:[
    ["academyName","Academy name","text"],["supportEmail","Support email","email"],["phone","Phone","text"],["website","Website","url"],["currency","Currency","text"],["timezone","Timezone","text"],["whatsapp","WhatsApp","text"],["address","Address","text"]
  ]}
};

const navGroups = [
  ["OVERVIEW",["dashboard"]],
  ["ACADEMY",["students","courses","enrollments"]],
  ["LEARNING",["assignments","quizzes","exams","progress","attendance","certificates"]],
  ["FINANCE",["fees","invoices"]],
  ["PEOPLE & OPERATIONS",["instructors","liveClasses"]],
  ["COMMUNICATION",["messages","emailCenter","emailLogs","announcements","reviews"]],
  ["MARKETING",["coupons","leads"]],
  ["ANALYTICS",["visitors","visits","reports"]],
  ["SYSTEM",["activity","settings"]]
];

const icon = {
 dashboard:"D",students:"S",courses:"C",enrollments:"E",assignments:"A",quizzes:"Q",exams:"R",
 progress:"P",attendance:"T",certificates:"V",fees:"F",invoices:"I",instructors:"N",liveClasses:"L",
 messages:"M",emailCenter:"@",emailLogs:"H",announcements:"B",reviews:"W",coupons:"K",leads:"G",
 visitors:"Y",visits:"J",reports:"X",activity:"Z",settings:"O"
};

const state={tab:"dashboard",data:{},editingId:null,search:"",course:"all",confirm:null};

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const val=(o,k)=>o?.[k]??"";
function dateValue(v){if(!v)return "";if(v?.toDate)return v.toDate().toISOString().slice(0,10);if(v?.seconds)return new Date(v.seconds*1000).toISOString().slice(0,10);return String(v).slice(0,10)}
function display(v){if(v==null||v==="")return "—";if(v?.toDate)return v.toDate().toLocaleString();if(v?.seconds)return new Date(v.seconds*1000).toLocaleString();return String(v)}
function toast(msg,error=false){const e=$("toast");e.textContent=msg;e.className="toast show"+(error?" error":"");clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.className="toast",2800)}
function openModal(id){$(id).hidden=false}
function closeModal(id){$(id).hidden=true}
function setSync(s){$("syncStatus").textContent=s}

function buildNav(){
  $("nav").innerHTML=navGroups.map(([group,items])=>`<div class="nav-group">${group}</div>`+items.map(k=>{
    const label=k==="emailCenter"?"Email Center":k==="reports"?"Reports":modules[k]?.label||"Dashboard";
    const count=k==="dashboard"||k==="reports"||k==="emailCenter"||k==="settings"?"":`<span class="count">${(state.data[k]||[]).length}</span>`;
    return `<button class="nav-btn ${state.tab===k?"active":""}" data-tab="${k}" type="button"><span class="nav-icon">${icon[k]||"•"}</span><span>${label}</span>${count}</button>`
  }).join("")).join("");
  document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
}

async function load(key){
  if(key==="dashboard"||key==="reports"||key==="emailCenter")return;
  try{
    const snap=await getDocs(collection(db,modules[key].collection));
    state.data[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){state.data[key]=[];console.warn("Load",key,e)}
}

async function loadAll(){
  setSync("Syncing Firebase");
  const keys=Object.keys(modules);
  await Promise.all(keys.map(load));
  buildNav();renderDashboard();if(state.tab!=="dashboard")renderModule();
  setSync("Synced "+new Date().toLocaleTimeString());
}

function metric(key){return (state.data[key]||[]).length}
function renderDashboard(){
  const students=state.data.students||[], fees=state.data.fees||[], cert=state.data.certificates||[], leads=state.data.leads||[];
  const paid=fees.reduce((s,x)=>s+Number(x.paidAmount??x.amount??0),0);
  const pending=fees.filter(x=>String(x.status).toLowerCase()!=="paid").length;
  const web=students.filter(x=>String(x.course||"").toLowerCase().includes("web")).length;
  const ai=students.filter(x=>String(x.course||"").toLowerCase().includes("artificial")||String(x.course||"").toLowerCase()==="ai").length;
  $("dashboardView").innerHTML=`
    <div class="dashboard-hero"><div><h2>Academy command center</h2><p>Manage students, courses, learning, finance, communication and operations from one Firebase-connected panel.</p></div><div class="dashboard-time">${new Date().toLocaleString()}</div></div>
    <div class="stats">
      ${stat("Students",students.length,"Registered students")}
      ${stat("Courses",metric("courses"),"Published and draft")}
      ${stat("Enrollments",metric("enrollments"),"Course access records")}
      ${stat("Revenue",formatMoney(paid),"Recorded paid amount")}
      ${stat("Pending fees",pending,"Unsettled fee records")}
      ${stat("Certificates",cert.length,"Issued or revoked")}
      ${stat("Leads",leads.length,"Admissions pipeline")}
      ${stat("Messages",metric("messages"),"Support/contact records")}
    </div>
    <div class="dashboard-grid">
      <div class="panel"><h3>Course distribution</h3><div class="chart">${bar("Web Development",web,students.length)}${bar("Artificial Intelligence",ai,students.length)}${bar("Other / unassigned",Math.max(0,students.length-web-ai),students.length)}</div></div>
      <div class="panel"><h3>Quick actions</h3><div class="quick-grid">
        ${quick("Add student","students")}${quick("Add course","courses")}${quick("New enrollment","enrollments")}${quick("Create assignment","assignments")}${quick("Issue certificate","certificates")}${quick("Send email","emailCenter")}
      </div></div>
      <div class="panel"><h3>Recent students</h3>${recentStudents(students)}</div>
      <div class="panel"><h3>System status</h3><p class="report-note">Firebase authentication and Firestore are connected through the existing academy configuration. Firestore permissions are enforced server-side; this panel never bypasses Firebase security rules.</p><p class="report-note">Use Refresh after changes made from another browser or the student portal.</p></div>
    </div>`;
  document.querySelectorAll("[data-quick]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.quick)));
}
function stat(a,b,c){return `<div class="stat"><small>${a}</small><strong>${esc(b)}</strong><span>${c}</span></div>`}
function formatMoney(n){return `Rs. ${Number(n||0).toLocaleString("en-PK")}`}
function bar(label,n,total){const p=total?Math.round(n/total*100):0;return `<div class="bar"><span>${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div><b>${n}</b></div>`}
function quick(label,key){return `<button class="quick" data-quick="${key}" type="button"><strong>${esc(label)}</strong><span>Open management</span></button>`}
function recentStudents(a){const rows=a.slice().reverse().slice(0,6);if(!rows.length)return `<div class="empty">No students found.</div>`;return rows.map(x=>`<div class="quick" style="margin-bottom:7px"><strong>${esc(x.fullName||x.name||"Student")}</strong><span>${esc(x.email||"No email")} · ${esc(x.course||"No course")}</span></div>`).join("")}

function switchTab(tab){
  state.tab=tab;state.search="";state.course="all";$("searchInput").value="";$("courseFilter").value="all";buildNav();
  if(tab==="dashboard"){ $("dashboardView").hidden=false;$("moduleView").hidden=true;$("pageTitle").textContent="Dashboard";return}
  if(tab==="emailCenter"){openEmailModal();return}
  if(tab==="reports"){renderReports();return}
  $("dashboardView").hidden=true;$("moduleView").hidden=false;renderModule();
  if(window.innerWidth<801)$("sidebar").classList.remove("open");
}
function renderModule(){
  const m=modules[state.tab];if(!m)return;
  $("pageTitle").textContent=m.label;$("moduleTitle").textContent=m.label;$("moduleDescription").textContent=m.desc;
  $("addBtn").textContent=state.tab==="activity"?"Add log":"Add record";
  const data=filteredData();renderStats(m,data);renderTable(m,data);
}
function filteredData(){
  let data=state.data[state.tab]||[];
  const q=state.search.trim().toLowerCase();
  if(q)data=data.filter(x=>Object.values(x).some(v=>String(v??"").toLowerCase().includes(q)));
  if(state.course!=="all")data=data.filter(x=>String(x.course||"").toLowerCase()===state.course.toLowerCase());
  return data;
}
function renderStats(m,data){
  const total=data.length, active=data.filter(x=>["active","published","approved","paid","valid","present","new","scheduled"].includes(String(x.status).toLowerCase())).length;
  $("moduleStats").innerHTML=[stat("Visible records",total,"After filters"),stat("Active / current",active,"Status-based count"),stat("Web Development",data.filter(x=>String(x.course||"").toLowerCase().includes("web")).length,"Course records"),stat("Artificial Intelligence",data.filter(x=>String(x.course||"").toLowerCase().includes("artificial")||String(x.course||"").toLowerCase()==="ai").length,"Course records")].join("");
}
function renderTable(m,data){
  const fields=m.fields.map(x=>x[0]);
  const visible=fields.slice(0,5);
  $("tableHead").innerHTML=`<tr>${visible.map(k=>`<th>${esc(labelFor(m,k))}</th>`).join("")}<th>Actions</th></tr>`;
  if(!data.length){$("tableBody").innerHTML=`<tr><td colspan="${visible.length+1}" class="empty">No records found.</td></tr>`;return}
  $("tableBody").innerHTML=data.map(row=>`<tr>${visible.map(k=>`<td>${cell(row[k],k)}</td>`).join("")}<td><div class="row-actions"><button data-view="${esc(row.id)}" type="button">View</button><button data-edit="${esc(row.id)}" type="button">Edit</button><button data-delete="${esc(row.id)}" type="button">Delete</button>${state.tab==="students"&&getEmail(row)?`<button data-email="${esc(row.id)}" type="button">Email</button>`:""}</div></td></tr>`).join("");
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>viewRecord(b.dataset.view));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editRecord(b.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>confirmDelete(b.dataset.delete));
  document.querySelectorAll("[data-email]").forEach(b=>b.onclick=()=>openEmailModal(b.dataset.email));
}
function labelFor(m,k){return m.fields.find(x=>x[0]===k)?.[1]||k}
function cell(v,k){
  if(v===true||v==="true")return `<span class="badge success">Active</span>`;
  if(v===false||v==="false")return `<span class="badge">Inactive</span>`;
  const s=display(v),low=s.toLowerCase();
  if(["status","type"].includes(k))return `<span class="badge ${low.includes("fail")||low.includes("reject")||low.includes("cancel")||low.includes("overdue")?"danger":low.includes("pending")||low.includes("draft")?"warn":low==="paid"||low==="active"||low==="approved"||low==="valid"||low==="present"?"success":""}">${esc(s)}</span>`;
  return esc(s.length>80?s.slice(0,80)+"…":s);
}
function getEmail(x){return x.email||x.studentEmail||x.recipientEmail||""}

function buildFields(m,record={}){
  return m.fields.map(([key,label,type,opts])=>{
    let value=record[key]??"";
    if(type==="date"||type==="datetime-local")value=dateValue(value);
    if(type==="select")return `<label>${esc(label)}<select name="${esc(key)}">${opts.map(o=>`<option value="${esc(o)}" ${String(value)===String(o)?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
    if(type==="textarea")return `<label class="full">${esc(label)}<textarea name="${esc(key)}">${esc(value)}</textarea></label>`;
    return `<label>${esc(label)}<input name="${esc(key)}" type="${type}" value="${esc(value)}"></label>`;
  }).join("");
}
function openRecordForm(id=null){
  const m=modules[state.tab];state.editingId=id;
  const record=id?(state.data[state.tab]||[]).find(x=>x.id===id)||{}:{};
  $("modalEyebrow").textContent=m.label.toUpperCase();
  $("modalTitle").textContent=id?"Edit record":"Add record";
  $("recordFields").innerHTML=buildFields(m,record);openModal("recordModal");
}
function editRecord(id){openRecordForm(id)}
function viewRecord(id){
  const m=modules[state.tab],r=(state.data[state.tab]||[]).find(x=>x.id===id);if(!r)return;
  $("detailTitle").textContent=r.fullName||r.name||r.title||r.studentName||m.label;
  $("detailBody").innerHTML=`<div class="detail-grid">${m.fields.map(([k,l])=>`<div class="detail-item"><small>${esc(l)}</small><div>${esc(display(r[k]))}</div></div>`).join("")}<div class="detail-item"><small>Firestore document ID</small><div>${esc(r.id)}</div></div></div>`;
  openModal("detailModal");
}
function openAdd(){openRecordForm()}
async function saveRecord(e){
  e.preventDefault();const m=modules[state.tab],form=new FormData(e.target),payload={};
  m.fields.forEach(([k,l,t])=>{let v=form.get(k);if(t==="number"&&v!=="")v=Number(v);if(k==="active"&&v==="true")v=true;if(k==="active"&&v==="false")v=false;payload[k]=v});
  payload.updatedAt=serverTimestamp();payload.updatedBy=auth.currentUser?.uid||ADMIN_UID;
  try{
    if(state.editingId)await updateDoc(doc(db,m.collection,state.editingId),payload);
    else {payload.createdAt=serverTimestamp();await addDoc(collection(db,m.collection),payload)}
    await audit(`${state.editingId?"Updated":"Created"} ${m.label}`,JSON.stringify(payload).slice(0,500));
    closeModal("recordModal");toast("Record saved successfully.");await load(state.tab);buildNav();renderModule();
  }catch(e){toast(e.message||"Could not save record.",true)}
}
function confirmDelete(id){
  state.confirm=async()=>{try{await deleteDoc(doc(db,modules[state.tab].collection,id));await audit(`Deleted ${modules[state.tab].label}`,id);toast("Record deleted.");closeModal("confirmModal");await load(state.tab);buildNav();renderModule()}catch(e){toast(e.message||"Delete failed.",true)}};
  $("confirmTitle").textContent="Delete record";$("confirmText").textContent="This action permanently deletes the selected Firestore document. Continue only if you are sure.";openModal("confirmModal");
}
async function audit(action,details=""){
  try{await addDoc(collection(db,"adminActivity"),{action,details,adminUid:auth.currentUser?.uid||ADMIN_UID,adminEmail:auth.currentUser?.email||"",createdAt:serverTimestamp()})}catch(e){console.warn("Audit log unavailable",e)}
}
function exportCSV(){
  const m=modules[state.tab],data=filteredData();if(!data.length){toast("There is no data to export.",true);return}
  const keys=m.fields.map(x=>x[0]);const rows=[keys,...data.map(r=>keys.map(k=>String(r[k]??"").replaceAll('"','""')))];
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`apex-${state.tab}-${Date.now()}.csv`;a.click();URL.revokeObjectURL(a.href)
}

const templates={
 welcome:["Welcome to Apex Learning Academy","Assalam-o-Alaikum {NAME},\n\nWelcome to Apex Learning Academy. Your registration has been received successfully.\n\nOur team will contact you with the next steps.\n\nBest regards,\nApex Learning Academy"],
 fee:["Fee Reminder - Apex Learning Academy","Assalam-o-Alaikum {NAME},\n\nThis is a reminder regarding your course fee for {COURSE}.\n\nPlease contact the academy team if you need payment assistance.\n\nBest regards,\nApex Learning Academy"],
 certificate:["Your Certificate is Ready","Assalam-o-Alaikum {NAME},\n\nCongratulations on completing {COURSE}. Your certificate is now available.\n\nBest regards,\nApex Learning Academy"],
 class:["Class Reminder - Apex Learning Academy","Assalam-o-Alaikum {NAME},\n\nThis is a reminder about your upcoming {COURSE} class. Please join on time.\n\nBest regards,\nApex Learning Academy"]
};
function openEmailModal(studentId=null){
  const students=(state.data.students||[]).filter(getEmail);$("emailRecipients").innerHTML=students.map(s=>`<option value="${esc(s.id)}" ${studentId===s.id?"selected":""}>${esc(s.fullName||s.name||"Student")} - ${esc(getEmail(s))}</option>`).join("");
  $("emailStatus").textContent="";openModal("emailModal");
}
function applyTemplate(k){
  const [s,b]=templates[k];$("emailSubject").value=s;
  const selected=[...$("emailRecipients").selectedOptions];const name=selected[0]?.textContent.split(" - ")[0]||"Student";
  $("emailBody").value=b.replaceAll("{NAME}",name).replaceAll("{COURSE}","your course");
}
async function sendEmails(e){
  e.preventDefault();const ids=[...$("emailRecipients").selectedOptions].map(o=>o.value),subject=$("emailSubject").value.trim(),body=$("emailBody").value.trim();
  if(!ids.length||!subject||!body){$("emailStatus").textContent="Select at least one recipient and complete subject and message.";return}
  if(!window.emailjs){$("emailStatus").textContent="Email service is not loaded. Refresh and try again.";return}
  emailjs.init({publicKey:EMAILJS_PUBLIC_KEY});let sent=0,failed=0;$("emailStatus").textContent="Sending...";
  for(const id of ids){
    const s=(state.data.students||[]).find(x=>x.id===id);if(!s)continue;
    const personalized=body.replaceAll("{NAME}",s.fullName||s.name||"Student").replaceAll("{COURSE}",s.course||"your course");
    try{
      await emailjs.send(EMAILJS_SERVICE,EMAILJS_TEMPLATE,{to_email:getEmail(s),to_name:s.fullName||s.name||"Student",subject,reply_message:personalized,student_name:s.fullName||s.name||"Student",student_email:getEmail(s)});
      await addDoc(collection(db,"emailLogs"),{recipientEmail:getEmail(s),recipientName:s.fullName||s.name||"Student",studentUid:s.uid||s.id,subject,body:personalized,status:"sent",sentVia:"EmailJS",sentBy:auth.currentUser?.uid||ADMIN_UID,createdAt:serverTimestamp(),sentAt:serverTimestamp()});sent++;
    }catch(err){
      failed++;try{await addDoc(collection(db,"emailLogs"),{recipientEmail:getEmail(s),recipientName:s.fullName||s.name||"Student",studentUid:s.uid||s.id,subject,body:personalized,status:"failed",sentVia:"EmailJS",error:err?.text||err?.message||"Unknown error",sentBy:auth.currentUser?.uid||ADMIN_UID,createdAt:serverTimestamp()})}catch{}
    }
  }
  $("emailStatus").textContent=`Completed: ${sent} sent, ${failed} failed.`;if(sent)toast(`${sent} email(s) sent.`);await load("emailLogs");buildNav();
}
function renderReports(){
  $("dashboardView").hidden=false;$("moduleView").hidden=true;$("pageTitle").textContent="Reports";
  const students=state.data.students||[],fees=state.data.fees||[],en=state.data.enrollments||[],results=state.data.exams||[];
  const revenue=fees.reduce((s,x)=>s+Number(x.paidAmount??0),0),outstanding=fees.reduce((s,x)=>s+Number(x.remaining??Math.max(0,Number(x.amount||0)-Number(x.paidAmount||0))),0);
  $("dashboardView").innerHTML=`<div class="dashboard-hero"><div><h2>Academy reports</h2><p>Current Firestore records grouped into operational metrics.</p></div><div class="dashboard-time">${new Date().toLocaleString()}</div></div>
  <div class="stats">${stat("Students",students.length,"Total profiles")}${stat("Enrollments",en.length,"Access records")}${stat("Recorded revenue",formatMoney(revenue),"Paid amount")}${stat("Outstanding",formatMoney(outstanding),"Estimated from fee records")}</div>
  <div class="dashboard-grid"><div class="panel"><h3>Course enrollment report</h3>${bar("Web Development",en.filter(x=>String(x.course).toLowerCase().includes("web")).length,en.length)}${bar("Artificial Intelligence",en.filter(x=>String(x.course).toLowerCase().includes("artificial")).length,en.length)}</div><div class="panel"><h3>Assessment report</h3><p class="report-note">Result records: ${results.length}. Passed: ${results.filter(x=>String(x.status).toLowerCase()==="pass").length}. Failed: ${results.filter(x=>String(x.status).toLowerCase()==="fail").length}.</p></div></div>`;
}

function getStudentById(id){return (state.data.students||[]).find(x=>x.id===id)}
function setup(){
  $("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginError").textContent="";$("loginBtn").disabled=true;try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value); }catch(err){$("loginError").textContent=err.code==="auth/invalid-credential"?"Invalid email or password.":err.message||"Login failed."}finally{$("loginBtn").disabled=false}});
  $("logoutBtn").onclick=async()=>{await audit("Admin logout");await signOut(auth)};
  $("refreshBtn").onclick=loadAll;$("addBtn").onclick=openAdd;$("exportBtn").onclick=exportCSV;
  $("searchInput").oninput=e=>{state.search=e.target.value;renderModule()};$("courseFilter").onchange=e=>{state.course=e.target.value;renderModule()};
  $("recordForm").onsubmit=saveRecord;$("emailForm").onsubmit=sendEmails;
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  document.querySelectorAll("[data-template]").forEach(b=>b.onclick=()=>applyTemplate(b.dataset.template));
  $("confirmCancel").onclick=()=>closeModal("confirmModal");$("confirmOk").onclick=()=>state.confirm?.();
  $("openSidebar").onclick=()=>$("sidebar").classList.add("open");$("closeSidebar").onclick=()=>$("sidebar").classList.remove("open");
  window.addEventListener("keydown",e=>{if(e.key==="Escape")["recordModal","detailModal","emailModal","confirmModal"].forEach(closeModal)});
  buildNav();
}
async function start(user){
  if(user.uid!==ADMIN_UID){
    await signOut(auth);$("loginError").textContent="This account is not authorized for the academy admin panel.";return;
  }
  $("loginScreen").hidden=true;$("app").hidden=false;$("adminName").textContent=ADMIN_NAME;$("adminEmail").textContent=user.email||"Administrator";$("adminAvatar").textContent=(ADMIN_NAME[0]||"A").toUpperCase();
  await loadAll();
}
setup();
onAuthStateChanged(auth,user=>{if(user)start(user);else{$("loginScreen").hidden=false;$("app").hidden=true}});
