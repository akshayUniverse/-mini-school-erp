import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api.js';
import { EmptyState, ErrorMessage, Loading, PageHeading, classLabel } from '../components/Common.jsx';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data: result }) => setData(result))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <>
      <PageHeading title="Dashboard" subtitle="A quick overview of your school today." />
      <ErrorMessage>{error}</ErrorMessage>
      <section className="stat-grid">
        <article className="stat-card"><span className="stat-icon violet">ST</span><p>Total students</p><strong>{data?.totalStudents ?? '—'}</strong></article>
        <article className="stat-card"><span className="stat-icon blue">TE</span><p>Teachers</p><strong>{data?.teachers ?? '—'}</strong></article>
        <article className="stat-card"><span className="stat-icon green">CL</span><p>Classes</p><strong>{data?.classes ?? '—'}</strong></article>
      </section>
      <section className="panel">
        <div className="section-heading"><div><h2>Today's attendance</h2><p>Present students by class · Asia/Kolkata</p></div></div>
        {data?.attendance?.length
          ? <div className="attendance-summary">{data.attendance.map((item) => (
            <article className="summary-row" key={item.class?._id}>
              <div><strong>{classLabel(item.class)}</strong><small>{item.total} students recorded</small></div>
              <span className="present-count">{item.present} <span>of {item.total} present</span></span>
            </article>
          ))}</div>
          : <EmptyState>No attendance has been marked today.</EmptyState>}
      </section>
    </>
  );
}
