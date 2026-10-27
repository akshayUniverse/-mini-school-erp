import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorMessage, Loading, PageHeading, classLabel } from '../components/Common.jsx';

function todayInIndia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function downloadCsv(rows) {
  const content = [
    ['Date', 'Class', 'Section', 'Student', 'Roll number', 'Status'],
    ...rows.flatMap((item) => item.records.map((record) => [
      item.date, item.classId?.name || '', item.classId?.section || '',
      record.student?.name || '', record.student?.rollNo || '', record.status
    ]))
  ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  link.download = `attendance-${todayInIndia()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Attendance() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [history, setHistory] = useState([]);
  const [historyClass, setHistoryClass] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadClasses = useCallback(async () => {
    try {
      const { data } = await api.get('/classes', { params: isTeacher ? { mine: 'true' } : {} });
      setClasses(data);
      if (data.length) setClassId((current) => data.some((item) => item._id === current) ? current : data[0]._id);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  }, [isTeacher]);

  const loadStudents = useCallback(async () => {
    if (!classId) { setStudents([]); return; }
    setStudentsLoading(true);
    try {
      const [{ data: roster }, { data: todayRecords }] = await Promise.all([
        api.get('/students', { params: { classId } }),
        api.get('/attendance', { params: { classId, date: todayInIndia() } })
      ]);
      setStudents(roster);
      const existing = todayRecords[0]?.records || [];
      const currentStatuses = Object.fromEntries(roster.map((student) => [
        student._id, existing.find((record) => record.student?._id === student._id)?.status || 'present'
      ]));
      setStatuses(currentStatuses);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setStudentsLoading(false); }
  }, [classId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/attendance', {
        params: { ...(historyClass && { classId: historyClass }), ...(historyDate && { date: historyDate }) }
      });
      setHistory(data);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setHistoryLoading(false); }
  }, [historyClass, historyDate]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const presentCount = useMemo(() => Object.values(statuses).filter((status) => status === 'present').length, [statuses]);
  const saveAttendance = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      await api.post('/attendance', { classId, records: students.map((student) => ({ student: student._id, status: statuses[student._id] })) });
      setNotice(`Attendance saved for ${todayInIndia()}.`);
      await loadHistory();
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading />;
  return (
    <>
      <PageHeading title="Attendance" subtitle="Mark today's roll and review attendance history." />
      <ErrorMessage>{error}</ErrorMessage>
      {notice && <div className="success-message" role="status">{notice}</div>}
      {isTeacher && (
        <section className="panel mark-panel">
          <div className="section-heading">
            <div><h2>Mark today's attendance</h2><p>{todayInIndia()} · Asia/Kolkata</p></div>
            <label className="compact-select">Class<select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              {classes.length === 0 && <option value="">No assigned classes</option>}
              {classes.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}
            </select></label>
          </div>
          {studentsLoading ? <Loading /> : students.length ? <>
            <div className="roster-heading"><span>{students.length} students</span><span>{presentCount} present</span></div>
            <div className="roster-list">{students.map((student) => (
              <div className="roster-row" key={student._id}>
                <div className="student-avatar">{student.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div className="roster-name"><strong>{student.name}</strong><small>Roll no. {student.rollNo}</small></div>
                <div className="toggle-group" role="group" aria-label={`${student.name} attendance`}>
                  <button className={statuses[student._id] === 'present' ? 'toggle present selected' : 'toggle present'} onClick={() => setStatuses({ ...statuses, [student._id]: 'present' })}>Present</button>
                  <button className={statuses[student._id] === 'absent' ? 'toggle absent selected' : 'toggle absent'} onClick={() => setStatuses({ ...statuses, [student._id]: 'absent' })}>Absent</button>
                </div>
              </div>
            ))}</div>
            <div className="save-row"><span>{presentCount} of {students.length} present</span><button className="button button-primary" disabled={saving} onClick={saveAttendance}>{saving ? 'Saving…' : 'Save attendance'}</button></div>
          </> : <EmptyState>{classes.length ? 'No students found in this class.' : 'No classes are assigned to you.'}</EmptyState>}
        </section>
      )}
      <section className="panel history-panel">
        <div className="section-heading"><div><h2>Attendance history</h2><p>Browse saved class attendance records.</p></div>
          <button className="button button-quiet" disabled={!history.length} onClick={() => downloadCsv(history)}>Export CSV</button>
        </div>
        <div className="filters history-filters">
          <label>Class<select value={historyClass} onChange={(e) => setHistoryClass(e.target.value)}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{classLabel(item)}</option>)}</select></label>
          <label>Date<input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} /></label>
          {historyDate && <button className="text-button clear-filter" onClick={() => setHistoryDate('')}>Clear date</button>}
        </div>
        {historyLoading ? <Loading /> : history.length ? (
          <div className="table-scroll"><table><thead><tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th>Marked by</th></tr></thead>
            <tbody>{history.map((item) => {
              const present = item.records.filter((record) => record.status === 'present').length;
              return <tr key={item._id}><td>{item.date}</td><td><strong>{classLabel(item.classId)}</strong></td><td><span className="status-pill status-present">{present} present</span></td><td><span className="status-pill status-absent">{item.records.length - present} absent</span></td><td>{item.markedBy?.name || '—'}</td></tr>;
            })}</tbody></table></div>
        ) : <EmptyState>No attendance records found.</EmptyState>}
      </section>
    </>
  );
}
