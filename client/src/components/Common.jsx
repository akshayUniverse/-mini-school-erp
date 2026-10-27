export function PageHeading({ title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {action}
    </div>
  );
}

export function ErrorMessage({ children }) {
  return children ? <div className="alert" role="alert">{children}</div> : null;
}

export function Loading() {
  return <div className="loading" role="status">Loading…</div>;
}

export function EmptyState({ children }) {
  return <div className="empty-state">{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
        {children}
      </section>
    </div>
  );
}

export function classLabel(item) {
  return item ? `${item.name} - ${item.section}` : 'Unassigned';
}
