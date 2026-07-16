import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSession } from '../context/SessionContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { moneyFmt, initials, triggerPdfDownload, printPayslip } from '../utils.js';

export default function TeacherPortal() {
  const { session, logout } = useSession();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const handleServerError = useCallback((err) => {
    if (err.message === 'SESSION_EXPIRED') {
      showToast('Your session has expired. Please sign in again.', 'error');
      logout();
      return;
    }
    showToast(err.message || 'Something went wrong.', 'error');
  }, [showToast, logout]);

  useEffect(() => {
    api.getMyPayrollRecords(session.token)
      .then((res) => { setRecords(res || []); setLoaded(true); })
      .catch(handleServerError);
  }, [session.token, handleServerError]);

  const record = records[index];

  async function downloadMyPayslip() {
    if (!record) return;
    showToast('Preparing PDF...', '');
    try {
      const res = await api.downloadPayslipPdf(session.token, record.payrollId);
      triggerPdfDownload(res);
    } catch (err) {
      handleServerError(err);
    }
  }

  function printMyPayslip() {
    if (!record) return;
    printPayslip(record);
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="mark"><i className="fa-solid fa-star"></i></div>
          <div className="name">Blue Star<span>Teacher Portal</span></div>
        </div>

        <nav className="nav-group">
          <button className="nav-item active">
            <i className="fa-solid fa-money-check-dollar"></i> My Payslip
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(session.name)}</div>
            <div className="who">
              <div className="n">{session.name || 'Teacher'}</div>
              <div className="r">{session.employeeId || ''}</div>
            </div>
          </div>
          <button className="nav-item" style={{ color: 'var(--danger)', marginTop: 6 }} onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><i className="fa-solid fa-bars"></i></button>
          <div>
            <h2>My Payslip</h2>
            <div className="sub">Your latest published payroll information</div>
          </div>
          {records.length > 1 && (
            <select
              style={{ padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {records.map((r, i) => <option key={r.payrollId} value={i}>{r.payrollPeriod}</option>)}
            </select>
          )}
        </div>

        {loaded && records.length === 0 && (
          <div className="view">
            <div className="panel">
              <div className="panel-body">
                <div className="empty-state">
                  <i className="fa-solid fa-file-circle-xmark"></i>
                  <p>No published payslips yet. Please check back once HR releases your payroll.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {record && (
          <div className="view">
            <div className="profile-strip">
              <div className="avatar-lg">{initials(record.teacherName)}</div>
              <div className="info">
                <h3>{record.teacherName}</h3>
                <div className="id-tag">Employee ID: {record.employeeId}</div>
              </div>
              <div className="period-tag">{record.payrollPeriod}</div>
            </div>

            <div className="net-pay-card">
              <div className="label">Net Pay</div>
              <div className="amount">{moneyFmt(record.netPay)}</div>
              <div className="sub">Released on {record.releaseDate || '-'}</div>
              <div className="actions">
                <button className="btn btn-white" onClick={downloadMyPayslip}><i className="fa-solid fa-download"></i> Download Payslip (PDF)</button>
                <button className="btn btn-outline-white" onClick={printMyPayslip}><i className="fa-solid fa-print"></i> Print Payslip</button>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 18 }}>
              <div className="panel-header"><h3>Payroll Information</h3></div>
              <div className="panel-body">
                <ul className="breakdown-list">
                  <li><span>Payroll Period</span><span className="val">{record.payrollPeriod || '-'}</span></li>
                  <li><span>Attendance</span><span className="val">{record.attendance || '-'}</span></li>
                  <li><span>Class Tally</span><span className="val">{record.classTally || '-'}</span></li>
                </ul>
              </div>
            </div>

            <div className="breakdown-grid">
              <div className="panel">
                <div className="panel-header"><h3>Salary Breakdown</h3></div>
                <div className="panel-body">
                  <ul className="breakdown-list">
                    <li><span>Basic Salary</span><span className="val earn">{moneyFmt(record.basicSalary)}</span></li>
                    <li><span>Allowances</span><span className="val earn">{moneyFmt(record.allowances)}</span></li>
                    <li><span>Bonuses</span><span className="val earn">{moneyFmt(record.bonuses)}</span></li>
                    <li><span>Other Earnings</span><span className="val earn">{moneyFmt(record.otherEarnings)}</span></li>
                    <li className="total"><span>Gross Salary</span><span className="val">{moneyFmt(record.grossSalary)}</span></li>
                  </ul>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header"><h3>Deductions</h3></div>
                <div className="panel-body">
                  <ul className="breakdown-list">
                    <li><span>SSS</span><span className="val ded">{moneyFmt(record.sss)}</span></li>
                    <li><span>PhilHealth</span><span className="val ded">{moneyFmt(record.philhealth)}</span></li>
                    <li><span>Pag-IBIG</span><span className="val ded">{moneyFmt(record.pagibig)}</span></li>
                    <li><span>Tax</span><span className="val ded">{moneyFmt(record.tax)}</span></li>
                    <li><span>Cash Advance</span><span className="val ded">{moneyFmt(record.cashAdvance)}</span></li>
                    <li><span>Other Deductions</span><span className="val ded">{moneyFmt(record.otherDeductions)}</span></li>
                    <li className="total"><span>Total Deductions</span><span className="val">{moneyFmt(record.totalDeductions)}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
