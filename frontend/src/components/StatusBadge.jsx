const CLASS_MAP = {
  Good: 'badge-good',
  Stable: 'badge-stable',
  Critical: 'badge-critical',
};

export default function StatusBadge({ status }) {
  const className = CLASS_MAP[status] || '';
  return <span className={`badge ${className}`}>{status || 'Unknown'}</span>;
}
