# Project Guidelines

## Default Edit Target
The site is multi-page. Edit the HTML file that matches the page being changed:

- `big-smile.html` — Home/landing page (default target if a page isn't specified)
- `services.html` — Services
- `contact.html` — Contact
- `dr-asrar.html` — About Dr. Asrar
- `for-patients.html` — For Patients
- `smile-gallery.html` — Smile Gallery

Shared styles live in `assets/site.css` and `assets/subpage.css`. Shared JS lives in `assets/site.js` and `assets/chrome.js`.

## Project Structure
- `big-smile.html`, `services.html`, `contact.html`, `dr-asrar.html`, `for-patients.html`, `smile-gallery.html` — Live site pages
- `assets/` — Images, videos, CSS, JS
- `original/` — Reference copy of the prior single-page combined site (`big-smile-combined.html`); not served
- `uploads/` — Image uploads referenced by the site
- `archive/` — Old versions and prior project snapshots (kept for reference, not actively used)

## Auto-Push to GitHub
After EVERY edit — no matter how small — immediately `git add`, `git commit`, and `git push` the changes to GitHub. No exceptions. Do not batch edits or wait for the user to ask. Every single file change gets its own commit and push.
