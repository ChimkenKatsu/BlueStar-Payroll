import { Router } from 'express';
import { readDb, writeDb } from '../lib/db.js';
import { hashPassword, verifyPassword, createSession, destroySession } from '../lib/auth.js';

const router = Router();

router.post('/login/admin', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const db = readDb();
  const row = db.admin.find((a) => String(a.username).trim() === username);

  if (!row) {
    return res.json({ success: false, message: 'Admin account not found.' });
  }
  if (!verifyPassword(password, row.password)) {
    return res.json({ success: false, message: 'Incorrect password.' });
  }

  // Auto-upgrade a plaintext password to a hash on first successful login.
  if (row.password === password) {
    row.password = hashPassword(password);
    writeDb(db);
  }

  const token = createSession('admin', username, username);
  res.json({ success: true, token, name: username });
});

router.post('/login/teacher', (req, res) => {
  const employeeId = String(req.body.employeeId || '').trim();
  const password = String(req.body.password || '');

  const db = readDb();
  const row = db.teachers.find((t) => String(t.employeeId).trim() === employeeId);

  if (!row) {
    return res.json({ success: false, message: 'Employee ID not found.' });
  }
  if (!verifyPassword(password, row.password)) {
    return res.json({ success: false, message: 'Incorrect password.' });
  }

  if (row.password === password) {
    row.password = hashPassword(password);
    writeDb(db);
  }

  const token = createSession('teacher', employeeId, row.name);
  res.json({ success: true, token, name: row.name, employeeId });
});

router.post('/logout', (req, res) => {
  destroySession(req.body.token);
  res.json({ success: true });
});

export default router;
