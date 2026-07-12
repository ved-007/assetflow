import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/shared/PageHeader';
import { FormDialog } from '../components/shared/FormDialog';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { DataTable } from '../components/shared/DataTable';
import { StatusBadge } from '../components/shared/StatusBadge';

const bookingSchema = z.object({
  assetId: z.coerce.number(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().min(1, 'Purpose is required'),
});

export function Bookings() {
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [bookingDialog, setBookingDialog] = useState<{ start?: string, end?: string } | null>(null);
  const [cancelDialog, setCancelDialog] = useState<any>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Queries
  const { data: assets } = useApiQuery(['assets'], '/assets');
  const bookableAssets = assets?.filter((a: any) => a.isBookable) || [];

  const { data: bookings } = useApiQuery(
    ['bookings', selectedAssetId, dateRange.from, dateRange.to], 
    '/bookings', 
    { assetId: selectedAssetId || undefined, from: dateRange.from || undefined, to: dateRange.to || undefined },
    { enabled: !!selectedAssetId && !!dateRange.from }
  );

  const { data: myBookings, isLoading: loadingMyBookings } = useApiQuery(['bookings', 'mine'], '/bookings');
  const userBookings = myBookings?.filter((b: any) => b.bookedById === user?.id) || [];

  // Mutations
  const createMut = useApiMutation('post', '/bookings');
  const cancelMut = useApiMutation('post', (vars: any) => `/bookings/${vars.id}/cancel`);

  const handleDatesSet = (dateInfo: any) => {
    setDateRange({
      from: dateInfo.startStr,
      to: dateInfo.endStr,
    });
  };

  const handleDateSelect = (selectInfo: any) => {
    if (!selectedAssetId) {
      toast.error('Please select an asset first');
      selectInfo.view.calendar.unselect();
      return;
    }
    setBookingDialog({
      start: format(selectInfo.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(selectInfo.end, "yyyy-MM-dd'T'HH:mm")
    });
    selectInfo.view.calendar.unselect();
  };

  const handleCreateBooking = (data: any) => {
    createMut.mutate(data, {
      onSuccess: () => {
        toast.success('Booking created successfully');
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        setBookingDialog(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const handleCancelBooking = () => {
    if (!cancelDialog) return;
    cancelMut.mutate({ id: cancelDialog }, {
      onSuccess: () => {
        toast.success('Booking cancelled');
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        setCancelDialog(null);
      },
      onError: (err) => toast.error(err.message)
    });
  };

  const events = (bookings || []).map((b: any) => ({
    id: String(b.id),
    title: b.purpose,
    start: b.startTime,
    end: b.endTime,
    backgroundColor: b.status === 'CANCELLED' ? '#ef4444' : '#3b82f6',
    borderColor: b.status === 'CANCELLED' ? '#b91c1c' : '#2563eb',
  }));

  const myBookingsCols = [
    { key: 'asset', header: 'Asset', render: (item: any) => `${item.asset.name} (${item.asset.assetTag})` },
    { key: 'start', header: 'Start Time', render: (item: any) => format(new Date(item.startTime), 'PPp') },
    { key: 'end', header: 'End Time', render: (item: any) => format(new Date(item.endTime), 'PPp') },
    { key: 'purpose', header: 'Purpose', render: (item: any) => item.purpose },
    { key: 'status', header: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { 
      key: 'actions', header: 'Actions', 
      render: (item: any) => item.status !== 'CANCELLED' && (
        <button onClick={() => setCancelDialog(item.id)} className="text-red-600 hover:underline">Cancel</button>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Resource Bookings" 
        action={
          <button onClick={() => setBookingDialog({})} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <Plus size={18} />
            <span>New Booking</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <label className="block text-sm font-medium mb-2 text-gray-700">Select Resource</label>
            <select 
              value={selectedAssetId} 
              onChange={e => setSelectedAssetId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose an asset --</option>
              {bookableAssets.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
              ))}
            </select>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">How to book</h3>
            <p className="text-sm text-blue-700">
              Select an asset above to view its availability. Click and drag on the calendar to select a time slot.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-4 rounded-lg border shadow-sm min-h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateSelect}
            datesSet={handleDatesSet}
            height="100%"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
          />
        </div>
      </div>

      <div className="pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Bookings</h2>
        <DataTable data={userBookings} columns={myBookingsCols} keyExtractor={(i: any) => i.id} loading={loadingMyBookings} />
      </div>

      <FormDialog
        open={!!bookingDialog}
        onClose={() => setBookingDialog(null)}
        title="New Booking"
        schema={bookingSchema}
        onSubmit={handleCreateBooking}
        defaultValues={{
          assetId: selectedAssetId || undefined,
          startTime: bookingDialog?.start || '',
          endTime: bookingDialog?.end || '',
        }}
      >
        {(form) => (
          <div className="space-y-4">
            {createMut.isError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {createMut.error?.message}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Asset</label>
              <select {...form.register('assetId')} className="w-full border rounded-md p-2">
                <option value="">Select an asset...</option>
                {bookableAssets.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {form.formState.errors.assetId && <p className="text-red-500 text-xs mt-1">{form.formState.errors.assetId.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="datetime-local" {...form.register('startTime')} className="w-full border rounded-md p-2" />
                {form.formState.errors.startTime && <p className="text-red-500 text-xs mt-1">{form.formState.errors.startTime.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="datetime-local" {...form.register('endTime')} className="w-full border rounded-md p-2" />
                {form.formState.errors.endTime && <p className="text-red-500 text-xs mt-1">{form.formState.errors.endTime.message as string}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purpose</label>
              <input type="text" {...form.register('purpose')} className="w-full border rounded-md p-2" placeholder="Why do you need this?" />
              {form.formState.errors.purpose && <p className="text-red-500 text-xs mt-1">{form.formState.errors.purpose.message as string}</p>}
            </div>
          </div>
        )}
      </FormDialog>

      <ConfirmDialog
        open={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        loading={cancelMut.isPending}
      />
    </div>
  );
}
