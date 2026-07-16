const BASE_URL = '/api';

/**
 * Thin fetch wrapper that plays the same role google.script.run played in
 * the Apps Script version: call a "server function" and get back JSON,
 * throwing on failure so callers can .catch() just like withFailureHandler.
 */
async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-session-token'] = token;

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || 'Something went wrong.');
  }
  return data;
}

export const api = {
  loginAdmin: (username, password) =>
    request('/auth/login/admin', { method: 'POST', body: { username, password } }),
  loginTeacher: (employeeId, password) =>
    request('/auth/login/teacher', { method: 'POST', body: { employeeId, password } }),
  logout: (token) => request('/auth/logout', { method: 'POST', body: { token } }),

  getAdminDashboard: (token) => request('/admin/dashboard', { token }),
  getTeachers: (token) => request('/admin/teachers', { token }),
  addTeacher: (token, teacher) => request('/admin/teachers', { method: 'POST', token, body: teacher }),
  updateTeacher: (token, teacher) =>
    request(`/admin/teachers/${encodeURIComponent(teacher.employeeId)}`, { method: 'PUT', token, body: teacher }),
  deleteTeacher: (token, employeeId) =>
    request(`/admin/teachers/${encodeURIComponent(employeeId)}`, { method: 'DELETE', token }),

  getPayrollRecords: (token) => request('/admin/payroll', { token }),
  createPayrollRecord: (token, record) => request('/admin/payroll', { method: 'POST', token, body: record }),
  updatePayrollRecord: (token, record) =>
    request(`/admin/payroll/${encodeURIComponent(record.payrollId)}`, { method: 'PUT', token, body: record }),
  deletePayrollRecord: (token, payrollId) =>
    request(`/admin/payroll/${encodeURIComponent(payrollId)}`, { method: 'DELETE', token }),
  publishPayslips: (token, payrollIds) =>
    request('/admin/payroll/publish', { method: 'POST', token, body: { payrollIds } }),

  getTeacherProfile: (token) => request('/teacher/profile', { token }),
  getMyPayrollRecords: (token) => request('/teacher/payroll', { token }),

  downloadPayslipPdf: (token, payrollId) =>
    request(`/payslip/${encodeURIComponent(payrollId)}/pdf`, { token })
};
