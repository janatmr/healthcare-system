import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '../lib/query';
import toast from 'react-hot-toast';
import { fetchDashboardStatistics, registerStaff } from '../services/auth.service';
import Loader from '../components/Loader';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'Doctor',
  department: '',
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: fetchDashboardStatistics,
  });

  const stats = data?.data;

  const registerMutation = useMutation({
    mutationFn: registerStaff,
    onSuccess: (result) => {
      toast.success(`Registered ${result.user?.role}: ${result.user?.email}`);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ['dashboard-statistics'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Unable to register staff');
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    registerMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      department: form.department.trim(),
    });
  }

  return (
    <section>
      <header className="page-header">
        <h1>Administration</h1>
        <p>Manage staff accounts, roles, and hospital configuration.</p>
      </header>

      {isLoading ? <Loader label="Loading staff stats…" /> : null}

      {stats ? (
        <div className="card-grid" style={{ marginBottom: '1rem' }}>
          <article className="card">
            <div className="stat-value">{stats.staff?.doctors ?? 0}</div>
            <div className="stat-label">Doctors</div>
          </article>
          <article className="card">
            <div className="stat-value">{stats.staff?.nurses ?? 0}</div>
            <div className="stat-label">Nurses</div>
          </article>
          <article className="card">
            <div className="stat-value">{stats.staff?.admins ?? 0}</div>
            <div className="stat-label">Admins</div>
          </article>
          <article className="card">
            <div className="stat-value">{stats.patients?.total ?? 0}</div>
            <div className="stat-label">Patients</div>
          </article>
        </div>
      ) : null}

      <div className="card">
        <h2 style={{ fontSize: '1.2rem' }}>Register staff</h2>
        <p>
          Create Doctor, Nurse, or Admin accounts. A full staff directory is not
          available yet—use registration here and track counts above.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="btn"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Registering…' : 'Register staff'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
