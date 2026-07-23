import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '../lib/query';
import toast from 'react-hot-toast';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { usePermissions } from '../hooks/usePermissions';
import {
  createPatient,
  deletePatient,
  listPatients,
  updatePatient,
  updatePatientStatus,
} from '../services/patients.service';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  gender: 'Male',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  bloodGroup: '',
  status: 'Good',
  allergies: '',
  medicalConditions: '',
};

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function buildPayload(form) {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender,
    dateOfBirth: form.dateOfBirth,
    phone: form.phone.trim(),
    address: form.address.trim(),
    status: form.status,
    allergies: form.allergies
      ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    medicalConditions: form.medicalConditions
      ? form.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  };

  if (form.email.trim()) payload.email = form.email.trim();
  if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
  return payload;
}

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const { canManagePatients, canUpdatePatientStatus } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      status: status || undefined,
    }),
    [page, search, status]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => listPatients(filters),
  });

  const patients = data?.data || [];
  const pagination = data?.pagination;

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-statistics'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updatePatient(editing._id, payload) : createPatient(payload),
    onSuccess: () => {
      toast.success(editing ? 'Patient updated' : 'Patient created');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Unable to save patient');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updatePatientStatus(id, nextStatus),
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['patients', filters] });
      const previous = queryClient.getQueryData(['patients', filters]);
      queryClient.setQueryData(['patients', filters], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p) =>
            p._id === id ? { ...p, status: nextStatus } : p
          ),
        };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['patients', filters], context.previous);
      }
      toast.error(err.response?.data?.message || 'Status update failed');
    },
    onSuccess: () => {
      toast.success('Status updated');
    },
    onSettled: () => {
      invalidateRelated();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePatient(id),
    onSuccess: () => {
      toast.success('Patient deleted');
      setDeleteTarget(null);
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(patient) {
    setEditing(patient);
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      gender: patient.gender || 'Male',
      dateOfBirth: toDateInput(patient.dateOfBirth),
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      bloodGroup: patient.bloodGroup || '',
      status: patient.status || 'Good',
      allergies: (patient.allergies || []).join(', '),
      medicalConditions: (patient.medicalConditions || []).join(', '),
    });
    setModalOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveMutation.mutate(buildPayload(form));
  }

  return (
    <section>
      <header className="page-header">
        <h1>Patients</h1>
        <p>Search, register, and manage patient records.</p>
      </header>

      <div className="toolbar">
        <div className="toolbar-filters">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search name, phone, or email"
          />
          <select
            className="select-input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="Good">Good</option>
            <option value="Stable">Stable</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        {canManagePatients ? (
          <button type="button" className="btn" onClick={openCreate}>
            Add patient
          </button>
        ) : null}
      </div>

      {isLoading ? <Loader label="Loading patients…" /> : null}
      {isError ? (
        <div className="card form-error">
          {error.response?.data?.message || 'Failed to load patients.'}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        patients.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No patients found"
              description="Try adjusting filters or add a new patient."
            />
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient._id}>
                      <td>
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td>{patient.phone}</td>
                      <td>{patient.gender}</td>
                      <td>
                        {canUpdatePatientStatus ? (
                          <select
                            className="select-input"
                            value={patient.status}
                            onChange={(event) =>
                              statusMutation.mutate({
                                id: patient._id,
                                nextStatus: event.target.value,
                              })
                            }
                            aria-label={`Status for ${patient.firstName}`}
                          >
                            <option value="Good">Good</option>
                            <option value="Stable">Stable</option>
                            <option value="Critical">Critical</option>
                          </select>
                        ) : (
                          <StatusBadge status={patient.status} />
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {canManagePatients ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => openEdit(patient)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteTarget(patient)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <StatusBadge status={patient.status} />
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
        title={editing ? 'Edit patient' : 'Add patient'}
        onClose={() => setModalOpen(false)}
        wide
      >
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
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                id="dateOfBirth"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bloodGroup">Blood group</label>
              <select
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Good</option>
                <option>Stable</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="form-field span-2">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="form-field span-2">
              <label htmlFor="allergies">Allergies (comma-separated)</label>
              <input
                id="allergies"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              />
            </div>
            <div className="form-field span-2">
              <label htmlFor="conditions">Medical conditions (comma-separated)</label>
              <input
                id="conditions"
                value={form.medicalConditions}
                onChange={(e) =>
                  setForm({ ...form, medicalConditions: e.target.value })
                }
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
            <button type="submit" className="btn" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete patient"
        message={`Delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </section>
  );
}
