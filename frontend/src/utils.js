export function moneyFmt(n) {
  return 'PHP ' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
}

export function triggerPdfDownload({ fileName, base64 }) {
  const link = document.createElement('a');
  link.href = 'data:application/pdf;base64,' + base64;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Prints a payslip via a hidden #printArea div, same approach as the original app. */
export function printPayslip(record) {
  const row = (l1, v1, l2, v2) =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;"><b>${l1}</b></td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtml(v1)}</td>` +
    `<td style="padding:6px 8px;border-bottom:1px solid #eee;"><b>${l2}</b></td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${escapeHtml(v2)}</td></tr>`;

  const section = (title, rows) =>
    `<table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:13px;">` +
    `<tr><td colspan="2" style="background:#1E88E5;color:#fff;font-weight:bold;padding:6px 8px;">${title}</td></tr>` +
    rows.map(([label, value, bold]) =>
      `<tr${bold ? ' style="font-weight:bold;"' : ''}><td style="padding:6px 8px;border-bottom:1px solid #eee;">${label}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;">${moneyFmt(value)}</td></tr>`
    ).join('') + '</table>';

  const html =
    `<div style="font-family:Poppins,Arial,sans-serif;max-width:640px;margin:0 auto;">` +
    `<h2 style="color:#1E88E5;margin-bottom:0;">Blue Star Teacher Payroll Management System</h2>` +
    `<p style="color:#666;margin-top:4px;">Official Payslip</p>` +
    `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">` +
    row('Teacher Name', record.teacherName, 'Employee ID', record.employeeId) +
    row('Payroll Period', record.payrollPeriod, 'Release Date', record.releaseDate || '-') +
    row('Attendance', record.attendance, 'Class Tally', record.classTally) +
    `</table>` +
    section('EARNINGS', [
      ['Basic Salary', record.basicSalary], ['Allowances', record.allowances], ['Bonuses', record.bonuses],
      ['Other Earnings', record.otherEarnings], ['Gross Salary', record.grossSalary, true]
    ]) +
    section('DEDUCTIONS', [
      ['SSS', record.sss], ['PhilHealth', record.philhealth], ['Pag-IBIG', record.pagibig], ['Tax', record.tax],
      ['Cash Advance', record.cashAdvance], ['Other Deductions', record.otherDeductions], ['Total Deductions', record.totalDeductions, true]
    ]) +
    `<div style="background:#E3F2FD;padding:16px;margin-top:16px;border-radius:8px;text-align:center;">` +
    `<div style="font-size:12px;color:#555;">NET PAY</div>` +
    `<div style="font-size:26px;color:#1E88E5;font-weight:800;">${moneyFmt(record.netPay)}</div>` +
    `</div></div>`;

  const printArea = document.getElementById('printArea');
  printArea.innerHTML = html;
  window.print();
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
