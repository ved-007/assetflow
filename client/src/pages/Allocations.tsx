import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, X } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shared/PageHeader';
import { DataTable } from '../components/shared/DataTable';
import { FormDialog } from '../components/shared/FormDialog';
import { StatusBadge } from '../components/shared/StatusBadge';

const returnSchema = z.object({
  condition: z.string().optional(),
  notes: z.string().optional(),
});

const allocationSchema = z.object({
  assetId: z.coerce.number(),
  employeeId: z.coerce.number(),
  expectedReturnDate: z.string().optional(),
});

const transferSchema = z.object({
  assetId: z.coerce.number(),
  toEmployeeId: z.coerce.number(),
  reason: z.string().min(1, 'Reason is required'),
});

export function Allocations() {
  const [tab, setTab] = useState<'active' | 'transfers' | 'history'>('active');
  const [returnDialog, setReturnDialog] = useState<any>(null);
  const [newDialog, setNewDialog] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null); // For transfer requests
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Queries
  const { data: allocations, isLoading: loadingAlloc } = useApiQuery(['allocations', tab], '/allocations', { tab }, { enabled: tab !== 'transfers' });
  const { data: transfers, isLoading: loadingTrans } = useApiQuery(['transfers'], '/transfers', {}, { enabled: tab === 'transfers' });
  const { data: assets } = useApiQuery(['assets'], '/assets');
  const { data: employees } = useApiQuery(['employees'], '/org/employees');

  // Mutations
  const returnMut = useApiMutation('post', (vars: any) => `/allocations/${vars.id}/return`);
  const allocMut = useApiMutation('post', '/allocations');
  const transferMut = useApiMutation('post', '/transfers');
  const decideMut = useApiMutation('post', (vars: any) => `/transfers/${vars.id}/decide`);

  const handleReturn = (data: any) => {
    returnMut.mutate(data, {
      onSuccess: () => {
        toast.success('Asset returned successfully');
        queryClient.invalidateQueries({ queryKey: ['allocations'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        setReturnDialog(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const handleAllocate = (data: any) => {
    allocMut.mutate(data, {
      onSuccess: () => {
        toast.success('Asset allocated successfully');
        queryClient.invalidateQueries({ queryKey: ['allocations'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        setNewDialog(false);
        setConflictData(null);
      },
      onError: (err) => {
        if (err.message.toLowerCase().includes('not available')) {
          setConflictData(data);
        } else {
          toast.error(err.message);
        }
      }
    });
  };

  const handleTransferRequest = (data: any) => {
    transferMut.mutate(data, {
      onSuccess: () => {
        toast.success('Transfer requested successfully');
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        setNewDialog(false);
        setConflictData(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const handleDecide = (id: number, decision: 'APPROVED' | 'REJECTED') => {
    decideMut.mutate({ id, decision }, {
      onSuccess: () => {
        toast.success(`Transfer ${decision.toLowerCase()}`);
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
        queryClient.invalidateQueries({ queryKey: ['allocations'] });
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const isManagerOrAdmin = ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'].includes(user?.role || '');

  // Columns
  const activeCols = [
    { key: 'asset', header: 'Asset', render: (item: any) => `${item.asset.name} (${item.asset.assetTag})` },
    { key: 'employee', header: 'Holder', render: (item: any) => item.employee.name },
    { key: 'allocatedAt', header: 'Allocated Date', render: (item: any) => format(new Date(item.allocatedAt), 'PP') },
    { 
      key: 'expected', header: 'Expected Return', 
      render: (item: any) => {
        if (!item.expectedReturnDate) return '-';
        const date = new Date(item.expectedReturnDate);
        const overdue = isPast(date);
        return (
          <span className={overdue ? 'text-red-600 font-medium' : ''}>
            {format(date, 'PP')}
            {overdue && <StatusBadge status="OVERDUE" />}
          </span>
        );
      }
    },
    { 
      key: 'actions', header: 'Actions', 
      render: (item: any) => isManagerOrAdmin && (
        <button onClick={() => setReturnDialog(item)} className="text-blue-600 hover:underline">Return</button>
      )
    },
  ];

  const historyCols = [
    { key: 'asset', header: 'Asset', render: (item: any) => `${item.asset.name} (${item.asset.assetTag})` },
    { key: 'employee', header: 'Holder', render: (item: any) => item.employee.name },
    { key: 'returnedAt', header: 'Returned Date', render: (item: any) => item.returnedAt ? format(new Date(item.returnedAt), 'PP') : '-' },
    { key: 'condition', header: 'Condition', render: (item: any) => item.checkinCondition || '-' },
    { key: 'notes', header: 'Notes', render: (item: any) => item.checkinNotes || '-' },
  ];

  const transferCols = [
    { key: 'asset', header: 'Asset', render: (item: any) => `${item.asset.name} (${item.asset.assetTag})` },
    { key: 'from', header: 'From', render: (item: any) => item.fromEmployee.name },
    { key: 'to', header: 'To', render: (item: any) => item.toEmployee.name },
    { key: 'reason', header: 'Reason', render: (item: any) => item.reason },
    { key: 'status', header: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { 
      key: 'actions', header: 'Actions', 
      render: (item: any) => item.status === 'REQUESTED' && isManagerOrAdmin && (
        <div className="flex space-x-2">
          <button onClick={() => handleDecide(item.id, 'APPROVED')} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={16}/></button>
          <button onClick={() => handleDecide(item.id, 'REJECTED')} className="text-red-600 p-1 hover:bg-red-50 rounded"><X size={16}/></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Allocations & Transfers" 
        action={
          isManagerOrAdmin && (
            <button onClick={() => setNewDialog(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              <Plus size={18} />
              <span>New Allocation</span>
            </button>
          )
        }
      />

      <div className="flex space-x-4 border-b border-gray-200">
        {(['active', 'transfers', 'history'] as const).map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 capitalize font-medium text-sm transition-colors border-b-2 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'active' && <DataTable data={allocations || []} columns={activeCols} keyExtractor={(i: any) => i.id} loading={loadingAlloc} />}
        {tab === 'history' && <DataTable data={allocations || []} columns={historyCols} keyExtractor={(i: any) => i.id} loading={loadingAlloc} />}
        {tab === 'transfers' && <DataTable data={transfers || []} columns={transferCols} keyExtractor={(i: any) => i.id} loading={loadingTrans} />}
      </div>

      <FormDialog
        open={!!returnDialog}
        onClose={() => setReturnDialog(null)}
        title={`Return Asset: ${returnDialog?.asset?.name}`}
        schema={returnSchema}
        onSubmit={(data) => handleReturn({ ...data, id: returnDialog?.id })} // Note: id goes to url function
      >
        {(form) => (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Check-in Condition</label>
              <input {...form.register('condition')} className="w-full border rounded-md p-2" placeholder="e.g. Good, Damaged" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea {...form.register('notes')} className="w-full border rounded-md p-2" rows={3} />
            </div>
          </>
        )}
      </FormDialog>

      <FormDialog
        open={newDialog}
        onClose={() => { setNewDialog(false); setConflictData(null); }}
        title={conflictData ? "Asset Not Available" : "New Allocation"}
        schema={conflictData ? transferSchema : allocationSchema}
        onSubmit={conflictData ? handleTransferRequest : handleAllocate}
        defaultValues={conflictData ? { assetId: conflictData.assetId, toEmployeeId: conflictData.employeeId } : {}}
      >
        {(form) => {
          if (conflictData) {
            return (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-md text-red-800 text-sm">
                  This asset is currently allocated to someone else. Would you like to request a transfer instead?
                </div>
                <input type="hidden" {...form.register('assetId')} />
                <input type="hidden" {...form.register('toEmployeeId')} />
                <div>
                  <label className="block text-sm font-medium mb-1">Reason for Transfer</label>
                  <textarea {...form.register('reason')} className="w-full border rounded-md p-2" rows={3} placeholder="Why do you need this asset?" />
                  {form.formState.errors.reason && <p className="text-red-500 text-xs mt-1">{form.formState.errors.reason.message as string}</p>}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset</label>
                <select {...form.register('assetId')} className="w-full border rounded-md p-2">
                  <option value="">Select an asset...</option>
                  {assets?.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - {a.status}</option>
                  ))}
                </select>
                {form.formState.errors.assetId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.assetId.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee</label>
                <select {...form.register('employeeId')} className="w-full border rounded-md p-2">
                  <option value="">Select an employee...</option>
                  {employees?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
                {form.formState.errors.employeeId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.employeeId.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Return Date</label>
                <input type="date" {...form.register('expectedReturnDate')} className="w-full border rounded-md p-2" />
              </div>
            </div>
          );
        }}
      </FormDialog>
    </div>
  );
}
