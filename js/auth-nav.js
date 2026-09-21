import { auth } from "../config/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const isRoot = location.pathname.endsWith("/Apex-Learning-Academy/") || location.pathname.endsWith("/index.html");
const BASE = isRoot ? "" : "../";
const page = (name) => `${BASE}${name === "index.html" ? "index.html" : `pages/${name}`}`;

onAuthStateChanged(auth, (user) => {
  const authActions = document.getElementById("authActions");
  if (!authActions) return;
  if (user) {
    authActions.innerHTML = `<a href="${page("dashboard.html")}" class="btn btn-ghost">Dashboard</a><button id="navLogoutBtn" class="btn btn-gold" type="button">Logout</button>`;
    document.getElementById("navLogoutBtn")?.addEventListener("click", async () => { try { await signOut(auth); location.href = page("index.html"); } catch (_) {} });
  }
});

(function () {
  if (location.pathname.includes("admin.html")) return;
  const init = () => {
    if (!document.querySelector(".whatsapp-float")) {
      const a=document.createElement("a"); a.className="whatsapp-float"; a.href="https://wa.me/923410349929?text="+encodeURIComponent("Assalam-o-Alaikum, I want to know more about Apex Learning Academy courses."); a.target="_blank"; a.rel="noopener noreferrer"; a.ariaLabel="Chat on WhatsApp"; a.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2zm5.5 14.2c-.2.7-1.3 1.3-1.8 1.4-.5.1-1.1-.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.6-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.2.1.3 0 .5-.1.2-.2.3-.3.5-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3 0 .2 0 .7-.2 1.4z"/></svg>'; document.body.appendChild(a);
    }
    if (!document.querySelector(".back-to-top")) { const b=document.createElement("button"); b.className="back-to-top"; b.type="button"; b.ariaLabel="Back to top"; b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15"/></svg>'; b.onclick=()=>scrollTo({top:0,behavior:"smooth"}); document.body.appendChild(b); addEventListener("scroll",()=>b.classList.toggle("show",scrollY>400),{passive:true}); }
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded",init,{once:true}) : init();
})();
