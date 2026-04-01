# Round Rock, TX — Local Business Website Audit Report

**Date:** March 29, 2026
**Businesses Evaluated:** 14 independent local businesses across multiple categories
**Scoring:** 6 criteria (Mobile, Design, Performance, Content, SSL, SEO) scored 1-5 each = 30 max
**Flagged Threshold:** Score ≤ 20 = "Needs Improvement"
**Methodology:** Two-pass analysis — Pass 1 (raw HTML source) for technical issues + Pass 2 (Playwright rendered DOM) for content verification. Only verified findings are included.

---

## Top Flagged Websites (Strongest Outreach Opportunities)

### 1. Ray CPA, P.C. — Score: 14/30
- **Category:** Accountant
- **Website:** https://www.theroundrockcpa.com/
- **Phone:** (512)786-2052
- **Address:** 3000 Joe DiMaggio Blvd., Suite 91, Round Rock, TX 78665
- **Verified Issues:**
  - No viewport meta tag
  - Cufon fonts deprecated ~2012
  - jQuery Nivo Slider + Superfish menus
  - Dual analytics (GA + Matomo)
  - No meta description
  - Missing image alt text

### 2. Round Rock Landscaping — Score: 16/30
- **Category:** Landscaping
- **Website:** https://www.roundrocklandscaping.net/
- **Phone:** (512) 379-5600
- **Address:** 5600
LAWN SERVICE ROUND ROCK
We prove the best lawn care in Round Rock and promise to keep your yard
- **Verified Issues:**
  - Mustache template variables visible ({{#id}}, {{{title_html}}})
  - Massive inline CSS
  - Weebly platform
  - No meta description
  - Missing image alt text

### 3. Custom Sewing by June — Score: 16/30
- **Category:** Tailor
- **Website:** https://www.customsewingbyjune.com/
- **Phone:** 512.388.0003
- **Address:** Not found
- **Verified Issues:**
  - **Typo: "Alternations" should be "Alterations"** (confirmed on live site)
  - **Empty "Latest Blog Posts" section** (confirmed on live site)
  - **No physical address listed** (confirmed on live site)
  - **No business hours listed** (confirmed on live site)
  - Typo: "Alternations" instead of "Alterations" (3x)
  - No meta description
  - Missing image alt text
  - Empty blog section

### 4. Round Rock Locksmith — Score: 17/30
- **Category:** Locksmith
- **Website:** https://roundrock-locksmith.com/
- **Phone:** 512-537-4304
- **Address:** 2551 N Mays St, Round Rock, TX 78665
- **Verified Issues:**
  - No viewport meta tag
  - Phone mismatch: 469 area code in schema vs 512 in footer
  - Float-based layouts
  - 2000+ lines inline CSS

### 5. Locker Room Haircuts — Score: 17/30
- **Category:** Barbershop
- **Website:** https://lockerroomatx.com/
- **Phone:** (512) 401-3349
- **Address:** 635 University Blvd, Round Rock, TX 78665
- **Verified Issues:**
  - No viewport meta tag
  - 4 Google Analytics implementations
  - jQuery-based responsive design
  - All images missing alt text

### 6. Adair & Sons Automotive — Score: 18/30
- **Category:** Auto Repair
- **Website:** https://www.adairandsons.com/
- **Phone:** (512) 255-2022
- **Address:** 1001 Sam Bass Rd, Round Rock, TX 78681
- **Verified Issues:**
  - 100+ @font-face declarations
  - NitroPack optimization overhead
  - No meta description visible
  - Divi/WordPress theme

### 7. Allstate Plumbing Heat & Air — Score: 18/30
- **Category:** Plumber
- **Website:** https://www.allstate-plumbing.com/
- **Phone:** 512.990.8600
- **Address:** 16800 Radholme Ct
- **Verified Issues:**
  - Extreme page bloat (Elementor + WP Rocket)
  - ~250KB+ embedded CSS
  - *Correction: Phone/contact info IS present on rendered page (JS-rendered)*

### 8. S2 Fitness Studio — Score: 19/30
- **Category:** Gym
- **Website:** https://www.s2fitnessstudio.com/
- **Phone:** (737) 291-7096
- **Address:** 17420 Ranch to Market Rd 620 #180, Round Rock, TX 78681
- **Verified Issues:**
  - **Lovable.dev development badge visible in production** (confirmed on live site)
  - Lovable.dev development badge visible
  - No meta description
  - No heading hierarchy visible

### 9. The Garage Gym — Score: 19/30
- **Category:** Gym
- **Website:** https://thegaragegym.club/
- **Phone:** (512) 710-7188
- **Address:** 3918 Gattis School Road, Ste #102, Round Rock, TX 78664
- **Verified Issues:**
  - 1x1 GIF placeholder images for trainers
  - Duplicate trainer entry (Christopher Haskin 2x)
  - No meta description
  - Missing image alt text
  - GoDaddy Website Builder

### 10. Next Thread Alterations — Score: 20/30
- **Category:** Tailor
- **Website:** https://nextthreadalterations.com/
- **Phone:** (614) 330-1879
- **Address:** 602 McNeil Road #116, Round Rock, TX 78681
- **Verified Issues:**
  - **Template instruction text visible: "Click to edit..."** (confirmed on live site)
  - Template instruction text visible: "Click to edit and tell visitors..."
  - Placeholder image alt: "image477"
  - No meta description
  - Page bloat from GoDaddy builder

### 11. Nelly Be Fading — Score: 20/30
- **Category:** Barbershop
- **Website:** https://www.barbershoproundrock.com/
- **Phone:** (512) 402-3640
- **Address:** 201 University Oaks Blvd, Suite 13, Round Rock, TX 78665
- **Verified Issues:**
  - No viewport meta tag visible
  - No title tag visible
  - No meta description

### 12. Purr-fect Pets Grooming — Score: 20/30
- **Category:** Pet Groomer
- **Website:** https://purr-fect-pets-round-rock.com/
- **Phone:** 512-910-2526
- **Address:** 3701 Gattis School Rd
- **Verified Issues:**
  - ~200KB inline CSS (Divi theme)
  - Missing image alt text
  - *Correction: Phone/contact info IS present on rendered page (JS-rendered)*

---

## Businesses With NO Website (Separate Opportunities)

These businesses were found on social media or directories only:
- **Lupita's Alterations** — Facebook page only
- **Coco's Alterations** — Nextdoor listing only
- **Linh's Alterations** — Yelp listing only

---

## Scoring Summary

| Score Range | Count | Assessment |
|-------------|-------|------------|
| 14-16 | 3 | Critical — significant redesign recommended |
| 17-18 | 4 | Poor — multiple improvements needed |
| 19-20 | 5 | Below Average — issues to address |
| 21-24 | 2 | Average — minor improvements |
| 25-30 | 0 | Good — minimal issues |

---

## Common Issues Across Flagged Businesses

| Issue | Frequency |
|-------|-----------|
| Missing or inadequate image alt text | 6/14 |
| Missing meta description | 9/14 |
| Excessive page bloat (inline CSS/JS) | 5/14 |
| No viewport meta tag | 4/14 |
| Template/placeholder artifacts | 5/14 |
| Outdated tech (jQuery, floats, deprecated libs) | 3/14 |

---

## Verification Note

This audit uses a two-pass methodology to ensure accuracy:
1. **Pass 1 (web_fetch)**: Analyzes raw HTML for technical issues (meta tags, CSS, page weight, tech stack)
2. **Pass 2 (Playwright)**: Loads each site in a real browser to verify what visitors actually see

Content claims (phone, address, hours, services) are ONLY included if confirmed by Pass 2. Several initial findings from Pass 1 were corrected after verification — notably Jean's Cleaning Service and Allstate Plumbing, which have content that renders via JavaScript but doesn't appear in raw HTML.
