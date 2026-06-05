import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status) {
  if (!status) return 'Uploaded';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function DocumentHistorySidebar({
  documents,
  activeDocumentId,
  collapsed,
  loading,
  deletingId,
  onToggle,
  onSelect,
  onDelete,
}) {
  return (
    <aside
      className={`sticky top-24 h-fit overflow-hidden border bg-white shadow-sm transition-all duration-300 dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${
        collapsed ? 'lg:w-16 rounded-xl' : 'lg:w-72 rounded-2xl'
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b p-4 border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-nyaya-600 dark:text-nyaya-400" />
            <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              Document History
            </h2>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand document history' : 'Collapse document history'}
          title={collapsed ? 'Expand document history' : 'Collapse document history'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents
            </div>
          ) : documents.length === 0 ? (
            <div className="px-3 py-6 text-sm text-slate-500 dark:text-slate-400">
              No uploaded documents yet.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isActive = doc.document_id === activeDocumentId;
                const isDeleting = deletingId === doc.document_id;

                return (
                  <div
                    key={doc.document_id}
                    className={`group flex items-start gap-2 rounded-xl border p-2 transition-colors ${
                      isActive
                        ? 'border-nyaya-300 bg-nyaya-50 dark:border-nyaya-700/60 dark:bg-nyaya-950/30'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-950/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(doc.document_id)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {doc.filename || 'Untitled document'}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatDate(doc.uploaded_at)}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {statusLabel(doc.status)}
                          </span>
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(doc.document_id)}
                      disabled={isDeleting}
                      aria-label={`Delete ${doc.filename || 'document'}`}
                      title="Delete document"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
