import { Link } from 'react-router-dom';
import { useQuery } from '../lib/query';
import { fetchDashboardStatistics } from '../services/auth.service';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

export default function DashboardPage() {
  const { user } = useAuth();
  const { canManagePatients, canManageAppointments, isAdmin } = usePermissions();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: fetchDashboardStatistics,
  });

  const stats = data?.data;
  const recent = stats?.records?.recent || [];

  return (
    <section>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back, {user?.firstName}. Overview of hospital activity for your
          role ({user?.role}).
        </p>
      </header>

      {isLoading ? <Loader label="Loading statistics…" /> : null}

      {isError ? (
        <div className="card form-error">
          {error.response?.data?.message || 'Failed to load dashboard statistics.'}
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="card-grid">
            <article className="card">
              <div className="stat-value">{stats.patients?.total ?? 0}</div>
              <div className="stat-label">Total patients</div>
            </article>
            <article className="card">
              <div className="stat-value">
                {stats.patients?.byStatus?.Critical ?? 0}
              </div>
              <div className="stat-label">Critical patients</div>
            </article>
            <article className="card">
              <div className="stat-value">{stats.appointments?.today ?? 0}</div>
              <div className="stat-label">Appointments today</div>
            </article>
            <article className="card">
              <div className="stat-value">{stats.appointments?.upcoming ?? 0}</div>
              <div className="stat-label">Upcoming appointments</div>
            </article>
            <article className="card">
              <div className="stat-value">{stats.records?.total ?? 0}</div>
              <div className="stat-label">Medical records</div>
            </article>
            {isAdmin ? (
              <article className="card">
                <div className="stat-value">
                  {(stats.staff?.doctors || 0) +
                    (stats.staff?.nurses || 0) +
                    (stats.staff?.admins || 0)}
                </div>
                <div className="stat-label">Active staff</div>
              </article>
            ) : null}
          </div>

          <div className="quick-actions">
            {canManagePatients ? (
              <Link className="btn" to="/patients">
                Manage patients
              </Link>
            ) : (
              <Link className="btn btn-ghost" to="/patients">
                View patients
              </Link>
            )}
            {canManageAppointments ? (
              <Link className="btn" to="/appointments">
                Book appointment
              </Link>
            ) : (
              <Link className="btn btn-ghost" to="/appointments">
                View appointments
              </Link>
            )}
            <Link className="btn btn-ghost" to="/records">
              Medical records
            </Link>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Patient status mix</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge status="Good" />
              <span>{stats.patients?.byStatus?.Good ?? 0}</span>
              <StatusBadge status="Stable" />
              <span>{stats.patients?.byStatus?.Stable ?? 0}</span>
              <StatusBadge status="Critical" />
              <span>{stats.patients?.byStatus?.Critical ?? 0}</span>
            </div>
          </div>

          {isAdmin ? (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem' }}>Staff breakdown</h2>
              <div className="card-grid">
                <div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                    {stats.staff?.doctors ?? 0}
                  </div>
                  <div className="stat-label">Doctors</div>
                </div>
                <div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                    {stats.staff?.nurses ?? 0}
                  </div>
                  <div className="stat-label">Nurses</div>
                </div>
                <div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                    {stats.staff?.admins ?? 0}
                  </div>
                  <div className="stat-label">Admins</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="card" style={{ marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent records</h2>
            {recent.length === 0 ? (
              <p>No recent medical records yet.</p>
            ) : (
              <ul className="list-plain">
                {recent.map((record) => (
                  <li key={record._id}>
                    <strong>
                      {record.patientId?.firstName} {record.patientId?.lastName}
                    </strong>
                    {' — '}
                    {record.diagnosis}
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {record.visitDate
                        ? String(record.visitDate).slice(0, 10)
                        : '—'}
                      {record.createdBy
                        ? ` · ${record.createdBy.firstName} ${record.createdBy.lastName}`
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
