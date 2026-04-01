/* ============================================
   Main JS — Nav, Smooth Scroll, Mobile Menu
   ============================================ */

(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  // ---- Nav scroll effect ----
  let lastScroll = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 80) {
      nav.classList.add('nav--scrolled');
      nav.classList.remove('nav--transparent');
    } else {
      nav.classList.remove('nav--scrolled');
      nav.classList.add('nav--transparent');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // Run once on load

  // ---- Mobile menu toggle ----
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 80;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ---- Dropdown hover fix for touch devices ----
  document.querySelectorAll('.nav__dropdown').forEach(function (dropdown) {
    dropdown.addEventListener('click', function (e) {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        this.classList.toggle('active');
      }
    });
  });

  // ---- Mobile sticky CTA show/hide ----
  const mobileCta = document.getElementById('mobileCta');
  if (mobileCta) {
    function handleMobileCta() {
      if (window.scrollY > 400) {
        mobileCta.classList.add('visible');
      } else {
        mobileCta.classList.remove('visible');
      }
    }
    window.addEventListener('scroll', handleMobileCta, { passive: true });
  }

  // ---- FAQ Accordion ----
  document.querySelectorAll('.faq-item__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.closest('.faq-item');
      var isOpen = item.classList.contains('is-open');

      // Close all other FAQ items
      document.querySelectorAll('.faq-item.is-open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      item.classList.toggle('is-open', !isOpen);
      this.setAttribute('aria-expanded', !isOpen);
    });
  });

  // ---- Mobile Sub-Menu Toggles ----
  document.querySelectorAll('.nav__mobile-link').forEach(function (link) {
    var sub = link.nextElementSibling;
    if (sub && sub.classList.contains('nav__mobile-sub')) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        sub.classList.toggle('active');
        this.classList.toggle('active');
      });
    }
  });

  // ---- Page transition on internal link clicks ----
  // Adds a fade-out before navigating to another page
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Skip anchors, external links, tel/mailto, new-tab links
      if (href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') ||
          href.startsWith('http') || link.target === '_blank') return;

      // Skip if it's pointing to the current page (same filename or index)
      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      var targetPage = href.split('#')[0];
      if (!targetPage || targetPage === currentPage) return;

      e.preventDefault();
      document.body.classList.add('is-leaving');

      setTimeout(function () {
        window.location.href = href;
      }, 220);
    });
  }

})();
