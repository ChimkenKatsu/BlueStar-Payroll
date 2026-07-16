export const STATUS_DRAFT = 'Draft';
export const STATUS_PUBLISHED = 'Published';

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function computeTotals(input) {
  const basicSalary = Number(input.basicSalary) || 0;
  const allowances = Number(input.allowances) || 0;
  const bonuses = Number(input.bonuses) || 0;
  const otherEarnings = Number(input.otherEarnings) || 0;

  const sss = Number(input.sss) || 0;
  const philhealth = Number(input.philhealth) || 0;
  const pagibig = Number(input.pagibig) || 0;
  const tax = Number(input.tax) || 0;
  const cashAdvance = Number(input.cashAdvance) || 0;
  const otherDeductions = Number(input.otherDeductions) || 0;

  const grossSalary = round2(basicSalary + allowances + bonuses + otherEarnings);
  const totalDeductions = round2(sss + philhealth + pagibig + tax + cashAdvance + otherDeductions);
  const netPay = round2(grossSalary - totalDeductions);

  return {
    basicSalary, allowances, bonuses, otherEarnings, grossSalary,
    sss, philhealth, pagibig, tax, cashAdvance, otherDeductions,
    totalDeductions, netPay
  };
}

export function generatePayrollId(existingCount) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const stamp = yy + mm;
  const nextNum = existingCount + 1;
  return 'PR-' + stamp + '-' + String(nextNum).padStart(4, '0');
}

export function getTeacherNameMap(teachers) {
  const map = {};
  teachers.forEach((t) => {
    map[String(t.employeeId).trim()] = t.name;
  });
  return map;
}

/** Attaches teacherName for display, matching the shape the old client expected. */
export function mapPayrollRecord(record, teacherNames) {
  const employeeId = String(record.employeeId).trim();
  return {
    ...record,
    employeeId,
    teacherName: teacherNames[employeeId] || '(Unknown)'
  };
}
