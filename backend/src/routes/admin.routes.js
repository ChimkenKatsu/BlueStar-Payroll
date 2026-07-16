import { Router } from 'express';
import { readDb, writeDb } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  STATUS_DRAFT, STATUS_PUBLISHED,
  computeTotals, generatePayrollId, getTeacherNameMap, mapPayrollRecord
} from '../lib/payroll.js';

const router = Router();
router.use(requireRole('admin'));

// ------------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------------
router.get('/dashboard', (req, res) => {
  const db = readDb();
  const published = db.payroll.filter((r) => r.status === STATUS_PUBLISHED).length;
  const pending = db.payroll.filter((r) => r.status === STATUS_DRAFT).length;

  res.json({
    totalTeachers: db.teachers.length,
    totalPayrollRecords: db.payroll.length,
    publishedPayslips: published,
    pendingPayslips: pending
  });
});

// ------------------------------------------------------------------
// TEACHER MANAGEMENT
// ------------------------------------------------------------------
router.get('/teachers', (req, res) => {
  const db = readDb();
  res.json(db.teachers.map((t) => ({
    employeeId: t.employeeId,
    name: t.name,
    basicSalary: Number(t.basicSalary) || 0
  })));
});

router.post('/teachers', (req, res) => {
  const { employeeId: rawId, name: rawName, password, basicSalary } = req.body;
  const employeeId = String(rawId || '').trim();
  const name = String(rawName || '').trim();

  if (!employeeId || !name || !password) {
    return res.status(400).json({ message: 'Employee ID, name, and password are required.' });
  }

  const db = readDb();
  if (db.teachers.some((t) => String(t.employeeId).trim() === employeeId)) {
    return res.status(400).json({ message: 'An account with this Employee ID already exists.' });
  }

  db.teachers.push({
    employeeId,
    password: hashPassword(String(password)),
    name,
    basicSalary: Number(basicSalary) || 0
  });
  writeDb(db);
  res.json({ success: true });
});

router.put('/teachers/:employeeId', (req, res) => {
  const employeeId = String(req.params.employeeId || '').trim();
  const db = readDb();
  const teacher = db.teachers.find((t) => String(t.employeeId).trim() === employeeId);
  if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

  const { name, basicSalary, password } = req.body;
  if (name) teacher.name = String(name).trim();
  if (basicSalary !== undefined && basicSalary !== '') teacher.basicSalary = Number(basicSalary) || 0;
  if (password) teacher.password = hashPassword(String(password));

  writeDb(db);
  res.json({ success: true });
});

router.delete('/teachers/:employeeId', (req, res) => {
  const employeeId = String(req.params.employeeId || '').trim();
  const db = readDb();
  const index = db.teachers.findIndex((t) => String(t.employeeId).trim() === employeeId);
  if (index === -1) return res.status(404).json({ message: 'Teacher not found.' });

  db.teachers.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

// ------------------------------------------------------------------
// PAYROLL MANAGEMENT
// ------------------------------------------------------------------
router.get('/payroll', (req, res) => {
  const db = readDb();
  const teacherNames = getTeacherNameMap(db.teachers);
  const records = db.payroll.map((r) => mapPayrollRecord(r, teacherNames)).reverse(); // newest first
  res.json(records);
});

router.post('/payroll', (req, res) => {
  const record = req.body;
  const employeeId = String(record.employeeId || '').trim();
  if (!employeeId) return res.status(400).json({ message: 'Please select a teacher.' });

  const db = readDb();
  if (!db.teachers.some((t) => String(t.employeeId).trim() === employeeId)) {
    return res.status(400).json({ message: 'Selected teacher does not exist.' });
  }

  const totals = computeTotals(record);
  const payrollId = generatePayrollId(db.payroll.length);

  db.payroll.push({
    payrollId,
    employeeId,
    payrollPeriod: record.payrollPeriod || '',
    attendance: record.attendance || '',
    classTally: record.classTally || '',
    ...totals,
    releaseDate: '',
    status: STATUS_DRAFT
  });
  writeDb(db);

  res.json({ success: true, payrollId, grossSalary: totals.grossSalary, totalDeductions: totals.totalDeductions, netPay: totals.netPay });
});

router.put('/payroll/:payrollId', (req, res) => {
  const payrollId = String(req.params.payrollId || '').trim();
  const db = readDb();
  const existing = db.payroll.find((r) => String(r.payrollId) === payrollId);
  if (!existing) return res.status(404).json({ message: 'Payroll record not found.' });

  const record = req.body;
  const totals = computeTotals(record);

  existing.payrollPeriod = record.payrollPeriod || '';
  existing.attendance = record.attendance || '';
  existing.classTally = record.classTally || '';
  Object.assign(existing, totals);

  writeDb(db);
  res.json({ success: true, grossSalary: totals.grossSalary, totalDeductions: totals.totalDeductions, netPay: totals.netPay });
});

router.delete('/payroll/:payrollId', (req, res) => {
  const payrollId = String(req.params.payrollId || '').trim();
  const db = readDb();
  const index = db.payroll.findIndex((r) => String(r.payrollId) === payrollId);
  if (index === -1) return res.status(404).json({ message: 'Payroll record not found.' });

  db.payroll.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

router.post('/payroll/publish', (req, res) => {
  const payrollIds = Array.isArray(req.body.payrollIds) ? req.body.payrollIds : [];
  if (payrollIds.length === 0) return res.status(400).json({ message: 'No payslips selected.' });

  const idSet = new Set(payrollIds.map(String));
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);

  let count = 0;
  db.payroll.forEach((r) => {
    if (idSet.has(String(r.payrollId))) {
      r.status = STATUS_PUBLISHED;
      r.releaseDate = today;
      count++;
    }
  });
  writeDb(db);
  res.json({ success: true, count });
});

export default router;
