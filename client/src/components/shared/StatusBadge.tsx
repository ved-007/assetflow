import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ALLOCATED: 'bg-blue-100 text-blue-800 border-blue-200',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
  LOST: 'bg-red-100 text-red-800 border-red-200',
  DISPOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  OVERDUE: 'bg-red-500 text-white border-red-600 font-bold',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  TECHNICIAN_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={twMerge(clsx("px-2.5 py-0.5 rounded-full text-xs border font-medium", colorClass))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
