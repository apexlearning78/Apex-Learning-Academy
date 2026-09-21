# Apex Learning Academy — Production Deployment

1. Upload the contents of this folder to the `Apex-Learning-Academy` GitHub repository. Keep `index.html`, `manifest.json`, `sw.js`, `robots.txt` and `sitemap.xml` at repository root.
2. In GitHub: Settings → Pages → Deploy from branch → select the main branch and root.
3. In Firebase Authentication → Settings → Authorized domains, add `apexlearning78.github.io` and your local development host.
4. In Google Cloud API & Services → Credentials → API key, restrict the Firebase web key to HTTP referrers including `https://apexlearning78.github.io/Apex-Learning-Academy/*` and your localhost development origin. Restrict APIs to the Firebase APIs actually required by this project.
5. Publish `firestore.rules` in Firebase Console or with the Firebase CLI.
6. For the strongest admin security, set a Firebase Auth custom claim such as `admin=true` from a trusted server/Cloud Function and enforce it in rules. The current admin page also checks the existing admin UID for UI access.
7. Test login, registration, dashboard, admin, contact, entrance test, certificates, live classes and verification on both desktop and mobile.
8. If you change the Firebase project, update `config/firebase-config.js` and the rules before deploying.


## Site-wide design update
All public pages now use the same visual shell as `index.html`: the same header,
mobile navigation, background treatment, typography, colors, buttons and footer.
Page-specific functionality and scripts are retained.

## Security notes
- Firebase web configuration is client-side configuration, not a password.
- Firestore Rules remain the real authorization boundary.
- Publish `firestore.rules` in Firebase Console before production use.
- Keep Firebase Authorized Domains limited to the domains you actually use.
- Never place service-account/private keys in this repository.
- Test authenticated and unauthenticated Firestore operations after deployment.
