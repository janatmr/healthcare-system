import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '../lib/query';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { usePermissions } from '../hooks/usePermissions';
import { listPatients } from '../services/patients.service';
import {
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord,
} from '../services/records.service';

const EMPTY_FORM = {
  patientId: '',
  diagnosis: '',
  medication: '',
  doctorNotes: '',
  visitDate: '',
};

function patientLabel(patient) {
  if (!patient) return '—';
  if (typeof patient === 'string') return patient.slice(-6);
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || '—';
}

export default function RecordsPage() {
  const queryClient = useQueryClient();
  const { canManageRecords } = usePermissions();

  const [patientId, setPatientId] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      patientId: patientId || undefined,
    }),
    [page, patientId]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['records', filters],
    queryFn: () => listRecords(filters),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { page: 1, limit: 100 }],
    queryFn: () => listPatients({ page: 1, limit: 100 }),
  });

  const records = data?.data || [];
  const pagination = data?.pagination;
  const patients = patientsData?.data || [];

  const invalidateRelated = () => {
    queryClient.invalidateQueries({ queryKey: ['records'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-statistics'] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updateRecord(editing._id, payload) : createRecord(payload),
    onSuccess: () => {
      toast.success(editing ? 'Record updated' : 'Record created');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      invalidateRelated();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Unable to save record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRecord(id),
    onSuccess: () => {
      toast.success('Record deleted');
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

  function openEdit(record) {
    setEditing(record);
    setForm({
      patientId:
        typeof record.patientId === 'object'
          ? record.patientId._id
          : record.patientId,
      diagnosis: record.diagnosis || '',
      medication: (record.medication || []).join(', '),
      doctorNotes: record.doctorNotes || '',
      visitDate: record.visitDate ? String(record.visitDate).slice(0, 10) : '',
    });
    setModalOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      patientId: form.patientId,
      diagnosis: form.diagnosis.trim(),
      medication: form.medication
        ? form.medication.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      doctorNotes: form.doctorNotes.trim(),
    };
    if (form.visitDate) payload.visitDate = form.visitDate;
    saveMutation.mutate(payload);
  }

  return (
    <section>
      <header className="page-header">
        <h1>Medical Records</h1>
        <p>Clinical history, diagnoses, and visit notes.</p>
      </header>

      <div className="toolbar">
        <div className="toolbar-filters">
          <select
            className="select-input"
            value={patientId}
            onChange={(event) => {
              setPatientId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All patients</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
        {canManageRecords ? (
          <button type="button" className="btn" onClick={openCreate}>
            Add record
          </button>
        ) : null}
      </div>

      {isLoading ? <Loader label="Loading records…" /> : null}
      {isError ? (
        <div className="card form-error">
          {error.response?.data?.message || 'Failed to load records.'}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        records.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No medical records"
              description="Create a record after registering a patient."
            />
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Diagnosis</th>
                    <th>Visit date</th>
                    <th>Created by</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{patientLabel(record.patientId)}</td>
                      <td>{record.diagnosis}</td>
                      <td>
                        {record.visitDate
                          ? String(record.visitDate).slice(0, 10)
                          : '—'}
                      </td>
                      <td>
                        {record.createdBy
                          ? `${record.createdBy.firstName || ''} ${record.createdBy.lastName || ''}`.trim()
                          : '—'}
                      </td>
                      <td>
                        <div className="row-actions">
                          {canManageRecords ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => openEdit(record)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeleteTarget(record)}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="badge">Read only</span>
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
        title={editing ? 'Edit record' : 'Add record'}
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
            <div className="form-field span-2">
              <label htmlFor="diagnosis">Diagnosis</label>
              <input
                id="diagnosis"
                required
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="visitDate">Visit date</label>
              <input
                id="visitDate"
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="medication">Medication (comma-separated)</label>
              <input
                id="medication"
                value={form.medication}
                onChange={(e) => setForm({ ...form, medication: e.target.value })}
              />
            </div>
            <div className="form-field span-2">
              <label htmlFor="doctorNotes">Doctor notes</label>
              <textarea
                id="doctorNotes"
                value={form.doctorNotes}
                onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
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
        title="Delete record"
        message="Delete this medical record? This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </section>
  );
}
