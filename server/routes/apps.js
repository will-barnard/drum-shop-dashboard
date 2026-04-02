const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/apps — all authenticated users
router.get('/', (_req, res) => {
  const apps = db.prepare('SELECT * FROM apps ORDER BY sort_order, id').all();
  res.json({ apps });
});

// POST /api/apps — admin+
router.post('/', requireRole('admin', 'super_admin'), (req, res) => {
  const { name, url, icon, description, sort_order } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  const result = db
    .prepare(
      'INSERT INTO apps (name, url, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, url, icon || '🔗', description || '', sort_order ?? 0);
  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ app });
});

// PUT /api/apps/:id — admin+
router.put('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const id = Number(req.params.id);
  const { name, url, icon, description, sort_order } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }
  const existing = db.prepare('SELECT id FROM apps WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'App not found' });

  db.prepare(
    `UPDATE apps SET name=?, url=?, icon=?, description=?, sort_order=?, updated_at=datetime('now') WHERE id=?`
  ).run(name, url, icon || '🔗', description || '', sort_order ?? 0, id);

  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
  res.json({ app });
});

// DELETE /api/apps/:id — admin+
router.delete('/:id', requireRole('admin', 'super_admin'), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM apps WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'App not found' });

  db.prepare('DELETE FROM apps WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
