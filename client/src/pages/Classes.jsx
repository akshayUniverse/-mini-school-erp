import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorMessage, Loading, Modal, PageHeading, classLabel } from '../components/Common.jsx';

export default function Classes() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', section: '', teacher: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [classResult, teacherResult] = await Promise.all([
        api.get('/classes'), admin ? api.get('/teachers') : Promise.resolve({ data: [] })
      ]);
      setClasses(classResult.data); setTeachers(teacherResult.data);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [admin]);
  useEffect(() => { load(); }, [load]);

  const openForm = (item = null) => {
    setFormOpen(true);
    setEditing(item);
    setForm(item ? { name: item.name, section: item.section, teacher: item.teacher?._id || '' } : { name: '', section: '', teacher: '' });
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, teacher: form.teacher || null };
      if (editing) await api.put(`/classes/${editing._id}`, payload);
      else await api.post('/classes', payload);
      setFormOpen(false); setEditing(null); await load();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete ${classLabel(item)}?`)) return;
    try { await api.delete(`/classes/${item._id}`); await load(); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  return (
    <>
      <PageHeading title="Classes" subtitle="Class groups, in-charge teachers, and enrollment."
        action={admin && <button className="button button-primary" onClick={() => openForm()}>＋ Add class</button>} />
      <ErrorMessage>{error}</ErrorMessage>
      <section className="class-grid">
        {loading ? <Loading /> : classes.length ? classes.map((item) => (
          <article className="class-card" key={item._id}>
            <div className="class-card-top"><span className="class-symbol">{item.section}</span>{admin && <button className="icon-button" aria-label={`Edit ${classLabel(item)}`} onClick={() => openForm(item)}>•••</button>}</div>
            <h2>{classLabel(item)}</h2><p>{item.teacher?.name || 'No teacher assigned'}</p>
            <div className="class-card-footer"><span>{item.studentCount} students</span>
              {admin && <div className="actions"><button className="text-button" onClick={() => openForm(item)}>Edit</button><button className="text-button danger-text" onClick={() => remove(item)}>Delete</button></div>}
            </div>
          </article>
        )) : <EmptyState>No classes found.</EmptyState>}
      </section>
      {formOpen && <Modal title={editing ? 'Edit class' : 'Create class'} onClose={() => setFormOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label>Grade / class name<input placeholder="Grade 6" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>Section<input placeholder="A" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required /></label>
          <label className="wide">Teacher in-charge<select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}><option value="">Unassigned</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>
          <div className="form-actions wide"><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save class'}</button></div>
        </form>
      </Modal>}
    </>
  );
}
