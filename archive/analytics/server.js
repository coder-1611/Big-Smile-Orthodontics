const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));
app.use(cookieParser(COOKIE_SECRET));

// CORS for analytics ingestion
app.use('/api/m', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiter (100 req/min per IP for ingestion)
const rateLimits = new Map();
app.use('/api/m', (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60000; }
  entry.count++;
  rateLimits.set(ip, entry);
  if (entry.count > 100) return res.status(429).json({ error: 'Too many requests' });
  next();
});

// Clean up rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now > entry.reset) rateLimits.delete(ip);
  }
}, 300000);

// ── Database ───────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'analytics.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    first_seen DATETIME DEFAULT (datetime('now')),
    last_seen DATETIME DEFAULT (datetime('now')),
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    browser TEXT,
    screen_width INTEGER,
    is_bounce INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    timestamp DATETIME DEFAULT (datetime('now')),
    time_on_page INTEGER DEFAULT 0,
    scroll_depth INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_label TEXT,
    event_target TEXT,
    timestamp DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pageviews_session ON pageviews(session_id);
  CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp);
  CREATE INDEX IF NOT EXISTS idx_pageviews_page ON pageviews(page_url);
  CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_sessions_first_seen ON sessions(first_seen);
`);

// Seed admin user if none exists
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get().c;
if (adminCount === 0) {
  const defaultPassword = crypto.randomBytes(8).toString('hex');
  const hash = bcrypt.hashSync(defaultPassword, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('\n============================================');
  console.log('  ADMIN CREDENTIALS (save these!)');
  console.log('  Username: admin');
  console.log('  Password: ' + defaultPassword);
  console.log('============================================\n');
}

// ── Prepared Statements ────────────────────────────────────
const stmts = {
  upsertSession: db.prepare(`
    INSERT INTO sessions (id, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, screen_width)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_seen = datetime('now')
  `),
  insertPageview: db.prepare(`
    INSERT INTO pageviews (session_id, page_url, page_title) VALUES (?, ?, ?)
  `),
  updatePageview: db.prepare(`
    UPDATE pageviews SET time_on_page = ?, scroll_depth = ? WHERE id = ?
  `),
  insertEvent: db.prepare(`
    INSERT INTO events (session_id, page_url, event_type, event_label, event_target) VALUES (?, ?, ?, ?, ?)
  `),
  markNotBounce: db.prepare(`
    UPDATE sessions SET is_bounce = 0 WHERE id = ?
  `),
  countSessionPageviews: db.prepare(`
    SELECT COUNT(*) as c FROM pageviews WHERE session_id = ?
  `),
};

// ── Analytics Ingestion Endpoints ──────────────────────────
app.post('/api/m/session', (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { sessionId, referrer, utmSource, utmMedium, utmCampaign, deviceType, browser, screenWidth } = body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    stmts.upsertSession.run(sessionId, referrer || '', utmSource || '', utmMedium || '', utmCampaign || '', deviceType || '', browser || '', screenWidth || 0);
    notifyDashboard();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/m/pageview', (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { sessionId, pageUrl, pageTitle } = body;
    if (!sessionId || !pageUrl) return res.status(400).json({ error: 'sessionId and pageUrl required' });
    const result = stmts.insertPageview.run(sessionId, pageUrl, pageTitle || '');
    // Mark as non-bounce if this is the 2nd+ pageview
    const pvCount = stmts.countSessionPageviews.get(sessionId).c;
    if (pvCount > 1) stmts.markNotBounce.run(sessionId);
    notifyDashboard();
    res.json({ ok: true, pageviewId: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/m/pageview-update', (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { pageviewId, timeOnPage, scrollDepth } = body;
    if (!pageviewId) return res.status(400).json({ error: 'pageviewId required' });
    stmts.updatePageview.run(timeOnPage || 0, scrollDepth || 0, pageviewId);
    notifyDashboard();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/m/event', (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { sessionId, pageUrl, eventType, eventLabel, eventTarget } = body;
    if (!sessionId || !eventType) return res.status(400).json({ error: 'sessionId and eventType required' });
    stmts.insertEvent.run(sessionId, pageUrl || '', eventType, eventLabel || '', eventTarget || '');
    notifyDashboard();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Auth Middleware ─────────────────────────────────────────
function authRequired(req, res, next) {
  const token = req.signedCookies.auth_token;
  if (!token) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
    return res.redirect('/admin/login');
  }
  next();
}

// ── Admin Auth Routes ──────────────────────────────────────
app.get('/admin/login', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Analytics Login</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;background:#1B2A4A;display:flex;align-items:center;justify-content:center;min-height:100vh}
.login{background:#fff;padding:2.5rem;border-radius:12px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.login h1{color:#1B2A4A;font-size:1.5rem;margin-bottom:.5rem}
.login p{color:#4A5568;font-size:.875rem;margin-bottom:1.5rem}
label{display:block;font-size:.8rem;font-weight:600;color:#1B2A4A;margin-bottom:.25rem}
input{width:100%;padding:.625rem .75rem;border:1px solid #ddd;border-radius:6px;font-size:.9rem;margin-bottom:1rem}
input:focus{outline:none;border-color:#0077B6;box-shadow:0 0 0 3px rgba(0,119,182,.15)}
button{width:100%;padding:.75rem;background:#0077B6;color:#fff;border:none;border-radius:6px;font-size:.95rem;font-weight:600;cursor:pointer}
button:hover{background:#005A8C}
.error{background:#FEE2E2;color:#E53E3E;padding:.5rem .75rem;border-radius:6px;font-size:.85rem;margin-bottom:1rem;display:none}
</style></head><body>
<form class="login" method="POST" action="/admin/login">
<h1>Big Smile Analytics</h1>
<p>Sign in to view your dashboard</p>
<div class="error" id="error"></div>
<label>Username</label><input name="username" required autofocus>
<label>Password</label><input name="password" type="password" required>
<button type="submit">Sign In</button>
</form>
<script>
const err = new URLSearchParams(location.search).get('error');
if(err){const el=document.getElementById('error');el.textContent=err;el.style.display='block'}
</script>
</body></html>`);
});

