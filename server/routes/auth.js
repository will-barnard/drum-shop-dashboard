const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || 'localhost';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function cookieOptions() {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  };
  // Set domain for cross-subdomain cookie sharing in production
  if (COOKIE_DOMAIN !== 'localhost') {
    opts.domain = COOKIE_DOMAIN;
  }
  return opts;
}

// Validate that a redirect URL is a safe *.drugansdrums.com subdomain
function isValidRedirect(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.drugansdrums.com') &&
      parsed.hostname !== 'drugansdrums.com'
    );
  } catch {
    return false;
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, cookieOptions());
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  const opts = cookieOptions();
  opts.maxAge = 0;
  res.cookie('token', '', opts);
  res.json({ ok: true });
});

// GET /api/auth/me — get current user from cookie
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/verify — for other subdomain apps to verify the shared cookie
// Returns user info and token metadata. Accepts cookie or Authorization header.
router.get('/verify', authenticate, (req, res) => {
  const { iat, exp } = req.tokenPayload;
  res.json({
    user: req.user,
    token: {
      issuedAt: new Date(iat * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
    },
  });
});

module.exports = router;
