import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useSession } from '../context/SessionContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { moneyFmt, initials, triggerPdfDownload } from '../utils.js';
import TeacherModal from '../components/TeacherModal.jsx';
import PayrollModal from '../components/PayrollModal.jsx';

const VIEW_TITLES = {
  dashboard: ['Dashboard', 'Overview of your payroll system'],
  teachers: ['Teachers', 'Manage teacher accounts and credentials'],
  payroll: ['Payroll Records', 'Create, edit, and publish payroll']
};

export default function AdminPortal() {
  const { session, logout } = useSession();
  const { showToast } = useToast();

  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboard, setDashboard] = useState({ totalTeachers: 0, totalPayrollRecords: 0, publishedPayslips: 0, pendingPayslips: 0 });
  const [teachers, setTeachers] = useState([]);
  const [payroll, setPayroll] = useState([]);

  const [teacherSearch, setTeacherSearch] = useState('');
  const [payrollSearch, setPayrollSearch] = useState('');
  const [selectedPayrollIds, setSelectedPayrollIds] = useState(new Set());

  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);

  const handleServerError = useCallback((err) => {
    if (err.message === 'SESSION_EXPIRED') {
      showToast('Your session has expired. Please sign in again.', 'error');
      logout();
      return;
    }
    showToast(err.message || 'Something went wrong.', 'error');
  }, [showToast, logout]);

  const loadAdminData = useCallback(() => {
    api.getAdminDashboard(session.token).then(setDashboard).catch(handleServerError);
    api.getTeachers(session.token).then(setTeachers).catch(handleServerError);
    api.getPayrollRecords(session.token).then(setPayroll).catch(handleServerError);
  }, [session.token, handleServerError]);

  useEffect(() => { loadAdminData(); }, [loadAdminData]);

  // ---------------- Teacher management ----------------
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase();
    return teachers.filter((t) => t.employeeId.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [teachers, teacherSearch]);

  function openTeacherModal(employeeId) {
    setEditingTeacher(employeeId ? teachers.find((t) => t.employeeId === employeeId) : null);
    setTeacherModalOpen(true);
  }

  async function submitTeacherForm(payload) {
    try {
      if (editingTeacher) {
        await api.updateTeacher(session.token, payload);
        showToast('Teacher updated successfully.', 'success');
      } else {
        await api.addTeacher(session.token, payload);
        showToast('Teacher added successfully.', 'success');
      }
      setTeacherModalOpen(false);
      loadAdminData();
    } catch (err) {
      handleServerError(err);
      throw err;
    }
  }

  async function confirmDeleteTeacher(employeeId) {
    if (!window.confirm(`Delete teacher ${employeeId}? This cannot be undone.`)) return;
    try {
      await api.deleteTeacher(session.token, employeeId);
      showToast('Teacher deleted.', 'success');
      loadAdminData();
    } catch (err) {
      handleServerError(err);
    }
  }

  // ---------------- Payroll management ----------------
  const filteredPayroll = useMemo(() => {
    const q = payrollSearch.toLowerCase();
    return payroll.filter((r) =>
      r.teacherName.toLowerCase().includes(q) || r.payrollPeriod.toLowerCase().includes(q) || r.payrollId.toLowerCase().includes(q));
  }, [payroll, payrollSearch]);

  function toggleSelect(payrollId, checked) {
    setSelectedPayrollIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(payrollId); else next.delete(payrollId);
      return next;
    });
  }

  function toggleSelectAll(checked) {
    if (!checked) { setSelectedPayrollIds(new Set()); return; }
    setSelectedPayrollIds(new Set(filteredPayroll.filter((r) => r.status !== 'Published').map((r) => r.payrollId)));
  }

  function openPayrollModal(payrollId) {
    setEditingPayroll(payrollId ? payroll.find((r) => r.payrollId === payrollId) : null);
    setPayrollModalOpen(true);
  }

  async function submitPayrollForm(payload) {
    try {
      if (editingPayroll) {
        await api.updatePayrollRecord(session.token, payload);
        showToast('Payroll record updated.', 'success');
      } else {
        await api.createPayrollRecord(session.token, payload);
        showToast('Payroll record created.', 'success');
      }
      setPayrollModalOpen(false);
      loadAdminData();
    } catch (err) {
      handleServerError(err);
      throw err;
    }
  }

  async function confirmDeletePayroll(payrollId) {
    if (!window.confirm(`Delete payroll record ${payrollId}? This cannot be undone.`)) return;
    try {
      await api.deletePayrollRecord(session.token, payrollId);
      showToast('Payroll record deleted.', 'success');
      loadAdminData();
    } catch (err) {
      handleServerError(err);
    }
  }

  async function publishSelected() {
    const ids = Array.from(selectedPayrollIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Publish ${ids.length} payslip(s)? Teachers will be able to view and download them immediately.`)) return;
    try {
      const res = await api.publishPayslips(session.token, ids);
      showToast(`${res.count} payslip(s) published.`, 'success');
      setSelectedPayrollIds(new Set());
      loadAdminData();
    } catch (err) {
      handleServerError(err);
    }
  }

  async function downloadPayslip(payrollId) {
    showToast('Preparing PDF...', '');
    try {
      const res = await api.downloadPayslipPdf(session.token, payrollId);
      triggerPdfDownload(res);
    } catch (err) {
      handleServerError(err);
    }
  }

  function goToView(v) {
    setView(v);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="mark"><i className="fa-solid fa-star"></i></div>
          <div className="name">Blue Star<span>HR Admin Portal</span></div>
        </div>

        <nav className="nav-group">
          {Object.keys(VIEW_TITLES).map((v) => (
            <button key={v} className={`nav-item ${view === v ? 'active' : ''}`} onClick={() => goToView(v)}>
              <i className={`fa-solid ${v === 'dashboard' ? 'fa-gauge-high' : v === 'teachers' ? 'fa-people-group' : 'fa-file-invoice-dollar'}`}></i>
              {v === 'dashboard' ? 'Dashboard' : v === 'teachers' ? 'Teachers' : 'Payroll Records'}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials(session.name)}</div>
            <div className="who">
              <div className="n">{session.name || 'Admin'}</div>
              <div className="r">Administrator</div>
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
            <h2>{VIEW_TITLES[view][0]}</h2>
            <div className="sub">{VIEW_TITLES[view][1]}</div>
          </div>
        </div>

        {view === 'dashboard' && (
          <DashboardView
            dashboard={dashboard}
            payroll={payroll}
            onAddTeacher={() => openTeacherModal(null)}
            onCreatePayroll={() => { goToView('payroll'); openPayrollModal(null); }}
            onFocusPublish={() => goToView('payroll')}
          />
        )}

        {view === 'teachers' && (
          <TeachersView
            teachers={filteredTeachers}
            search={teacherSearch}
            onSearch={setTeacherSearch}
            onAdd={() => openTeacherModal(null)}
            onEdit={openTeacherModal}
            onDelete={confirmDeleteTeacher}
          />
        )}

        {view === 'payroll' && (
          <PayrollView
            records={filteredPayroll}
            search={payrollSearch}
            onSearch={setPayrollSearch}
            selectedIds={selectedPayrollIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onPublishSelected={publishSelected}
            onCreate={() => openPayrollModal(null)}
            onEdit={openPayrollModal}
            onDelete={confirmDeletePayroll}
            onDownload={downloadPayslip}
          />
        )}
      </main>

      <TeacherModal
        open={teacherModalOpen}
        editingTeacher={editingTeacher}
        onClose={() => setTeacherModalOpen(false)}
        onSubmit={submitTeacherForm}
      />
      <PayrollModal
        open={payrollModalOpen}
        editingRecord={editingPayroll}
        teachers={teachers}
        onClose={() => setPayrollModalOpen(false)}
        onSubmit={submitPayrollForm}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const published = status === 'Published';
  return (
    <span className={`badge ${published ? 'published' : 'draft'}`}>
      <i className={`fa-solid ${published ? 'fa-circle-check' : 'fa-clock'}`}></i>{status}
    </span>
  );
}

function DashboardView({ dashboard, payroll, onAddTeacher, onCreatePayroll, onFocusPublish }) {
  const recent = payroll.slice(0, 5);
  return (
    <section className="view">
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="icon"><i className="fa-solid fa-people-group"></i></div>
          <div className="val">{dashboard.totalTeachers}</div>
          <div className="label">Total Teachers</div>
        </div>
        <div className="stat-card purple">
          <div className="icon"><i className="fa-solid fa-file-lines"></i></div>
          <div className="val">{dashboard.totalPayrollRecords}</div>
          <div className="label">Total Payroll Records</div>
        </div>
        <div className="stat-card green">
          <div className="icon"><i className="fa-solid fa-circle-check"></i></div>
          <div className="val">{dashboard.publishedPayslips}</div>
          <div className="label">Published Payslips</div>
        </div>
        <div className="stat-card orange">
          <div className="icon"><i className="fa-solid fa-clock"></i></div>
          <div className="val">{dashboard.pendingPayslips}</div>
          <div className="label">Pending Payslips</div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn" onClick={onAddTeacher}>
          <div className="icon"><i className="fa-solid fa-user-plus"></i></div>
          <div><div className="t">Add Teacher</div><div className="d">Create a new teacher account</div></div>
        </button>
        <button className="quick-action-btn" onClick={onCreatePayroll}>
          <div className="icon"><i className="fa-solid fa-plus"></i></div>
          <div><div className="t">Create Payroll</div><div className="d">Add a new payroll record</div></div>
        </button>
        <button className="quick-action-btn" onClick={onFocusPublish}>
          <div className="icon"><i className="fa-solid fa-paper-plane"></i></div>
          <div><div className="t">Publish Payslips</div><div className="d">Release payslips to teachers</div></div>
        </button>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Recent Payroll Records</h3></div>
        <div className="panel-body table-wrap">
          <table className="data-table">
            <thead><tr><th>Payroll ID</th><th>Teacher</th><th>Period</th><th>Net Pay</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.payrollId}>
                  <td>{r.payrollId}</td>
                  <td>{r.teacherName}</td>
                  <td>{r.payrollPeriod}</td>
                  <td>{moneyFmt(r.netPay)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && (
            <div className="empty-state"><i className="fa-solid fa-inbox"></i><p>No payroll records yet.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}

function TeachersView({ teachers, search, onSearch, onAdd, onEdit, onDelete }) {
  return (
    <section className="view">
      <div className="panel">
        <div className="panel-header">
          <h3>Teacher Accounts</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-input">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input type="text" placeholder="Search teachers..." value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={onAdd}><i className="fa-solid fa-user-plus"></i> Add Teacher</button>
          </div>
        </div>
        <div className="panel-body table-wrap">
          <table className="data-table">
            <thead><tr><th>Employee ID</th><th>Teacher Name</th><th>Basic Salary</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.employeeId}>
                  <td><strong>{t.employeeId}</strong></td>
                  <td>{t.name}</td>
                  <td>{moneyFmt(t.basicSalary)}</td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn" title="Edit" onClick={() => onEdit(t.employeeId)}><i className="fa-solid fa-pen"></i></button>
                      <button className="icon-btn danger" title="Delete" onClick={() => onDelete(t.employeeId)}><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && (
            <div className="empty-state"><i className="fa-solid fa-people-group"></i><p>No teachers added yet. Click "Add Teacher" to get started.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}

function PayrollView({ records, search, onSearch, selectedIds, onToggleSelect, onToggleSelectAll, onPublishSelected, onCreate, onEdit, onDelete, onDownload }) {
  const anySelected = selectedIds.size > 0;
  return (
    <section className="view">
      <div className="panel">
        <div className="panel-header">
          <h3>Payroll Records</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input type="text" placeholder="Search by teacher or period..." value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <button className="btn btn-outline btn-sm" disabled={!anySelected} onClick={onPublishSelected}>
              <i className="fa-solid fa-paper-plane"></i> Publish Selected
            </button>
            <button className="btn btn-primary btn-sm" onClick={onCreate}><i className="fa-solid fa-plus"></i> Create Payroll</button>
          </div>
        </div>
        <div className="panel-body table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={(e) => onToggleSelectAll(e.target.checked)} /></th>
                <th>Payroll ID</th><th>Teacher</th><th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const canSelect = r.status !== 'Published';
                return (
                  <tr key={r.payrollId}>
                    <td>
                      <input type="checkbox" disabled={!canSelect} checked={selectedIds.has(r.payrollId)}
                        onChange={(e) => onToggleSelect(r.payrollId, e.target.checked)} />
                    </td>
                    <td>{r.payrollId}</td>
                    <td>{r.teacherName}</td>
                    <td>{r.payrollPeriod}</td>
                    <td>{moneyFmt(r.grossSalary)}</td>
                    <td>{moneyFmt(r.totalDeductions)}</td>
                    <td><strong>{moneyFmt(r.netPay)}</strong></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" title="Edit" onClick={() => onEdit(r.payrollId)}><i className="fa-solid fa-pen"></i></button>
                        <button className="icon-btn" title="Download PDF" onClick={() => onDownload(r.payrollId)}><i className="fa-solid fa-download"></i></button>
                        <button className="icon-btn danger" title="Delete" onClick={() => onDelete(r.payrollId)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="empty-state"><i className="fa-solid fa-file-invoice-dollar"></i><p>No payroll records yet. Click "Create Payroll" to get started.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}
