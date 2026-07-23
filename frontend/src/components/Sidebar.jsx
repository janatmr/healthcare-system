import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/patients', label: 'Patients' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/records', label: 'Records' },
  { to: '/admin', label: 'Admin', roles: ['Admin'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visibleLinks = LINKS.filter(
    (link) => !link.roles || link.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">CareLedger</div>
        <div className="brand-sub">Hospital Management</div>
      </div>
      <nav aria-label="Main">
        <ul className="nav-list">
          {visibleLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
