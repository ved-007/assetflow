import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Search, Tag, MapPin } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shared/PageHeader';
import { DataTable, Column } from '../components/shared/DataTable';
import { FormDialog } from '../components/shared/FormDialog';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';

const ASSET_STATUSES = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED'] as const;

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.coerce.number({ invalid_type_error: 'Category is required' }),
  serialNumber: z.string().optional(),
  acquisitionDate: z.string().optional(),
  acquisitionCost: z.coerce.number().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  isBookable: z.coerce.boolean().optional(),
});

type Asset = {
  id: number;
  assetTag: string;
  name: string;
  category: { id: number; name: string };
  serialNumber?: string;
  location?: string;
  condition?: string;
  status: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  isBookable: boolean;
};

export function Assets() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role || '');

  const { data: assets, isLoading } = useApiQuery<Asset[]>(
    ['assets', { search, categoryFilter, statusFilter }],
    '/assets',
    { q: search || undefined, category: categoryFilter || undefined, status: statusFilter || undefined }
  );
  const { data: categories } = useApiQuery(['categories'], '/org/categories');

  const registerMut = useApiMutation('post', '/assets');
  const editMut = useApiMutation('patch', (vars: any) => `/assets/${vars.id}`);

  const handleRegister = (data: any) => {
    registerMut.mutate(data, {
      onSuccess: () => {
        toast.success('Asset registered successfully');
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        setRegisterOpen(false);
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleEdit = (data: any) => {
    editMut.mutate({ ...data, id: editAsset?.id }, {
      onSuccess: () => {
        toast.success('Asset updated successfully');
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        setEditAsset(null);
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const columns: Column<Asset>[] = [
    {
      key: 'assetTag', header: 'Asset Tag',
      render: (a) => <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">{a.assetTag}</span>,
    },
    {
      key: 'name', header: 'Name & Category',
      render: (a) => (
        <div>
          <div className="font-medium text-gray-900">{a.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Tag size={12} /> {a.category?.name}
            {a.isBookable && <span className="ml-1 text-purple-600 font-medium">[Bookable]</span>}
          </div>
        </div>
      ),
    },
    { key: 'serialNumber', header: 'Serial #', render: (a) => a.serialNumber || '-' },
    {
      key: 'location', header: 'Location',
      render: (a) => a.location ? <span className="flex items-center gap-1 text-sm"><MapPin size={12} className="text-gray-400" />{a.location}</span> : '-',
    },
    { key: 'condition', header: 'Condition', render: (a) => a.condition || '-' },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'acquired', header: 'Acquired',
      render: (a) => a.acquisitionDate ? new Intl.DateTimeFormat('en-IN').format(new Date(a.acquisitionDate)) : '-',
    },
    {
      key: 'cost', header: 'Cost',
      render: (a) => a.acquisitionCost ? `₹${a.acquisitionCost.toLocaleString('en-IN')}` : '-',
    },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (a: Asset) => (
        <button onClick={() => setEditAsset(a)} className="text-blue-600 hover:underline text-sm">Edit</button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets Directory"
        description={assets ? `${assets.length} assets registered` : undefined}
        action={canManage && (
          <button onClick={() => setRegisterOpen(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <Plus size={18} />
            <span>Register Asset</span>
          </button>
        )}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag or serial number…"
            className="w-full border rounded-md py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-md py-2 px-3 text-sm">
          <option value="">All Categories</option>
          {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md py-2 px-3 text-sm">
          <option value="">All Statuses</option>
          {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {!isLoading && assets?.length === 0 ? (
        <EmptyState title="No assets found" description="Try adjusting your filters, or register a new asset." />
      ) : (
        <DataTable data={assets || []} columns={columns} keyExtractor={(a) => a.id} loading={isLoading} />
      )}

      <FormDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register New Asset"
        schema={registerSchema}
        onSubmit={handleRegister}
        loading={registerMut.isPending}
      >
        {(form) => (
          <AssetFormFields form={form} categories={categories} />
        )}
      </FormDialog>

      <FormDialog
        open={!!editAsset}
        onClose={() => setEditAsset(null)}
        title={`Edit Asset: ${editAsset?.name}`}
        schema={registerSchema.partial()}
        onSubmit={handleEdit}
        defaultValues={editAsset ? {
          name: editAsset.name,
          categoryId: editAsset.category?.id,
          serialNumber: editAsset.serialNumber,
          location: editAsset.location,
          condition: editAsset.condition,
          isBookable: editAsset.isBookable,
        } as any : {}}
        loading={editMut.isPending}
      >
        {(form) => (
          <AssetFormFields form={form} categories={categories} />
        )}
      </FormDialog>
    </div>
  );
}

function AssetFormFields({ form, categories }: { form: any; categories: any }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Asset Name *</label>
        <input {...form.register('name')} className="w-full border rounded-md p-2" placeholder="e.g. Dell XPS 15 Laptop" />
        {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category *</label>
        <select {...form.register('categoryId')} className="w-full border rounded-md p-2">
          <option value="">Select a category...</option>
          {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {form.formState.errors.categoryId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.categoryId.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Serial Number</label>
        <input {...form.register('serialNumber')} className="w-full border rounded-md p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input {...form.register('location')} className="w-full border rounded-md p-2" placeholder="e.g. Bengaluru HQ, Floor 2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Acquisition Date</label>
          <input type="date" {...form.register('acquisitionDate')} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cost (₹)</label>
          <input type="number" {...form.register('acquisitionCost')} className="w-full border rounded-md p-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Condition</label>
        <input {...form.register('condition')} className="w-full border rounded-md p-2" placeholder="e.g. Good, Excellent, Fair" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isBookable" {...form.register('isBookable')} className="w-4 h-4" />
        <label htmlFor="isBookable" className="text-sm">Asset is bookable (room/vehicle)</label>
      </div>
    </div>
  );
}
