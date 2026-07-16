import { useEffect, useState } from 'react';

const emptyForm = { employeeId: '', name: '', password: '', basicSalary: '' };

export default function TeacherModal({ open, editingTeacher, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingTeacher;

  useEffect(() => {
    if (!open) return;
    setForm(
      editingTeacher
        ? {
            employeeId: editingTeacher.employeeId,
            name: editingTeacher.name,
            password: '',
            basicSalary: editingTeacher.basicSalary
          }
        : emptyForm
    );
  }, [open, editingTeacher]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...form, employeeId: form.employeeId.trim(), name: form.name.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Teacher' : 'Add Teacher'}</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="field-plain full">
                <label>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EMP-0001"
                  required
                  disabled={isEdit}
                  value={form.employeeId}
                  onChange={(e) => set('employeeId', e.target.value)}
                />
              </div>
              <div className="field-plain full">
                <label>Teacher Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="field-plain">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Set login password"
                  required={!isEdit}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                />
                <div className="field-hint">
                  {isEdit ? 'Leave blank to keep the current password' : 'Used for the Teacher Portal login'}
                </div>
              </div>
              <div className="field-plain">
                <label>Basic Salary (PHP)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.basicSalary}
                  onChange={(e) => set('basicSalary', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? <><span className="spinner"></span> Saving...</>
                : (isEdit ? 'Update Teacher' : 'Save Teacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