app.post('/admin/login', express.urlencoded({ extended: false }), (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.redirect('/admin/login?error=Invalid+credentials');
  }
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('auth_token', token, {
    signed: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  });
  res.redirect('/admin/dashboard');
});

app.get('/admin/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/admin/login');
});

// ── Dashboard ──────────────────────────────────────────────
app.get('/admin/dashboard', authRequired, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ── SSE for real-time dashboard updates ─────────────────────
const sseClients = new Set();

app.get('/api/admin/stream', authRequired, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function notifyDashboard() {
  for (const client of sseClients) {
    client.write('data: update\n\n');
  }
}

// ── Admin API (date-range aware) ───────────────────────────
function getDateRange(query) {
  const range = query.range || '30d';
  const now = new Date();
  let from;
  if (range === '7d') from = new Date(now - 7 * 86400000);
  else if (range === '30d') from = new Date(now - 30 * 86400000);
  else if (range === '90d') from = new Date(now - 90 * 86400000);
  else if (range === 'all') return { from: '2000-01-01', to: '2100-01-01' };
  else from = new Date(now - 30 * 86400000);
  return {
    from: from.toISOString().slice(0, 19).replace('T', ' '),
    to: now.toISOString().slice(0, 19).replace('T', ' ')
  };
}

app.get('/api/admin/overview', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const totalPageviews = db.prepare('SELECT COUNT(*) as c FROM pageviews WHERE timestamp BETWEEN ? AND ?').get(from, to).c;
  const uniqueSessions = db.prepare('SELECT COUNT(DISTINCT session_id) as c FROM pageviews WHERE timestamp BETWEEN ? AND ?').get(from, to).c;
  const bounceRate = db.prepare(`
    SELECT ROUND(AVG(is_bounce) * 100, 1) as rate FROM sessions
    WHERE first_seen BETWEEN ? AND ?
  `).get(from, to).rate || 0;
  const avgTime = db.prepare(`
    SELECT ROUND(AVG(time_on_page), 0) as avg FROM pageviews
    WHERE timestamp BETWEEN ? AND ? AND time_on_page > 0
  `).get(from, to).avg || 0;
  const totalEvents = db.prepare('SELECT COUNT(*) as c FROM events WHERE timestamp BETWEEN ? AND ?').get(from, to).c;
  const bookingClicks = db.prepare("SELECT COUNT(*) as c FROM events WHERE event_type = 'booking_click' AND timestamp BETWEEN ? AND ?").get(from, to).c;
  const phoneClicks = db.prepare("SELECT COUNT(*) as c FROM events WHERE event_type = 'phone_click' AND timestamp BETWEEN ? AND ?").get(from, to).c;
  const testButtonClicks = db.prepare("SELECT COUNT(*) as c FROM events WHERE event_type = 'test_button_click' AND timestamp BETWEEN ? AND ?").get(from, to).c;

  res.json({ totalPageviews, uniqueSessions, bounceRate, avgTime, totalEvents, bookingClicks, phoneClicks, testButtonClicks });
});

app.get('/api/admin/pages', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT page_url, COUNT(*) as visits, ROUND(AVG(time_on_page),0) as avg_time, ROUND(AVG(scroll_depth),0) as avg_scroll
    FROM pageviews WHERE timestamp BETWEEN ? AND ?
    GROUP BY page_url ORDER BY visits DESC LIMIT 20
  `).all(from, to);
  res.json(rows);
});

app.get('/api/admin/cta', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const uniqueSessions = db.prepare('SELECT COUNT(DISTINCT session_id) as c FROM pageviews WHERE timestamp BETWEEN ? AND ?').get(from, to).c || 1;
  const rows = db.prepare(`
    SELECT event_type, event_label, COUNT(*) as clicks, COUNT(DISTINCT session_id) as unique_sessions
    FROM events WHERE timestamp BETWEEN ? AND ?
    GROUP BY event_type, event_label ORDER BY clicks DESC
  `).all(from, to);
  const result = rows.map(r => ({
    ...r,
    conversion_rate: Math.round((r.unique_sessions / uniqueSessions) * 1000) / 10
  }));
  res.json(result);
});

app.get('/api/admin/funnel', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);

  const homeSessions = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as c FROM pageviews
    WHERE (page_url LIKE '%index%' OR page_url = '/' OR page_url = '') AND timestamp BETWEEN ? AND ?
  `).get(from, to).c;

  const serviceSessions = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as c FROM pageviews
    WHERE page_url LIKE '%services%' AND timestamp BETWEEN ? AND ?
    AND session_id IN (SELECT DISTINCT session_id FROM pageviews WHERE (page_url LIKE '%index%' OR page_url = '/' OR page_url = '') AND timestamp BETWEEN ? AND ?)
  `).get(from, to, from, to).c;

  const bookingSessions = db.prepare(`
    SELECT COUNT(DISTINCT session_id) as c FROM events
    WHERE event_type = 'booking_click' AND timestamp BETWEEN ? AND ?
  `).get(from, to).c;

  res.json({
    steps: [
      { label: 'Homepage', count: homeSessions },
      { label: 'Services Page', count: serviceSessions },
      { label: 'Booking Click', count: bookingSessions }
    ]
  });
});

app.get('/api/admin/journeys', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT journey, COUNT(*) as count FROM (
      SELECT session_id, GROUP_CONCAT(page_url, ' → ') as journey
      FROM (SELECT session_id, page_url FROM pageviews WHERE timestamp BETWEEN ? AND ? ORDER BY session_id, timestamp)
      GROUP BY session_id HAVING COUNT(*) > 1
    ) GROUP BY journey ORDER BY count DESC LIMIT 10
  `).all(from, to);
  res.json(rows);
});

