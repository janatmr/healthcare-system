import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div>
        <strong>Clinical Workspace</strong>
      </div>
      <div className="navbar-user">
        <div className="navbar-meta">
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
          <span>{user?.role}</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => logout()}>
          Log out
        </button>
      </div>
    </header>
  );
}
