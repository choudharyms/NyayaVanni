import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Clock, FileText, Trash2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const RISK_CONFIG = {
  high:   { label: 'High Risk',   color: 'bg-red-500/20 text-red-400 border-red-500/30',    icon: AlertTriangle },
  medium: { label: 'Medium Risk', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  low:    { label: 'Low Risk',    color: 'bg-green-500/20 text-green-400 border-green-500/30',  icon: CheckCircle },
  unknown:{ label: 'Unknown',     color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',  icon: FileText },
};

function RiskBadge({ level }) {
  const config = RISK_CONFIG[level?.toLowerCase()] || RISK_CONFIG.unknown;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RecentDocuments({ history, onClear }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  if (!history || history.length === 0) return null;

  return (
    <div className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Clock className="w-4 h-4 text-nyaya-400" />
          Recent Documents
          <span className="ml-1 bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>

      {/* List */}
      {open && (
        <div className="divide-y divide-slate-800">
          {history.map((entry) => (
            <button
              key={entry.documentId}
              onClick={() => navigate(`/dashboard/${entry.documentId}`)}
              className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-slate-800/60 transition-colors group"
            >
              <FileText className="w-4 h-4 mt-0.5 text-slate-500 group-hover:text-nyaya-400 transition-colors flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                  {entry.fileName}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <RiskBadge level={entry.riskLevel} />
                  {entry.fileType && (
                    <span className="text-xs text-slate-500 uppercase">{entry.fileType}</span>
                  )}
                  <span className="text-xs text-slate-600">{formatDate(entry.analyzedAt)}</span>
                </div>
              </div>
            </button>
          ))}

          {/* Clear button */}
          <div className="px-5 py-3">
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}