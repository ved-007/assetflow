import { Laptop, CheckCircle, Wrench, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useApiQuery } from '../hooks/useApi';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';

type DashboardKPIs = {
  totalAssets: number;
  allocated: number;
  underMaintenance: number;
  available: number;
};

type ActivityLog = {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  actor: { name: string };
  createdAt: string;
};

const STAT_CARDS: { key: keyof DashboardKPIs; label: string; icon: any; color: string }[] = [
  { key: 'totalAssets', label: 'Total Assets', icon: Package, color: 'text-gray-700 bg-gray-100' },
  { key: 'available', label: 'Available', icon: CheckCircle, color: 'text-green-700 bg-green-100' },
  { key: 'allocated', label: 'Allocated', icon: Laptop, color: 'text-blue-700 bg-blue-100' },
  { key: 'underMaintenance', label: 'Under Maintenance', icon: Wrench, color: 'text-amber-700 bg-amber-100' },
];

export function Dashboard() {
  const { data: kpis, isLoading: loadingKpis } = useApiQuery<DashboardKPIs>(['dashboard'], '/dashboard');
  const { data: logs, isLoading: loadingLogs } = useApiQuery<ActivityLog[]>(['activity-logs'], '/activity-logs');

  const recentLogs = logs?.slice(0, 8) || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Real-time status of company assets and resources." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="p-5 rounded-xl border border-gray-200 bg-white flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingKpis ? '—' : kpis?.[card.key] ?? 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {!loadingLogs && recentLogs.length === 0 ? (
          <EmptyState title="No activity yet" description="Actions across the app will show up here." />
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900">{log.actor.name}</span>
                  <span className="text-sm text-gray-500"> {log.action.replace(/_/g, ' ').toLowerCase()} </span>
                  <span className="text-sm text-gray-500">{log.entityType} #{log.entityId}</span>
                </div>
                <span className="text-xs text-gray-400">{format(new Date(log.createdAt), 'PPp')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
