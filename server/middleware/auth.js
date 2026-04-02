const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';

function authenticate(req, res, next) {
  // Accept token from Authorization header or cookie
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = req.cookies?.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, email, name, role FROM users WHERE id = ?')
      .get(payload.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
