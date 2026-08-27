import type { FindingStatus } from '@/app/lib/types';

export function StatusBadge({ status }: { status: FindingStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status.replace('_', ' ')}</span>;
}
