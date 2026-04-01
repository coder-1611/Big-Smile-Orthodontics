#!/usr/bin/env node
/**
 * Combines all Big Smile Orthodontics pages into a single HTML file
 * with inlined CSS/JS and anchor-based navigation.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Read all CSS files in order
const cssFiles = [
  'css/variables.css',
  'css/base.css',
  'css/components.css',
  'css/sections.css',
  'css/responsive.css',
];

const jsFiles = [
  'js/main.js',
  'js/animations.js',
  'js/interactions.js',
];

const pages = [
  { file: 'index.html', id: 'page-home', label: 'Home' },
  { file: 'services.html', id: 'page-services', label: 'Services' },
  { file: 'meet-dr-asrar.html', id: 'page-dr-asrar', label: 'Dr. Asrar' },
  { file: 'meet-the-team.html', id: 'page-team', label: 'Team' },
  { file: 'smile-gallery.html', id: 'page-gallery', label: 'Gallery' },
  { file: 'for-patients.html', id: 'page-patients', label: 'For Patients' },
  { file: 'contact.html', id: 'page-contact', label: 'Contact' },
];

// Read and combine CSS
const allCSS = cssFiles.map(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return `/* === ${f} === */\n${content}`;
}).join('\n\n');

// Read and combine JS (skip localhost metrics, skip form.js if it doesn't exist)
const allJS = jsFiles.map(f => {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) return '';
  const content = fs.readFileSync(fullPath, 'utf8');
  return `/* === ${f} === */\n${content}`;
}).join('\n\n');

// Extract <main> content from each page
function extractMain(html) {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return mainMatch ? mainMatch[1] : '';
}

// Extract footer from the first page (they're all the same)
function extractFooter(html) {
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  return footerMatch ? footerMatch[0] : '';
}

// Extract nav from index.html
function extractNav(html) {
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  return navMatch ? navMatch[0] : '';
}

// Fix internal links to become anchor links
function fixLinks(html, pageMap) {
  let fixed = html;

  // Replace page.html links with #page-id anchors
  for (const p of pageMap) {
    const filename = p.file;
    const pageId = p.id;

    // href="filename.html#section" -> href="#section"
    const regexWithHash = new RegExp(`href="${filename.replace('.', '\\.')}#([^"]*)"`, 'g');
    fixed = fixed.replace(regexWithHash, `href="#$1"`);

    // href="filename.html" -> href="#page-id"
    const regexNoHash = new RegExp(`href="${filename.replace('.', '\\.')}"`, 'g');
    fixed = fixed.replace(regexNoHash, `href="#${pageId}"`);
  }

  // Also fix index.html references
  fixed = fixed.replace(/href="index\.html#([^"]*)"/g, 'href="#$1"');
  fixed = fixed.replace(/href="index\.html"/g, 'href="#page-home"');

  // Remove localhost metrics script references
  fixed = fixed.replace(/<script[^>]*localhost[^>]*><\/script>/g, '');

  return fixed;
}

// Build the combined page
const indexHTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const nav = extractNav(indexHTML);
const footer = extractFooter(indexHTML);

// Extract schema.org from index
const schemaMatch = indexHTML.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/);
const schema = schemaMatch ? schemaMatch[0] : '';

// Build sections from each page
const sections = pages.map(p => {
  const html = fs.readFileSync(path.join(ROOT, p.file), 'utf8');
  const mainContent = extractMain(html);
  return `\n<!-- ======== ${p.label} ======== -->\n<div id="${p.id}" class="page-section">\n${mainContent}\n</div>`;
}).join('\n');

// Fix all links in nav, sections, and footer
const fixedNav = fixLinks(nav, pages);
const fixedSections = fixLinks(sections, pages);
const fixedFooter = fixLinks(footer, pages);

// Build final HTML
const combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Big Smile Orthodontics | Round Rock Orthodontist | Braces & Invisalign</title>
  <meta name="description" content="Top-rated orthodontist in Round Rock, TX. Dr. Saba Asrar offers braces, Invisalign & more. 300+ 5-star reviews. $1,000 off — schedule your free consultation!">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  ${schema}

  <style>
${allCSS}

/* === Single-page additions === */
.page-section {
  /* Each page section flows naturally */
}
  </style>
</head>
<body>

${fixedNav}

${fixedSections}

${fixedFooter}

<!-- Mobile Sticky CTA -->
<div class="mobile-cta" id="mobileCta">
  <a href="tel:5128287900" class="mobile-cta__btn mobile-cta__btn--call">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    Call Now
  </a>
  <a href="https://app.nexhealth.com/appt/big-smile-orthodontics" target="_blank" class="mobile-cta__btn mobile-cta__btn--book">Book Free Consult</a>
</div>

<script>
${allJS}

/* === Single-page nav fix === */
// Disable page transition fade-out since everything is on one page
document.body.classList.remove('is-leaving');
</script>

</body>
</html>`;

const outPath = path.join(ROOT, 'big-smile-combined.html');
fs.writeFileSync(outPath, combinedHTML, 'utf8');
console.log(`Combined file written to: ${outPath}`);
console.log(`Size: ${(Buffer.byteLength(combinedHTML) / 1024).toFixed(1)} KB`);
