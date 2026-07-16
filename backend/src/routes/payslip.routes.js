import { Router } from 'express';
import { readDb } from '../lib/db.js';
import { attachSession } from '../middleware/requireRole.js';
import { getTeacherNameMap, mapPayrollRecord, STATUS_PUBLISHED } from '../lib/payroll.js';
import { buildPayslipPdf } from '../lib/pdf.js';

const router = Router();

router.get('/:payrollId/pdf', attachSession, async (req, res) => {
  const session = req.session;
  if (!session) return res.status(401).json({ message: 'SESSION_EXPIRED' });

  const db = readDb();
  const teacherNames = getTeacherNameMap(db.teachers);
  const record = db.payroll
    .map((r) => mapPayrollRecord(r, teacherNames))
    .find((r) => String(r.payrollId) === String(req.params.payrollId));

  if (!record) return res.status(404).json({ message: 'Payslip not found.' });

  if (session.role === 'teacher' && record.employeeId !== session.id) {
    return res.status(403).json({ message: 'UNAUTHORIZED' });
  }
  if (session.role === 'teacher' && record.status !== STATUS_PUBLISHED) {
    return res.status(400).json({ message: 'This payslip has not been published yet.' });
  }

  try {
    const pdfBuffer = await buildPayslipPdf(record);
    const fileName = `Payslip_${record.employeeId}_${String(record.payrollPeriod).replace(/\s+/g, '_')}.pdf`;
    res.json({ fileName, base64: pdfBuffer.toString('base64') });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

export default router;
