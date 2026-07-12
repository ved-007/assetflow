import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, X, UserCheck, PlayCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shared/PageHeader';
import { DataTable, Column } from '../components/shared/DataTable';
import { FormDialog } from '../components/shared/FormDialog';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';

const raiseSchema = z.object({
  assetId: z.coerce.number(),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

const technicianSchema = z.object({
  technicianName: z.string().min(1, 'Technician name is required'),
});

type MaintenanceRequest = {
  id: number;
  asset: { id: number; name: string; assetTag: string };
  raisedBy: { id: number; name: string };
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
  technicianName?: string;
  createdAt: string;
  resolvedAt?: string;
};

export function Maintenance() {
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState<MaintenanceRequest | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role || '');

  const { data: requests, isLoading } = useApiQuery<MaintenanceRequest[]>(['maintenance', tab], '/maintenance', { tab });
  const { data: assets } = useApiQuery(['assets'], '/assets');

  const raiseMut = useApiMutation('post', '/maintenance');
  const decideMut = useApiMutation('post', (vars: any) => `/maintenance/${vars.id}/decide`);
  const technicianMut = useApiMutation('post', (vars: any) => `/maintenance/${vars.id}/technician`);
  const statusMut = useApiMutation('post', (vars: any) => `/maintenance/${vars.id}/status`);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  };

  const handleRaise = (data: any) => {
    raiseMut.mutate(data, {
      onSuccess: () => { toast.success('Maintenance request raised'); invalidate(); setRaiseOpen(false); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleDecide = (id: number, decision: 'APPROVED' | 'REJECTED') => {
    decideMut.mutate({ id, decision }, {
      onSuccess: () => { toast.success(`Request ${decision.toLowerCase()}`); invalidate(); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleAssignTechnician = (data: any) => {
    technicianMut.mutate({ ...data, id: technicianDialog?.id }, {
      onSuccess: () => { toast.success('Technician assigned'); invalidate(); setTechnicianDialog(null); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleAdvance = (id: number, status: 'IN_PROGRESS' | 'RESOLVED') => {
    statusMut.mutate({ id, status }, {
      onSuccess: () => { toast.success(status === 'RESOLVED' ? 'Marked resolved' : 'Marked in progress'); invalidate(); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'asset', header: 'Asset', render: (r) => `${r.asset.name} (${r.asset.assetTag})` },
    { key: 'description', header: 'Issue', render: (r) => <span className="line-clamp-2 max-w-xs block">{r.description}</span> },
    { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'raisedBy', header: 'Raised By', render: (r) => r.raisedBy.name },
    { key: 'createdAt', header: 'Reported', render: (r) => format(new Date(r.createdAt), 'PP') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'technician', header: 'Technician', render: (r) => r.technicianName || '-' },
    {
      key: 'actions', header: 'Actions',
      render: (r) => {
        if (!canManage) return null;
        if (r.status === 'PENDING') {
          return (
            <div className="flex space-x-2">
              <button onClick={() => handleDecide(r.id, 'APPROVED')} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={16} /></button>
              <button onClick={() => handleDecide(r.id, 'REJECTED')} className="text-red-600 p-1 hover:bg-red-50 rounded"><X size={16} /></button>
            </div>
          );
        }
        if (r.status === 'APPROVED') {
          return (
            <button onClick={() => setTechnicianDialog(r)} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
              <UserCheck size={14} /> Assign Technician
            </button>
          );
        }
        if (r.status === 'TECHNICIAN_ASSIGNED') {
          return (
            <button onClick={() => handleAdvance(r.id, 'IN_PROGRESS')} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
              <PlayCircle size={14} /> Start Work
            </button>
          );
        }
        if (r.status === 'IN_PROGRESS') {
          return (
            <button onClick={() => handleAdvance(r.id, 'RESOLVED')} className="text-green-600 hover:underline text-sm flex items-center gap-1">
              <CheckCircle2 size={14} /> Mark Resolved
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Track, approve, and resolve maintenance requests."
        action={
          <button onClick={() => setRaiseOpen(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <Plus size={18} />
            <span>Raise Request</span>
          </button>
        }
      />

      <div className="flex space-x-4 border-b border-gray-200">
        {(['all', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 capitalize font-medium text-sm transition-colors border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'all' ? 'All Requests' : 'My Requests'}
          </button>
        ))}
      </div>

      {!isLoading && requests?.length === 0 ? (
        <EmptyState title="No maintenance requests" description="Raise a request when an asset needs attention." />
      ) : (
        <DataTable data={requests || []} columns={columns} keyExtractor={(r) => r.id} loading={isLoading} />
      )}

      <FormDialog
        open={raiseOpen}
        onClose={() => setRaiseOpen(false)}
        title="Raise Maintenance Request"
        schema={raiseSchema}
        onSubmit={handleRaise}
        loading={raiseMut.isPending}
        defaultValues={{ priority: 'MEDIUM' } as any}
      >
        {(form) => (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Asset *</label>
              <select {...form.register('assetId')} className="w-full border rounded-md p-2">
                <option value="">Select an asset...</option>
                {assets?.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
              </select>
              {form.formState.errors.assetId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.assetId.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Issue Description *</label>
              <textarea {...form.register('description')} className="w-full border rounded-md p-2" rows={3} placeholder="Describe the issue clearly..." />
              {form.formState.errors.description && <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select {...form.register('priority')} className="w-full border rounded-md p-2">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </>
        )}
      </FormDialog>

      <FormDialog
        open={!!technicianDialog}
        onClose={() => setTechnicianDialog(null)}
        title={`Assign Technician: ${technicianDialog?.asset.name}`}
        schema={technicianSchema}
        onSubmit={handleAssignTechnician}
        loading={technicianMut.isPending}
      >
        {(form) => (
          <div>
            <label className="block text-sm font-medium mb-1">Technician Name *</label>
            <input {...form.register('technicianName')} className="w-full border rounded-md p-2" placeholder="e.g. FixIt Facilities Co." />
            {form.formState.errors.technicianName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.technicianName.message as string}</p>}
          </div>
        )}
      </FormDialog>
    </div>
  );
}
