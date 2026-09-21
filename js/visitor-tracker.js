import { db } from '../config/firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getVisitorId() {
    let visitorId = localStorage.getItem('apex_visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(-8);
        localStorage.setItem('apex_visitor_id', visitorId);
    }
    return visitorId;
}

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

function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (/mobile/i.test(ua)) device = 'Mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

    if (/chrome|crios/i.test(ua)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/edge/i.test(ua)) browser = 'Edge';
    else if (/opr/i.test(ua)) browser = 'Opera';

    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
}

function getLocationFromTimezone() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

        const parts = timezone.split('/');
        const region = parts[0] || 'Unknown';
        const city = parts[1] ? parts[1].replace(/_/g, ' ') : 'Unknown';

        let country = 'Unknown';
        if (region === 'Asia') {
            if (city.includes('Karachi')) country = 'Pakistan';
            else if (city.includes('Kolkata')) country = 'India';
            else if (city.includes('Dubai')) country = 'UAE';
            else if (city.includes('Riyadh')) country = 'Saudi Arabia';
            else if (city.includes('Dhaka')) country = 'Bangladesh';
            else country = 'Asia';
        } else if (region === 'Europe') country = 'Europe';
        else if (region === 'America') country = 'America';
        else if (region === 'Africa') country = 'Africa';
        else if (region === 'Australia') country = 'Australia';
        else country = region;

        return {
            country: country,
            countryCode: region.substring(0, 2).toUpperCase(),
            city: city,
            region: region,
            timezone: timezone,
            ip: 'Hidden'
        };
    } catch (err) {
        return {
            country: 'Unknown',
            countryCode: 'XX',
            city: 'Unknown',
            region: 'Unknown',
            timezone: 'Unknown',
            ip: 'Hidden'
        };
    }
}

async function trackVisit() {
    try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const deviceInfo = getDeviceInfo();
        const location = getLocationFromTimezone();

        const page = window.location.pathname || '/';
        const pageTitle = document.title || 'Unknown';
        const referrer = document.referrer || 'Direct';

        const visitorRef = doc(db, 'visitors', visitorId);
        const visitorSnap = await getDoc(visitorRef);
        const isNewVisitor = !visitorSnap.exists();

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
                timezone: location.timezone,
                device: deviceInfo.device,
                browser: deviceInfo.browser,
                os: deviceInfo.os
            });
        } else {
            const existing = visitorSnap.data();
            await setDoc(visitorRef, {
                ...existing,
                lastVisit: serverTimestamp(),
                totalVisits: (existing.totalVisits || 0) + 1,
                timezone: location.timezone
            }, { merge: true });
        }

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
            timezone: location.timezone,
            device: deviceInfo.device,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timestamp: serverTimestamp(),
            isNewVisitor
        });

    } catch (err) {
        console.warn('Visit tracking failed:', err.message);
    }
}

trackVisit();