app.get('/api/admin/devices', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT device_type, COUNT(*) as count FROM sessions
    WHERE first_seen BETWEEN ? AND ? AND device_type != ''
    GROUP BY device_type ORDER BY count DESC
  `).all(from, to);
  res.json(rows);
});

app.get('/api/admin/referrers', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT CASE WHEN referrer = '' THEN 'Direct' ELSE referrer END as source, COUNT(*) as count
    FROM sessions WHERE first_seen BETWEEN ? AND ?
    GROUP BY source ORDER BY count DESC LIMIT 15
  `).all(from, to);
  res.json(rows);
});

app.get('/api/admin/hourly', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT CAST(strftime('%H', timestamp) AS INTEGER) as hour, COUNT(*) as count
    FROM pageviews WHERE timestamp BETWEEN ? AND ?
    GROUP BY hour ORDER BY hour
  `).all(from, to);
  // Fill gaps
  const full = Array.from({ length: 24 }, (_, i) => {
    const found = rows.find(r => r.hour === i);
    return { hour: i, count: found ? found.count : 0 };
  });
  res.json(full);
});

app.get('/api/admin/trends', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT DATE(timestamp) as date, COUNT(*) as pageviews, COUNT(DISTINCT session_id) as sessions
    FROM pageviews WHERE timestamp BETWEEN ? AND ?
    GROUP BY date ORDER BY date
  `).all(from, to);
  res.json(rows);
});

app.get('/api/admin/conversion-paths', authRequired, (req, res) => {
  const { from, to } = getDateRange(req.query);
  const rows = db.prepare(`
    SELECT p.page_url, COUNT(DISTINCT p.session_id) as leads
    FROM pageviews p
    JOIN events e ON p.session_id = e.session_id AND e.event_type = 'booking_click'
    WHERE p.timestamp BETWEEN ? AND ?
    GROUP BY p.page_url ORDER BY leads DESC LIMIT 10
  `).all(from, to);
  res.json(rows);
});

// Serve metrics.js
app.get('/metrics.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'metrics.js'));
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Analytics server running at http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/admin/dashboard`);
});
