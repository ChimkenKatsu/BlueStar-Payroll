import { Router } from 'express';
import { readDb } from '../lib/db.js';
import { requireRole } from '../middleware/requireRole.js';
import { STATUS_PUBLISHED, getTeacherNameMap, mapPayrollRecord } from '../lib/payroll.js';

const router = Router();
router.use(requireRole('teacher'));

router.get('/profile', (req, res) => {
  const db = readDb();
  const teacher = db.teachers.find((t) => String(t.employeeId).trim() === req.session.id);
  if (!teacher) return res.status(404).json({ message: 'Teacher record not found.' });
  res.json({ employeeId: teacher.employeeId, name: teacher.name });
});

router.get('/payroll', (req, res) => {
  const db = readDb();
  const teacherNames = getTeacherNameMap(db.teachers);

  const records = db.payroll
    .filter((r) => String(r.employeeId).trim() === req.session.id && r.status === STATUS_PUBLISHED)
    .map((r) => mapPayrollRecord(r, teacherNames))
    .reverse();

  res.json(records);
});

export default router;
