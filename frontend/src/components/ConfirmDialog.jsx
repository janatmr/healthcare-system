import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  danger,
  loading,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p>{message}</p>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn${danger ? ' btn-danger' : ''}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
