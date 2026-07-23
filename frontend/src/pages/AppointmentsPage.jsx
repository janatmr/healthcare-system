import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '../lib/query';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { listPatients } from '../services/patients.service';
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from '../services/appointments.service';

const EMPTY_FORM = {
  patientId: '',
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '09:00',
  duration: 30,
  department: '',
  notes: '',
  status: 'Pending',
};

function shortId(id) {
  if (!id) return '—';
  const value = String(id);
  return value.length > 8 ? `…${value.slice(-6)}` : value;
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { canManageAppointments, isDoctor, isAdmin } = usePermissions();

  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      status: status || undefined,
      date: date || undefined,
    }),
    [page, status, date]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => listAppointments(filters),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { page: 1, limit: 100 }],
    queryFn: () => listPatients({ page: 1, limit: 100 }),
  });

  const appointments = data?.data || [];
  const pagination = data?.pagination;
  const patients = patientsData?.data || [];
  const patientMap = useMemo(() => {
    const map = new Map();
    patients.forEach((p) => map.set(p._id, p));
    return map;
  }, [patients]);

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-statistics'] });
  };

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['appointments', filters] });
      const previous = queryClient.getQueryData(['appointments', filters]);
      const temp = {
        _id: `temp-${Date.now()}`,
        ...payload,
        status: payload.status || 'Pending',
        optimistic: true,
      };
      queryClient.setQueryData(['appointments', filters], (old) => {
        if (!old) {
          return {
            success: true,
            data: [temp],
            pagination: { page: 1, limit: 10, total: 1, pages: 1 },
          };
        }
        return {
          ...old,
          data: [temp, ...(old.data || [])],
          pagination: old.pagination
            ? { ...old.pagination, total: (old.pagination.total || 0) + 1 }
            : old.pagination,
        };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['appointments', filters], context.previous);
      }
      toast.error(err.response?.data?.message || 'Unable to book appointment');
    },
    onSuccess: () => {
      toast.success('Appointment booked');
      setModalOpen(false);
      setForm(EMPTY_FORM);
    },
    onSettled: () => {
      invalidateRelated();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAppointment(id, payload),
    onSuccess: () => {
      toast.success('Appointment updated');
      setModalOpen(false);
      setEditing(null);
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateAppointmentStatus(id, nextStatus),
    onSuccess: () => {
      toast.success('Appointment status updated');
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Status update failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAppointment(id),
    onSuccess: () => {
      toast.success('Appointment deleted');
      setDeleteTarget(null);
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      doctorId: isDoctor ? user._id : '',
    });
    setModalOpen(true);
  }

  function openEdit(appointment) {
    setEditing(appointment);
    setForm({
      patientId: String(appointment.patientId),
      doctorId: String(appointment.doctorId),
      appointmentDate: String(appointment.appointmentDate).slice(0, 10),
      appointmentTime: appointment.appointmentTime || '09:00',
      duration: appointment.duration || 30,
      department: appointment.department || '',
      notes: appointment.notes || '',
      status: appointment.status || 'Pending',
    });
    setModalOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      patientId: form.patientId,
      doctorId: isDoctor ? user._id : form.doctorId.trim(),
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      duration: Number(form.duration) || 30,
      department: form.department.trim(),
      notes: form.notes.trim(),
      status: form.status,
    };

    if (editing) {
      updateMutation.mutate({ id: editing._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function resolvePatientName(patientId) {
    const patient = patientMap.get(String(patientId));
    if (!patient) return shortId(patientId);
    return `${patient.firstName} ${patient.lastName}`;
  }

  function resolveDoctorLabel(doctorId) {
    if (String(doctorId) === String(user?._id)) return 'You';
    return shortId(doctorId);
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <section>
      <header className="page-header">
        <h1>Appointments</h1>
        <p>Schedule and track visits via the appointment microservice.</p>
      </header>

      <div className="toolbar">
        <div className="toolbar-filters">
          <select
            className="select-input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
          <input
            className="select-input"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by date"
          />
        </div>
        {canManageAppointments ? (
          <button type="button" className="btn" onClick={openCreate}>
            Book appointment
          </button>
        ) : null}
      </div>

      {isLoading ? <Loader label="Loading appointments…" /> : null}
      {isError ? (
        <div className="card form-error">
          {error.response?.data?.message ||
            'Failed to load appointments. Is the appointment service running?'}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        appointments.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No appointments"
              description="Book a visit to see it appear here immediately."
            />
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt._id} style={appt.optimistic ? { opacity: 0.7 } : undefined}>
                      <td>{String(appt.appointmentDate).slice(0, 10)}</td>
                      <td>{appt.appointmentTime}</td>
                      <td>{resolvePatientName(appt.patientId)}</td>
                      <td>{resolveDoctorLabel(appt.doctorId)}</td>
                      <td>{appt.department}</td>
                      <td>
                        <span className="badge">{appt.status}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {canManageAppointments && !appt.optimistic ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => openEdit(appt)}
                              >
                                Edit
                              </button>
                              {appt.status === 'Pending' ? (
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  onClick={() =>
                                    statusMutation.mutate({
                                      id: appt._id,
                                      nextStatus: 'Confirmed',
                                    })
                                  }
                                >
                                  Confirm
                                </button>
                              ) : null}
                              {appt.status !== 'Cancelled' &&
                              appt.status !== 'Completed' ? (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() =>
                                    statusMutation.mutate({
                                      id: appt._id,
                                      nextStatus: 'Cancelled',
                                    })
                                  }
                                >
                                  Cancel
                                </button>
                              ) : null}
                              {appt.status === 'Confirmed' ? (
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  onClick={() =>
                                    statusMutation.mutate({
                                      id: appt._id,
                                      nextStatus: 'Completed',
                                    })
                                  }
                                >
                                  Complete
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteTarget(appt)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="badge">
                              {appt.optimistic ? 'Saving…' : 'View'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit appointment' : 'Book appointment'}
        onClose={() => setModalOpen(false)}
        wide
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field span-2">
              <label htmlFor="patientId">Patient</label>
              <select
                id="patientId"
                required
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin ? (
              <div className="form-field span-2">
                <label htmlFor="doctorId">Doctor ID</label>
                <input
                  id="doctorId"
                  required
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  placeholder="MongoDB ObjectId of the doctor"
                />
              </div>
            ) : (
              <div className="form-field span-2">
                <label>Doctor</label>
                <input value={`${user?.firstName} ${user?.lastName} (you)`} disabled />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="appointmentDate">Date</label>
              <input
                id="appointmentDate"
                type="date"
                required
                value={form.appointmentDate}
                onChange={(e) =>
                  setForm({ ...form, appointmentDate: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="appointmentTime">Time</label>
              <input
                id="appointmentTime"
                type="time"
                required
                value={form.appointmentTime}
                onChange={(e) =>
                  setForm({ ...form, appointmentTime: e.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                min={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="apptStatus">Status</label>
              <select
                id="apptStatus"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Cancelled</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="form-field span-2">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete appointment"
        message="Delete this appointment permanently?"
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </section>
  );
}
