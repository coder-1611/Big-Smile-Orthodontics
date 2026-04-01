/* ============================================
   Interactions — Delightful Micro-Interactions
   ============================================ */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // ---- Scroll Progress Indicator ----
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ---- Magnetic Buttons ----
  // Buttons subtly pull toward the cursor on hover
  var magneticEls = document.querySelectorAll('.btn--primary, .btn--accent, .btn--warm');

  magneticEls.forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15 - 2) + 'px)';
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
    });
  });

  // ---- Card Tilt Effect ----
  // Subtle 3D tilt on card hover
  var tiltCards = document.querySelectorAll('.card, .service-card, .patient-form-card, .everyone__card');

  tiltCards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var tiltX = (y - 0.5) * -6;
      var tiltY = (x - 0.5) * 6;
      card.style.transform = 'perspective(800px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateY(-4px)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
      setTimeout(function () { card.style.transition = ''; }, 400);
    });
  });

  // ---- Image Reveal on Scroll ----
  // Images slide in with a colored overlay wipe
  var revealImages = document.querySelectorAll('.patient-split__visual img, .about-preview__image, .technology__image');

  var imageObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.parentElement.classList.add('img-revealed');
        imageObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealImages.forEach(function (img) {
    var wrapper = img.parentElement;
    if (!wrapper.classList.contains('img-reveal-wrap')) {
      wrapper.classList.add('img-reveal-wrap');
      imageObserver.observe(img);
    }
  });

  // ---- Smooth Parallax Sections ----
  // Subtle parallax movement on section backgrounds
  var parallaxSections = document.querySelectorAll('.page-hero, .cta-band');
  var shapes = document.querySelectorAll('.cta-band__bg-shape, .page-hero::before');

  var lastScrollY = 0;
  var ticking = false;

  function updateParallax() {
    var scrollY = window.scrollY;

    parallaxSections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      var visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!visible) return;

      var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      var offset = (progress - 0.5) * 30;
      section.style.setProperty('--parallax-y', offset + 'px');
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  // ---- Text Shimmer on Section Labels ----
  // Adds a subtle shimmer to section labels when they come into view
  var labels = document.querySelectorAll('.section-label, .hero__label');
  var labelObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('shimmer');
        labelObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  labels.forEach(function (label) {
    labelObserver.observe(label);
  });

  // ---- Smooth Back-to-Top Button ----
  var topBtn = document.createElement('button');
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(topBtn);

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function toggleTopBtn() {
    if (window.scrollY > 600) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', toggleTopBtn, { passive: true });

  // ---- Hover Ripple Effect on CTA Buttons ----
  document.querySelectorAll('.btn--primary, .btn--accent').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var rect = btn.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  });

  // ---- Nav Links — Active Section Highlight (homepage only) ----
  var isHomepage = (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'));
  if (isHomepage) {
    var sections = document.querySelectorAll('main section[id]');
    var navLinks = document.querySelectorAll('.nav__link, .nav__dropdown-link');

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === '#' + id || href === 'index.html#' + id) {
              link.classList.add('nav__link--viewing');
            } else {
              link.classList.remove('nav__link--viewing');
            }
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-20% 0px -60% 0px' });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // ---- Typed/Count-Up for Trust Bar Numbers ----
  // Already handled in animations.js, but add a bounce finish
  var counterEls = document.querySelectorAll('[data-count]');
  counterEls.forEach(function (el) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            el.style.transform = 'scale(1.08)';
            setTimeout(function () {
              el.style.transform = '';
              el.style.transition = 'transform 0.3s ease';
            }, 200);
          }, 1600); // After counter finishes
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });

  // ---- Stagger Children with Enhanced Timing ----
  // Add slight rotation on stagger children for more life
  document.querySelectorAll('[data-animate="stagger"]').forEach(function (parent) {
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
      children[i].style.setProperty('--stagger-delay', (i * 0.08) + 's');
    }
  });

})();
