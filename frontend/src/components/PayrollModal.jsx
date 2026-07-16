import { useEffect, useState } from 'react';
import { moneyFmt } from '../utils.js';

const NUMERIC_FIELDS = [
  'basicSalary', 'allowances', 'bonuses', 'otherEarnings',
  'sss', 'philhealth', 'pagibig', 'tax', 'cashAdvance', 'otherDeductions'
];

const emptyForm = {
  employeeId: '', payrollPeriod: '', attendance: '', classTally: '',
  basicSalary: 0, allowances: 0, bonuses: 0, otherEarnings: 0,
  sss: 0, philhealth: 0, pagibig: 0, tax: 0, cashAdvance: 0, otherDeductions: 0
};

export default function PayrollModal({ open, editingRecord, teachers, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingRecord;

  useEffect(() => {
    if (!open) return;
    setForm(editingRecord ? { ...editingRecord } : emptyForm);
  }, [open, editingRecord]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function num(field) {
    return Number(form[field]) || 0;
  }

  function handleTeacherChange(employeeId) {
    const teacher = teachers.find((t) => t.employeeId === employeeId);
    setForm((f) => ({
      ...f,
      employeeId,
      // Prefill basic salary from the teacher's record, same as the original UI —
      // only when creating a new record, never overwrite an existing one.
      basicSalary: !isEdit && teacher ? teacher.basicSalary : f.basicSalary
    }));
  }

  const gross = NUMERIC_FIELDS.slice(0, 4).reduce((sum, f) => sum + num(f), 0);
  const deductions = NUMERIC_FIELDS.slice(4).reduce((sum, f) => sum + num(f), 0);
  const net = gross - deductions;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...form, payrollId: editingRecord?.payrollId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Payroll Record' : 'Create Payroll Record'}</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-section-title">Teacher &amp; Period</div>
              <div className="field-plain">
                <label>Teacher</label>
                <select
                  required
                  disabled={isEdit}
                  value={form.employeeId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t.employeeId} value={t.employeeId}>{t.name} ({t.employeeId})</option>
                  ))}
                </select>
              </div>
              <div className="field-plain">
                <label>Payroll Period</label>
                <input type="text" placeholder="e.g. July 1-15, 2026" required
                  value={form.payrollPeriod} onChange={(e) => set('payrollPeriod', e.target.value)} />
              </div>
              <div className="field-plain">
                <label>Attendance</label>
                <input type="text" placeholder="e.g. 10/10 days"
                  value={form.attendance} onChange={(e) => set('attendance', e.target.value)} />
              </div>
              <div className="field-plain">
                <label>Class Tally</label>
                <input type="text" placeholder="e.g. 42 classes"
                  value={form.classTally} onChange={(e) => set('classTally', e.target.value)} />
              </div>

              <div className="form-section-title">Earnings</div>
              <NumberField label="Basic Salary (PHP)" value={form.basicSalary} onChange={(v) => set('basicSalary', v)} />
              <NumberField label="Allowances (PHP)" value={form.allowances} onChange={(v) => set('allowances', v)} />
              <NumberField label="Bonuses (PHP)" value={form.bonuses} onChange={(v) => set('bonuses', v)} />
              <NumberField label="Other Earnings (PHP)" value={form.otherEarnings} onChange={(v) => set('otherEarnings', v)} />

              <div className="form-section-title">Deductions</div>
              <NumberField label="SSS (PHP)" value={form.sss} onChange={(v) => set('sss', v)} />
              <NumberField label="PhilHealth (PHP)" value={form.philhealth} onChange={(v) => set('philhealth', v)} />
              <NumberField label="Pag-IBIG (PHP)" value={form.pagibig} onChange={(v) => set('pagibig', v)} />
              <NumberField label="Tax (PHP)" value={form.tax} onChange={(v) => set('tax', v)} />
              <NumberField label="Cash Advance (PHP)" value={form.cashAdvance} onChange={(v) => set('cashAdvance', v)} />
              <NumberField label="Other Deductions (PHP)" value={form.otherDeductions} onChange={(v) => set('otherDeductions', v)} />
            </div>

            <div className="calc-summary">
              <div className="item"><div className="v">{moneyFmt(gross)}</div><div className="l">Gross Salary</div></div>
              <div className="item"><div className="v">{moneyFmt(deductions)}</div><div className="l">Total Deductions</div></div>
              <div className="item net"><div className="v">{moneyFmt(net)}</div><div className="l">Net Pay</div></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? <><span className="spinner"></span> Saving...</>
                : (isEdit ? 'Update Record' : 'Save Payroll Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="field-plain">
      <label>{label}</label>
      <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
