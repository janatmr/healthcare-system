import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStatistics } from '../services/auth.service';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: fetchDashboardStatistics,
  });

  const stats = data?.data;

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
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Patient status mix</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <StatusBadge status="Good" />
              <span>{stats.patients?.byStatus?.Good ?? 0}</span>
              <StatusBadge status="Stable" />
              <span>{stats.patients?.byStatus?.Stable ?? 0}</span>
              <StatusBadge status="Critical" />
              <span>{stats.patients?.byStatus?.Critical ?? 0}</span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
