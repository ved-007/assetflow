import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ALLOCATED: 'bg-blue-100 text-blue-800 border-blue-200',
  RESERVED: 'bg-purple-100 text-purple-800 border-purple-200',
  UNDER_MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  LOST: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  MISSING: 'bg-red-100 text-red-800 border-red-200',
  DAMAGED: 'bg-red-100 text-red-800 border-red-200',
  RETIRED: 'bg-gray-100 text-gray-800 border-gray-200',
  DISPOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
  TECHNICIAN_ASSIGNED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
  UPCOMING: 'bg-blue-100 text-blue-800 border-blue-200',
  ONGOING: 'bg-blue-100 text-blue-800 border-blue-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-500 text-white border-red-600 font-bold',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={twMerge(clsx("px-2.5 py-0.5 rounded-full text-xs border font-medium", colorClass))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
