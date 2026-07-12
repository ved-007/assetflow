import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmText = 'Confirm', loading }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 text-red-600 rounded-full flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium">
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
