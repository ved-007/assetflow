import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shared/PageHeader';
import { DataTable } from '../components/shared/DataTable';
import { FormDialog } from '../components/shared/FormDialog';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { StatusBadge } from '../components/shared/StatusBadge';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  auditorIds: z.array(z.string()).min(1, 'At least one auditor is required'),
});

const updateItemSchema = z.object({
  result: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  notes: z.string().optional(),
});

export function Audits() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState<number | null>(null);
  const [updateItemDialog, setUpdateItemDialog] = useState<any>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isManagerOrAdmin = ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'].includes(user?.role || '');

  // Queries
  const { data: audits, isLoading: loadingAudits } = useApiQuery(['audits'], '/audits');
  const { data: departments } = useApiQuery(['departments'], '/org/departments');
  const { data: employees } = useApiQuery(['employees'], '/org/employees');

  const selectedCycle = audits?.find((a: any) => a.id === selectedCycleId);

  // Mutations
  const createMut = useApiMutation('post', '/audits');
  const closeMut = useApiMutation('post', (vars: any) => `/audits/${vars.id}/close`);
  const updateMut = useApiMutation('post', (vars: any) => `/audits/${vars.cycleId}/items/${vars.itemId}`);

  const handleCreate = (data: any) => {
    const payload = {
      ...data,
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      auditorIds: data.auditorIds.map(Number),
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success('Audit cycle created');
        queryClient.invalidateQueries({ queryKey: ['audits'] });
        setCreateDialog(false);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const handleCloseCycle = () => {
    if (!closeDialog) return;
    closeMut.mutate({ id: closeDialog }, {
      onSuccess: () => {
        toast.success('Audit cycle closed');
        queryClient.invalidateQueries({ queryKey: ['audits'] });
        setCloseDialog(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const handleUpdateItem = (data: any) => {
    updateMut.mutate({ ...data, cycleId: selectedCycleId, itemId: updateItemDialog.id }, {
      onSuccess: () => {
        toast.success('Item updated');
        queryClient.invalidateQueries({ queryKey: ['audits'] });
        setUpdateItemDialog(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  // Columns for Cycle List
  const cycleCols = [
    { key: 'name', header: 'Cycle Name', render: (c: any) => <button onClick={() => setSelectedCycleId(c.id)} className="text-blue-600 font-medium hover:underline">{c.name}</button> },
    { key: 'period', header: 'Period', render: (c: any) => `${format(new Date(c.startDate), 'MMM d')} - ${format(new Date(c.endDate), 'MMM d, yyyy')}` },
    { key: 'scope', header: 'Scope', render: (c: any) => c.department?.name || c.location || 'All Assets' },
    { key: 'progress', header: 'Progress', render: (c: any) => {
      const total = c.items.length;
      const checked = c.items.filter((i: any) => i.result !== 'PENDING').length;
      return `${checked} / ${total}`;
    }},
    { key: 'status', header: 'Status', render: (c: any) => <StatusBadge status={c.status} /> },
  ];

  // Columns for Items List
  const itemCols = [
    { key: 'assetTag', header: 'Tag', render: (i: any) => i.asset.assetTag },
    { key: 'assetName', header: 'Asset', render: (i: any) => i.asset.name },
    { key: 'result', header: 'Result', render: (i: any) => <StatusBadge status={i.result} /> },
    { key: 'notes', header: 'Notes', render: (i: any) => i.notes || '-' },
    { key: 'checkedBy', header: 'Checked By', render: (i: any) => i.checkedBy?.name || '-' },
    { 
      key: 'actions', header: 'Actions', 
      render: (i: any) => selectedCycle?.status === 'OPEN' && (
        <button onClick={() => setUpdateItemDialog(i)} className="text-blue-600 hover:underline">Update</button>
      )
    },
  ];

  // Render detail view if a cycle is selected
  if (selectedCycleId && selectedCycle) {
    const flaggedItems = selectedCycle.items.filter((i: any) => ['MISSING', 'DAMAGED'].includes(i.result));

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-2">
          <button onClick={() => setSelectedCycleId(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCycle.name}</h1>
            <p className="text-gray-500">Status: {selectedCycle.status}</p>
          </div>
          <div className="flex-1" />
          {selectedCycle.status === 'OPEN' && isManagerOrAdmin && (
            <button onClick={() => setCloseDialog(selectedCycle.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Close Cycle
            </button>
          )}
        </div>

        {flaggedItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-800 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Discrepancy Report</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {flaggedItems.map((item: any) => (
                <div key={item.id} className="bg-white p-3 rounded border shadow-sm flex flex-col">
                  <span className="font-semibold text-gray-800">{item.asset.name} ({item.asset.assetTag})</span>
                  <span className="text-sm text-red-600 font-medium my-1">{item.result}</span>
                  {item.notes && <span className="text-sm text-gray-600">Note: {item.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-bold mb-4">Audit Checklist</h2>
          <DataTable data={selectedCycle.items} columns={itemCols} keyExtractor={(i: any) => i.id} />
        </div>

        <ConfirmDialog
          open={!!closeDialog}
          onClose={() => setCloseDialog(null)}
          onConfirm={handleCloseCycle}
          title="Close Audit Cycle"
          description="Are you sure you want to close this audit cycle? Any missing assets will be automatically marked as LOST."
          confirmText="Close Audit"
          loading={closeMut.isPending}
        />

        <FormDialog
          open={!!updateItemDialog}
          onClose={() => setUpdateItemDialog(null)}
          title={`Update Asset: ${updateItemDialog?.asset?.name}`}
          schema={updateItemSchema}
          onSubmit={handleUpdateItem}
          defaultValues={{ result: updateItemDialog?.result === 'PENDING' ? 'VERIFIED' : updateItemDialog?.result, notes: updateItemDialog?.notes || '' }}
        >
          {(form) => (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Result</label>
                <select {...form.register('result')} className="w-full border rounded-md p-2">
                  <option value="VERIFIED">Verified</option>
                  <option value="MISSING">Missing</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea {...form.register('notes')} className="w-full border rounded-md p-2" rows={3} />
              </div>
            </div>
          )}
        </FormDialog>
      </div>
    );
  }

  // Render main cycle list
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Asset Audits" 
        description="Manage physical audits and discrepancy reports"
        action={
          isManagerOrAdmin && (
            <button onClick={() => setCreateDialog(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              <Plus size={18} />
              <span>New Cycle</span>
            </button>
          )
        }
      />

      <DataTable data={audits || []} columns={cycleCols} keyExtractor={(i: any) => i.id} loading={loadingAudits} />

      <FormDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        title="Create Audit Cycle"
        schema={createSchema}
        onSubmit={handleCreate}
        defaultValues={{ auditorIds: [] }}
      >
        {(form) => (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cycle Name</label>
              <input type="text" {...form.register('name')} className="w-full border rounded-md p-2" placeholder="e.g. Q3 HQ Audit" />
              {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Scope</label>
                <select {...form.register('departmentId')} className="w-full border rounded-md p-2">
                  <option value="">All Departments</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location Scope</label>
                <input type="text" {...form.register('location')} className="w-full border rounded-md p-2" placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" {...form.register('startDate')} className="w-full border rounded-md p-2" />
                {form.formState.errors.startDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.startDate.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" {...form.register('endDate')} className="w-full border rounded-md p-2" />
                {form.formState.errors.endDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.endDate.message as string}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigned Auditors</label>
              <select multiple {...form.register('auditorIds')} className="w-full border rounded-md p-2" size={4}>
                {employees?.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              {form.formState.errors.auditorIds && <p className="text-red-500 text-xs mt-1">{form.formState.errors.auditorIds.message as string}</p>}
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  );
}
