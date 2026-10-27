import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorMessage, Loading, Modal, PageHeading } from '../components/Common.jsx';

const blank = { name: '', email: '', password: '', phone: '', subject: '' };

export default function Teachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const admin = user?.role === 'admin';

  const load = useCallback(async () => {
    setError('');
    try { const { data } = await api.get('/teachers'); setTeachers(data); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openForm = (teacher = null) => {
    setFormOpen(true);
    setEditing(teacher);
    setForm(teacher ? { name: teacher.name, email: teacher.email, password: '', phone: teacher.phone || '', subject: teacher.subject || '' } : blank);
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) await api.put(`/teachers/${editing.id}`, payload);
      else await api.post('/teachers', payload);
      setFormOpen(false); setEditing(null); await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async (teacher) => {
    if (!window.confirm(`Delete ${teacher.name}? Their classes will become unassigned.`)) return;
    try { await api.delete(`/teachers/${teacher.id}`); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  return (
    <>
      <PageHeading title="Teachers" subtitle="Manage teaching staff and their contact details."
        action={admin && <button className="button button-primary" onClick={() => openForm()}>＋ Add teacher</button>} />
      <ErrorMessage>{error}</ErrorMessage>
      <section className="panel table-panel">
        {loading ? <Loading /> : teachers.length ? (
          <div className="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Subject</th><th>Phone</th>{admin && <th>Actions</th>}</tr></thead>
            <tbody>{teachers.map((teacher) => <tr key={teacher.id}>
              <td><strong>{teacher.name}</strong></td><td>{teacher.email}</td><td>{teacher.subject || '—'}</td><td>{teacher.phone || '—'}</td>
              {admin && <td className="actions"><button className="text-button" onClick={() => openForm(teacher)}>Edit</button><button className="text-button danger-text" onClick={() => remove(teacher)}>Delete</button></td>}
            </tr>)}</tbody></table></div>
        ) : <EmptyState>No teachers found.</EmptyState>}
      </section>
      {formOpen && <Modal title={editing ? 'Edit teacher' : 'Add teacher'} onClose={() => setFormOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label className="wide">Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="wide">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="wide">Password{editing && <small> Leave blank to keep current password.</small>}<input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} /></label>
          <label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <div className="form-actions wide"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save teacher'}</button></div>
        </form>
      </Modal>}
    </>
  );
}
