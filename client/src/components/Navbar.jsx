import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const links = [
    ['/', 'Dashboard'],
    ['/teachers', 'Teachers'],
    ['/classes', 'Classes'],
    ['/students', 'Students'],
    ['/attendance', 'Attendance']
  ];

  return (
    <header className="topbar">
      <NavLink className="brand" to="/">Mini<span>School</span></NavLink>
      <nav aria-label="Main navigation">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="account">
        <span className="account-name">{user?.name}<small>{user?.role}</small></span>
        <button className="button button-quiet button-small" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
