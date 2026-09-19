// ==========================================
// APEX LEARNING ACADEMY — Visitor Tracker
// Har page pe load hoga — Firestore mein save karega
// ==========================================

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============ UNIQUE VISITOR ID ============
// Browser mein store karega — dobara visit pe same ID
function getVisitorId() {
    let visitorId = localStorage.getItem('apex_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(-8);
        localStorage.setItem('apex_visitor_id', visitorId);
    }
    return visitorId;
}

// ============ SESSION ID ============
// Har session (30 min) ke liye naya ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('apex_session_id');
    let sessionStart = sessionStorage.getItem('apex_session_start');

    const now = Date.now();
    const thirtyMin = 30 * 60 * 1000;

    if (!sessionId || !sessionStart || (now - parseInt(sessionStart)) > thirtyMin) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(-8);
        sessionStorage.setItem('apex_session_id', sessionId);
        sessionStorage.setItem('apex_session_start', now.toString());
    }
    return sessionId;
}

// ============ DEVICE DETECT ============
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Device
    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

    // Browser
    if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/edge/i.test(ua)) browser = 'Edge';
    else if (/opr/i.test(ua)) browser = 'Opera';

    // OS
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
}

// ============ GET LOCATION (IP-based, free) ============
async function getLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        return {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || 'XX',
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            ip: data.ip || 'Unknown'
        };
    } catch (err) {
        return { country: 'Unknown', countryCode: 'XX', city: 'Unknown', region: 'Unknown', ip: 'Unknown' };
    }
}

// ============ TRACK VISIT ============
async function trackVisit() {
    try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const deviceInfo = getDeviceInfo();
        const location = await getLocation();

        // Page info
        const page = window.location.pathname || '/';
        const pageTitle = document.title || 'Unknown';
        const referrer = document.referrer || 'Direct';

        // Check if this visitor is new
        const visitorRef = doc(db, 'visitors', visitorId);
        const visitorSnap = await getDoc(visitorRef);
        const isNewVisitor = !visitorSnap.exists();

        // Save/update visitor profile
        if (isNewVisitor) {
            await setDoc(visitorRef, {
                visitorId,
                firstVisit: serverTimestamp(),
                lastVisit: serverTimestamp(),
                totalVisits: 1,
                country: location.country,
                countryCode: location.countryCode,
                city: location.city,
                region: location.region,
                device: deviceInfo.device,
                browser: deviceInfo.browser,
                os: deviceInfo.os
            });
        } else {
            const existing = visitorSnap.data();
            await setDoc(visitorRef, {
                ...existing,
                lastVisit: serverTimestamp(),
                totalVisits: (existing.totalVisits || 0) + 1
            }, { merge: true });
        }

        // Save individual visit log
        await addDoc(collection(db, 'visits'), {
            visitorId,
            sessionId,
            page,
            pageTitle,
            referrer,
            country: location.country,
            countryCode: location.countryCode,
            city: location.city,
            region: location.region,
            ip: location.ip,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timestamp: serverTimestamp(),
            isNewVisitor
        });

        console.log('Visit tracked:', { visitorId, page, isNewVisitor });
    } catch (err) {
        console.warn('Visit tracking failed:', err.message);
    }
}

// ============ TRACK PAGE VIEW ON LOAD ============
trackVisit();
