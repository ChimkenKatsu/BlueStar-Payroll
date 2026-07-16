import { useState } from 'react';
import { api } from '../api.js';
import { useSession } from '../context/SessionContext.jsx';

export default function Login() {
  const [tab, setTab] = useState('admin');
  const { persistSession } = useSession();

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><i className="fa-solid fa-star"></i></div>
        <h1>Blue Star Teacher Payroll<br />Management System</h1>
        <p className="subtitle">
          This Teacher Payroll Management System provides teachers with a secure and convenient way to
          access their payroll information online. Teachers can log in using their assigned Employee ID
          and Password to view their attendance, class tally, salary breakdown, deductions, and payslips.
        </p>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>
            <i className="fa-solid fa-user-shield"></i>&nbsp; Admin Login
          </button>
          <button className={`login-tab ${tab === 'teacher' ? 'active' : ''}`} onClick={() => setTab('teacher')}>
            <i className="fa-solid fa-chalkboard-user"></i>&nbsp; Teacher Login
          </button>
        </div>

        {tab === 'admin'
          ? <AdminLoginForm persistSession={persistSession} />
          : <TeacherLoginForm persistSession={persistSession} />}
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-wrap">
      <i className="fa-solid fa-lock"></i>

      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete="current-password"
        value={value}
        onChange={onChange}
        required
      />

      <button
        type="button"
        className="toggle-pass"
        onClick={() => setVisible(!visible)}
      >
        <i className={`fa-solid ${visible ? "fa-eye-slash" : "fa-eye"}`}></i>
      </button>
    </div>
  );
}

function AdminLoginForm({ persistSession }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.loginAdmin(username.trim(), password);
      if (res.success) {
        persistSession('admin', res.token, res.name, null);
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Username</label>
        <div className="input-wrap">
          <i className="fa-solid fa-user"></i>
          <input
            type="text"
            placeholder="Enter admin username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Password</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <><span className="spinner"></span> Signing in...</> : <span className="btn-label">Sign In as Admin</span>}
      </button>
      {error && (
        <div className="form-error"><i className="fa-solid fa-triangle-exclamation"></i>{error}</div>
      )}
    </form>
  );
}

function TeacherLoginForm({ persistSession }) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.loginTeacher(employeeId.trim(), password);
      if (res.success) {
        persistSession('teacher', res.token, res.name, res.employeeId);
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Employee ID</label>
        <div className="input-wrap">
          <i className="fa-solid fa-id-badge"></i>
          <input
            type="text"
            placeholder="Enter your Employee ID"
            autoComplete="username"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Password</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <><span className="spinner"></span> Signing in...</> : <span className="btn-label">Sign In as Teacher</span>}
      </button>
      {error && (
        <div className="form-error"><i className="fa-solid fa-triangle-exclamation"></i>{error}</div>
      )}
    </form>
  );
}
