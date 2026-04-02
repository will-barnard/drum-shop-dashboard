# Dashboard Auth Integration Guide

This document describes how to integrate a subdomain app at `*.drugansdrums.com` with the centralized auth system hosted at `https://dashboard.drugansdrums.com`.

## How It Works

Authentication is managed by the dashboard app. Users log in once at the dashboard and a shared HTTP‑only cookie (`token`) is set on the `.drugansdrums.com` domain. Because the cookie is scoped to the parent domain, every subdomain receives it automatically — no additional login is needed.

**Key facts:**

| Detail | Value |
|---|---|
| Auth provider | `https://dashboard.drugansdrums.com` |
| Cookie name | `token` |
| Cookie domain | `.drugansdrums.com` |
| Token format | JWT (HS256), signed with shared `JWT_SECRET` |
| Token lifetime | 7 days |
| JWT payload | `{ userId: number, role: string, iat, exp }` |
| User roles | `super_admin`, `admin`, `user` |

---

## Integration Steps

### 1. Verify the user on page load

On every page load (or on protected routes), call the dashboard verify endpoint. The browser will send the shared cookie automatically.

```js
const res = await fetch('https://dashboard.drugansdrums.com/api/auth/verify', {
  credentials: 'include',
});

if (res.ok) {
  const { user, token } = await res.json();
  // user  = { id, email, name, role }
  // token = { issuedAt, expiresAt }
  // → user is authenticated, proceed normally
} else {
  // → not authenticated, redirect to login (see step 2)
}
```

### 2. Redirect unauthenticated users to the dashboard login

When the verify call returns 401, redirect to the dashboard login page with a `redirect` query param set to the current page URL. After the user logs in, the dashboard will redirect them back.

```js
function redirectToLogin() {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href =
    `https://dashboard.drugansdrums.com/login?redirect=${returnUrl}`;
}
```

The dashboard login page validates the redirect URL — it will only redirect back to `https://*.drugansdrums.com` subdomains.

### 3. (Optional) Server‑side token verification

If your app has its own backend API and you want to verify the token server‑side without calling the dashboard, you can verify the JWT directly. Your backend must have access to the same `JWT_SECRET` environment variable used by the dashboard.

```js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  // Read from the shared cookie or from an Authorization header
  let token = req.cookies?.token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // payload = { userId, role, iat, exp }
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

If you also need the user's name and email server-side, call the dashboard verify endpoint from your backend:

```js
const res = await fetch('https://dashboard.drugansdrums.com/api/auth/verify', {
  headers: { Authorization: `Bearer ${token}` },
});
const { user } = await res.json();
// user = { id, email, name, role }
```

### 4. Role-based access control

The JWT `role` field is one of: `super_admin`, `admin`, or `user`. Use this to gate features:

```js
if (user.role === 'admin' || user.role === 'super_admin') {
  // allow admin features
}
```

### 5. Logout

To log the user out, redirect them to the dashboard. There is no cross-app logout endpoint to call — the dashboard clears the shared cookie.

```
https://dashboard.drugansdrums.com/login
```

---

## API Reference

All endpoints are on `https://dashboard.drugansdrums.com`.

### `GET /api/auth/verify`

Verify the current auth token. Accepts the shared cookie (sent automatically by the browser with `credentials: 'include'`) or an `Authorization: Bearer <token>` header.

**Success (200):**

```json
{
  "user": { "id": 1, "email": "will@example.com", "name": "Will", "role": "admin" },
  "token": { "issuedAt": "2026-04-01T00:00:00.000Z", "expiresAt": "2026-04-08T00:00:00.000Z" }
}
```

**Failure (401):**

```json
{ "error": "Not authenticated" }
```

### `GET /api/auth/me`

Same as verify but returns only the user object (no token metadata). Primarily used by the dashboard app itself.

**Success (200):**

```json
{
  "user": { "id": 1, "email": "will@example.com", "name": "Will", "role": "admin" }
}
```

---

## Minimal Frontend Example

A complete minimal integration for a Vue/React/vanilla JS app:

```js
const DASHBOARD = 'https://dashboard.drugansdrums.com';

async function checkAuth() {
  const res = await fetch(`${DASHBOARD}/api/auth/verify`, {
    credentials: 'include',
  });

  if (!res.ok) {
    // Not logged in — send to dashboard login, then come back here
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${DASHBOARD}/login?redirect=${returnUrl}`;
    return null;
  }

  const { user } = await res.json();
  return user; // { id, email, name, role }
}

// Call on app startup
const user = await checkAuth();
```

---

## Environment Variables

If your app verifies tokens server-side (step 3), set this env var to the same value the dashboard uses:

```
JWT_SECRET=<same secret as dashboard>
```

No other configuration is required. The cookie sharing is automatic via the browser.
