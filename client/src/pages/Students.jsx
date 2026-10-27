import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorMessage, Loading, Modal, PageHeading, classLabel } from '../components/Common.jsx';

const emptyForm = { name: '', rollNo: '', classId: '', guardianContact: '' };

export default function Students() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    try { const { data } = await api.get('/classes'); setClasses(data); }
    catch (requestError) { setError(getErrorMessage(requestError)); setLoading(false); }
  }, []);
  const loadStudents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/students', { params: { ...(classFilter && { classId: classFilter }), ...(search && { search }) } });
      setStudents(data);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [classFilter, search]);
  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openForm = (student = null) => {
    setFormOpen(true);
    setEditing(student);
    setForm(student ? { name: student.name, rollNo: student.rollNo, classId: student.classId?._id || '', guardianContact: student.guardianContact || '' } : { ...emptyForm, classId: classFilter });
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.put(`/students/${editing._id}`, form);
      else await api.post('/students', form);
      setFormOpen(false); setEditing(null); await loadStudents();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async (student) => {
    if (!window.confirm(`Delete ${student.name}?`)) return;
    try { await api.delete(`/students/${student._id}`); await loadStudents(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  return (
    <>
      <PageHeading title="Students" subtitle="Search the roster and keep student records up to date."
        action={admin && <button className="button button-primary" onClick={() => openForm()}>＋ Add student</button>} />
      <section className="panel filters">
        <label>Class<select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}</select></label>
        <label className="search-field">Search students<input type="search" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      </section>
      <ErrorMessage>{error}</ErrorMessage>
      <section className="panel table-panel">
        {loading ? <Loading /> : students.length ? (
          <div className="table-scroll"><table><thead><tr><th>Student</th><th>Roll no.</th><th>Class</th><th>Guardian contact</th>{admin && <th>Actions</th>}</tr></thead>
            <tbody>{students.map((student) => <tr key={student._id}><td><strong>{student.name}</strong></td><td>{student.rollNo}</td><td>{classLabel(student.classId)}</td><td>{student.guardianContact || '—'}</td>
              {admin && <td className="actions"><button className="text-button" onClick={() => openForm(student)}>Edit</button><button className="text-button danger-text" onClick={() => remove(student)}>Delete</button></td>}
            </tr>)}</tbody></table></div>
        ) : <EmptyState>No students found.</EmptyState>}
      </section>
      {formOpen && <Modal title={editing ? 'Edit student' : 'Add student'} onClose={() => setFormOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Roll number<input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} required /></label>
          <label>Class<select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required><option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}</select></label>
          <label className="wide">Guardian contact<input value={form.guardianContact} onChange={(e) => setForm({ ...form, guardianContact: e.target.value })} /></label>
          <div className="form-actions wide"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save student'}</button></div>
        </form>
      </Modal>}
    </>
  );
}
