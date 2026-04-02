const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'dashboard.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'admin', 'user')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🔗',
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Seed default apps on first run
const appCount = db.prepare('SELECT COUNT(*) as count FROM apps').get();
if (appCount.count === 0) {
  const insert = db.prepare(
    'INSERT INTO apps (name, url, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  insert.run('Bundle Buyer', 'https://bundlebuyer.drugansdrums.com', '📦', 'Manage bundle purchasing and deals.', 0);
  insert.run('Counter Offer', 'https://counteroffer.drugansdrums.com', '🤝', 'Handle counter offers and negotiations.', 1);
  insert.run('Price Changer', 'https://pricechanger.drugansdrums.com', '💲', 'Update and manage product pricing.', 2);
}

module.exports = db;
