import React from 'react';
import Spinner from './Spinner';
 
const ConfirmDeleteModal = ({
  title,
  message,
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
  loading,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-slate-900/40" onClick={() => !loading && onCancel()} />
    <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
        >
          {loading && <Spinner />}
          {loading ? loadingLabel : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
 
export default ConfirmDeleteModal;
