import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { RISK_LABELS } from '../constants';

const RISK_CONFIG = {
  high: {
    label: RISK_LABELS.HIGH,
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle,
  },
  medium: {
    label: RISK_LABELS.MEDIUM,
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: AlertCircle,
  },
  low: {
    label: RISK_LABELS.LOW,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
  },
  unknown: {
    label: RISK_LABELS.UNKNOWN,
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: FileText,
  },
};

function RiskBadge({ level }) {
  const config = RISK_CONFIG[level?.toLowerCase()] || RISK_CONFIG.unknown;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RecentDocuments({ history, onClear }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  if (!history || history.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
          <svg
            className="mb-4 h-24 w-24 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mb-2 text-base font-semibold text-slate-400">
            No documents yet
          </h3>
          <p className="max-w-xs text-sm text-slate-500">
            Upload a legal document to get started with AI-powered analysis and
            risk assessment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-slate-800/50"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Clock aria-hidden="true" className="text-nyaya-400 h-4 w-4" />
          Recent Documents
          <span className="ml-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {history.length}
          </span>
        </div>
        {open ? (
          <ChevronUp aria-hidden="true" className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-slate-800">
          {history.map((entry) => (
            <button
              key={entry.documentId}
              onClick={() => navigate(`/dashboard/${entry.documentId}`)}
              className="group flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-800/60"
            >
              <FileText
                aria-hidden="true"
                className="group-hover:text-nyaya-400 mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 transition-colors"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                  {entry.fileName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <RiskBadge level={entry.riskLevel} />
                  {entry.fileType && (
                    <span className="text-xs text-slate-500 uppercase">
                      {entry.fileType}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">
                    {formatDate(entry.analyzedAt)}
                  </span>
                </div>
              </div>
            </button>
          ))}

          <div className="px-5 py-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-red-400"
            >
              <Trash2 aria-hidden="true" className="h-3 w-3" />
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
