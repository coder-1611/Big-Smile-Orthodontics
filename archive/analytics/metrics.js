(function () {
  'use strict';

  // Derive API base from the script's own URL (works on any host)
  var scripts = document.getElementsByTagName('script');
  var thisScript = scripts[scripts.length - 1];
  var API = thisScript.src.replace(/\/metrics\.js.*$/, '');

  // ── Session ID (per-tab, via sessionStorage) ────────────
  var SESSION_KEY = '_bsm_sid';
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : ('s-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  // ── Device Detection ────────────────────────────────────
  function getDeviceType() {
    var w = window.innerWidth;
    if (w <= 768) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    return 'Other';
  }

  // ── UTM Params ──────────────────────────────────────────
  function getUtm(name) {
    try {
      return new URLSearchParams(location.search).get(name) || '';
    } catch (e) { return ''; }
  }

  // ── Send helpers ────────────────────────────────────────
  function post(endpoint, data) {
    try {
      fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function beacon(endpoint, data) {
    try {
      navigator.sendBeacon(API + endpoint, JSON.stringify(data));
    } catch (e) {
      post(endpoint, data);
    }
  }

  // ── Page URL (clean) ────────────────────────────────────
  var pageUrl = location.pathname.split('/').pop() || 'index.html';
  var pageTitle = document.title;

  // ── Track Session ───────────────────────────────────────
  var IS_NEW_SESSION = !sessionStorage.getItem('_bsm_started');
  if (IS_NEW_SESSION) {
    sessionStorage.setItem('_bsm_started', '1');
    post('/api/m/session', {
      sessionId: sessionId,
      referrer: document.referrer,
      utmSource: getUtm('utm_source'),
      utmMedium: getUtm('utm_medium'),
      utmCampaign: getUtm('utm_campaign'),
      deviceType: getDeviceType(),
      browser: getBrowser(),
      screenWidth: window.innerWidth
    });
  }

  // ── Track Pageview ──────────────────────────────────────
  var currentPageviewId = null;
  var pageStartTime = Date.now();

  fetch(API + '/api/m/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sessionId, pageUrl: pageUrl, pageTitle: pageTitle }),
    keepalive: true
  })
    .then(function (r) { return r.json(); })
    .then(function (data) { currentPageviewId = data.pageviewId; })
    .catch(function () {});

  // ── Scroll Depth Tracking ───────────────────────────────
  var maxScroll = 0;
  var scrollTimer = null;

  function updateScroll() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    if (docHeight > 0) {
      var pct = Math.round((scrollTop / docHeight) * 100);
      if (pct > maxScroll) maxScroll = pct;
    }
  }

  window.addEventListener('scroll', function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = null;
      updateScroll();
    }, 300);
  }, { passive: true });

  // ── Page Unload (send time + scroll via beacon) ─────────
  function sendPageClose() {
    if (!currentPageviewId) return;
    var timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    beacon('/api/m/pageview-update', {
      pageviewId: currentPageviewId,
      timeOnPage: timeOnPage,
      scrollDepth: maxScroll
    });
    currentPageviewId = null; // prevent double-send
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') sendPageClose();
  });
  window.addEventListener('beforeunload', sendPageClose);

  // ── CTA Click Tracking (capture phase) ──────────────────
  var formStartTracked = false;

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    var btn = e.target.closest('button');
    var target = link || btn;
    if (!target) return;

    var href = target.getAttribute('href') || '';
    var text = (target.textContent || '').trim().substring(0, 80);
    var eventType = null;
    var eventLabel = text;

    // Test button
    if (target.id === 'testBtn') {
      eventType = 'test_button_click';
    }
    // Booking clicks (NexHealth)
    else if (href.indexOf('nexhealth.com') > -1) {
      eventType = 'booking_click';
    }
    // Phone clicks
    else if (href.indexOf('tel:') === 0) {
      eventType = 'phone_click';
    }
    // CTA button clicks
    else if (target.classList.contains('btn--primary') ||
             target.classList.contains('btn--accent') ||
             target.classList.contains('btn--warm')) {
      eventType = 'cta_click';
    }

    if (eventType) {
      beacon('/api/m/event', {
        sessionId: sessionId,
        pageUrl: pageUrl,
        eventType: eventType,
        eventLabel: eventLabel,
        eventTarget: href
      });
    }
  }, true); // capture phase

  // ── Contact Form Tracking ───────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contactForm');
    if (!form) return;

    // Track first interaction
    form.addEventListener('focusin', function () {
      if (formStartTracked) return;
      formStartTracked = true;
      post('/api/m/event', {
        sessionId: sessionId,
        pageUrl: pageUrl,
        eventType: 'form_start',
        eventLabel: 'Contact Form',
        eventTarget: '#contactForm'
      });
    });

    // Track submission
    form.addEventListener('submit', function () {
      beacon('/api/m/event', {
        sessionId: sessionId,
        pageUrl: pageUrl,
        eventType: 'form_submit',
        eventLabel: 'Contact Form',
        eventTarget: '#contactForm'
      });
    });
  });

})();
