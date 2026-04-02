require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const appsRoutes = require('./routes/apps');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse allowed origins from env
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return cb(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.drugansdrums.com')
      ) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/apps', appsRoutes);

// Serve Vue client if dist exists
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});
