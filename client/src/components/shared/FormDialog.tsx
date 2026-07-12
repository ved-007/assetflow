import React from 'react';
import { useForm, UseFormReturn, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

interface FormDialogProps<TFieldValues extends FieldValues> {
  open: boolean;
  onClose: () => void;
  title: string;
  schema: z.ZodType<any, any, any>;
  onSubmit: SubmitHandler<TFieldValues>;
  defaultValues?: Partial<TFieldValues>;
  children: (form: UseFormReturn<TFieldValues>) => React.ReactNode;
  loading?: boolean;
}

export function FormDialog<TFieldValues extends FieldValues>({
  open,
  onClose,
  title,
  schema,
  onSubmit,
  defaultValues,
  children,
  loading
}: FormDialogProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
          {children(form)}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
