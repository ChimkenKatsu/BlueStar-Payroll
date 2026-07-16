import PDFDocument from 'pdfkit';

const BRAND_BLUE = '#1E88E5';
const TEXT_MAIN = '#1A2233';
const TEXT_MUTED = '#6B7789';
const NET_PAY_BG = '#E3F2FD';

function money(n) {
  return 'PHP ' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sectionTable(doc, title, rows) {
  const startX = doc.x;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.moveDown(0.6);
  doc.rect(startX, doc.y, width, 20).fill(BRAND_BLUE);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
    .text(title, startX + 8, doc.y + 5);
  doc.moveDown(1.1);

  rows.forEach(([label, value, bold]) => {
    const y = doc.y;
    doc.fillColor(TEXT_MAIN).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
    doc.text(label, startX + 8, y, { continued: false });
    doc.text(money(value), startX + 8, y, { width, align: 'right' });
    doc.moveTo(startX, doc.y + 2).lineTo(startX + width, doc.y + 2).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5);
  });
}

/**
 * Builds a payslip PDF and returns it as a Buffer.
 * Mirrors the layout of buildPayslipHtml_() from the original Code.gs,
 * translated from an HTML-to-PDF blob conversion into direct PDFKit drawing.
 */
export function buildPayslipPdf(record) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor(BRAND_BLUE).font('Helvetica-Bold').fontSize(18)
      .text('Blue Star Teacher Payroll Management System');
    doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(11).text('Official Payslip');
    doc.moveDown(1);

    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;
    const pairs = [
      ['Teacher Name', record.teacherName, 'Employee ID', record.employeeId],
      ['Payroll Period', record.payrollPeriod, 'Release Date', record.releaseDate || '-'],
      ['Attendance', record.attendance, 'Class Tally', record.classTally]
    ];
    pairs.forEach(([l1, v1, l2, v2]) => {
      const y = doc.y;
      doc.fillColor(TEXT_MAIN).font('Helvetica-Bold').fontSize(10).text(l1, startX, y, { width: width / 4 });
      doc.font('Helvetica').text(String(v1 ?? ''), startX + width / 4, y, { width: width / 4 });
      doc.font('Helvetica-Bold').text(l2, startX + width / 2, y, { width: width / 4 });
      doc.font('Helvetica').text(String(v2 ?? ''), startX + (width * 3) / 4, y, { width: width / 4 });
      doc.moveDown(0.9);
    });

    sectionTable(doc, 'EARNINGS', [
      ['Basic Salary', record.basicSalary],
      ['Allowances', record.allowances],
      ['Bonuses', record.bonuses],
      ['Other Earnings', record.otherEarnings],
      ['Gross Salary', record.grossSalary, true]
    ]);

    sectionTable(doc, 'DEDUCTIONS', [
      ['SSS', record.sss],
      ['PhilHealth', record.philhealth],
      ['Pag-IBIG', record.pagibig],
      ['Tax', record.tax],
      ['Cash Advance', record.cashAdvance],
      ['Other Deductions', record.otherDeductions],
      ['Total Deductions', record.totalDeductions, true]
    ]);

    doc.moveDown(0.8);
    const boxY = doc.y;
    doc.roundedRect(startX, boxY, width, 70, 10).fill(NET_PAY_BG);
    doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(10)
      .text('NET PAY', startX, boxY + 14, { width, align: 'center' });
    doc.fillColor(BRAND_BLUE).font('Helvetica-Bold').fontSize(22)
      .text(money(record.netPay), startX, boxY + 30, { width, align: 'center' });

    doc.end();
  });
}
