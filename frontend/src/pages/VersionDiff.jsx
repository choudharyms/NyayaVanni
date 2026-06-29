import React, { useState, useRef, useCallback } from 'react';
import {
  GitCompare,
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  ShieldAlert,
  TrendingUp,
  UserMinus,
  Eye,
  CheckCircle2,
  Scale,
  Plus,
  Minus,
  DollarSign,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { VERSION_DIFF, MESSAGES, HEADERS } from '../constants';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SEVERITY_BADGE = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  critical:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

function SeverityBadge({ level }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${SEVERITY_BADGE[level] || SEVERITY_BADGE.low}`}
    >
      {level}
    </span>
  );
}

function DropZone({ label, file, onFile, onClear, gradientFrom, gradientTo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragError, setDragError] = useState(false);
  const allowedTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const isValidFile = (file) => {
  return file && allowedTypes.includes(file.type);
};

  const handleDrop = useCallback(
  (e) => {
    e.preventDefault();
    setDragging(false);

    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;

    if (!isValidFile(dropped)) {
      setDragError(true);
      return;
    }

    setDragError(false);
    onFile(dropped);
  },
  [onFile]
);

  return (
    <div
      className="relative w-full animate-float group flex-1 min-w-0"
      style={{
        animationDelay: label === VERSION_DIFF.OLD_DOCUMENT ? '0s' : '0.2s',
      }}
    >
      <div
        className={`absolute inset-0 transition-all duration-500 transform translate-x-1 translate-y-2 bg-linear-to-r ${gradientFrom} ${gradientTo} rounded-4xl blur-xl -z-10 group-hover:blur-2xl group-hover:scale-105`}
      ></div>
      <div
        className={`h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-4xl p-8 border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-72 ${
          dragError
          ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          : dragging
            ? 'border-nyaya-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
            : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:-translate-y-2 cursor-pointer'
        }`}
        onDragEnter={(e) => {
  e.preventDefault();

  const draggedFile = e.dataTransfer.items?.[0];

  if (draggedFile && !allowedTypes.includes(draggedFile.type)) {
    setDragError(true);
    setDragging(false);
  } else {
    setDragError(false);
    setDragging(true);
  }
}}
        onDragLeave={() => {
  setDragging(false);
  setDragError(false);
}}
        onDragOver={(e) => {
  e.preventDefault();

  const draggedFile = e.dataTransfer.items?.[0];

  if (draggedFile && !allowedTypes.includes(draggedFile.type)) {
    setDragError(true);
    setDragging(false);
  } else {
    setDragError(false);
    setDragging(true);
  }
}}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => {
            if (e.target.files?.[0]) onFile(e.target.files[0]);
          }}
        />
        {dragError && (
  <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">
    Unsupported file type. Please upload a PDF, PNG, or JPG.
  </p>
)}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">
          {label}
        </p>
        {file ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-nyaya-500/15 dark:bg-nyaya-500/20 ring-1 ring-nyaya-500/30 dark:ring-nyaya-500/50">
              <FileText className="w-7 h-7 text-nyaya-600 dark:text-nyaya-400" />
            </div>
            <p
              className="font-bold text-slate-850 dark:text-white truncate max-w-48 text-center"
              title={file.name}
            >
              {file.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="mt-2 flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <X className="w-4 h-4" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full shadow-inner bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 group-hover:scale-110 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-all duration-300">
              <Upload className="w-7 h-7 text-slate-500 dark:text-nyaya-400 group-hover:text-nyaya-600 dark:group-hover:text-nyaya-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Drop file here
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                PDF, PNG, or JPG · max 10 MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold transition-all bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-lg hover:scale-105 text-sm"
            >
              Browse file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function DiffResults({ data }) {
  const { summary, clauses, ai_summary } = data;

  // Calculate High Risk Changes count dynamically:
  // Count clauses that are modified, added, or removed AND are under "Liability", "Termination", or contain words indicating high-risk
  const highRiskCount = clauses.filter(
    (c) =>
      c.status !== 'unchanged' &&
      (c.category === 'Liability' ||
        c.category === 'Termination' ||
        /penalty|indemnity|liability|terminate|forfeit|sole discretion|jurisdiction|arbitration|court/i.test((c.oldClause || '') + ' ' + (c.newClause || '')))
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-3xl border border-slate-205 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 text-center hover:shadow-lg transition duration-300">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-2xl font-bold">{summary.matched}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Matched Clauses
          </p>
        </div>

        <div className="rounded-3xl border border-slate-205 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 text-center hover:shadow-lg transition duration-300">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 dark:text-amber-400 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-2xl font-bold">{summary.modified}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Modified Clauses
          </p>
        </div>

        <div className="rounded-3xl border border-slate-205 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 text-center hover:shadow-lg transition duration-300">
          <div className="flex items-center justify-center gap-1.5 text-blue-500 dark:text-blue-400 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-2xl font-bold">{summary.added}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Added Clauses
          </p>
        </div>

        <div className="rounded-3xl border border-slate-205 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 text-center hover:shadow-lg transition duration-300">
          <div className="flex items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-2xl font-bold">{summary.removed}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Removed Clauses
          </p>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-3xl border-2 border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50 p-4 text-center hover:shadow-lg transition duration-300">
          <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <span className="text-2xl font-bold">{highRiskCount}</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold uppercase tracking-wider">
            High Risk Changes
          </p>
        </div>
      </div>

      {/* AI Summary Panel */}
      <div className="rounded-4xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-white/95 to-slate-50/95 dark:from-slate-900/90 dark:to-slate-950/90 backdrop-blur-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <TrendingUp className="w-5 h-5 text-nyaya-500" />
          <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm uppercase tracking-wider">
            AI Comparison Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Payment Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Payment & Compensation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.payment}</p>
              </div>
            </div>

            {/* Liability Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 flex-shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Liability & Indemnity</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.liability}</p>
              </div>
            </div>

            {/* Termination Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 flex-shrink-0">
                <X className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Termination & Duration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.termination}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Privacy Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Privacy & Confidentiality</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.privacy}</p>
              </div>
            </div>

            {/* Intellectual Property Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Intellectual Property</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.intellectual_property}</p>
              </div>
            </div>

            {/* Dispute Resolution Section */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 flex-shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Dispute Resolution & Jurisdiction</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{ai_summary.dispute_resolution}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Clause Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            Clause-by-Clause Comparison
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {clauses.length} aligned clauses
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 font-semibold text-xs tracking-wider text-slate-450 dark:text-slate-500 uppercase px-4">
          <div>Document A (Original)</div>
          <div>Document B (Updated)</div>
        </div>

        <div className="space-y-4">
          {clauses.map((clause, index) => {
            const statusConfig = {
              unchanged: {
                border: 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5',
                dot: 'bg-emerald-500',
                badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-905/40 dark:text-emerald-300',
                label: 'Unchanged',
              },
              modified: {
                border: 'border-amber-200 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/5',
                dot: 'bg-amber-500',
                badge: 'bg-amber-100 text-amber-700 dark:bg-amber-905/40 dark:text-amber-300',
                label: 'Modified',
              },
              added: {
                border: 'border-blue-200 dark:border-blue-950/40 bg-blue-50/20 dark:bg-blue-950/5',
                dot: 'bg-blue-500',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-905/40 dark:text-blue-300',
                label: 'Added',
              },
              removed: {
                border: 'border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/5',
                dot: 'bg-rose-500',
                badge: 'bg-rose-100 text-rose-700 dark:bg-rose-905/40 dark:text-rose-300',
                label: 'Removed',
              },
            }[clause.status] || {
              border: 'border-slate-100 dark:border-slate-900 bg-slate-50/10',
              dot: 'bg-slate-400',
              badge: 'bg-slate-100 text-slate-700',
              label: 'Unknown',
            };

            return (
              <div
                key={index}
                className={`rounded-3xl border p-5 shadow-xs transition duration-200 hover:shadow-md ${statusConfig.border}`}
              >
                {/* Header line for category/status */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusConfig.badge}`}>
                    {statusConfig.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-405 dark:text-slate-500 uppercase tracking-widest ml-1">
                    {clause.category}
                  </span>
                </div>

                {/* Side-by-side content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {/* Left Column (Old) */}
                  <div className="relative">
                    {clause.status === 'added' ? (
                      <div className="h-full flex items-center justify-center p-4 bg-slate-50/45 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic select-none">
                        (Clause not present in original document)
                      </div>
                    ) : (
                      <p>{clause.oldClause}</p>
                    )}
                  </div>

                  {/* Right Column (New) */}
                  <div className="relative">
                    {clause.status === 'removed' ? (
                      <div className="h-full flex items-center justify-center p-4 bg-slate-50/45 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic select-none">
                        (Clause deleted in updated document)
                      </div>
                    ) : (
                      <p>{clause.newClause}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40 p-4">
        <Scale className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          This clause comparison is AI-generated and for informational purposes only. It
          does not constitute legal advice. Consult a qualified lawyer before
          acting on any findings.
        </p>
      </div>
    </div>
  );
}

export default function VersionDiff() {
  const navigate = useNavigate();
  useLanguage(); // Remove unused t variable
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const canAnalyse = oldFile && newFile && !loading;

  const handleAnalyse = async () => {
    if (!canAnalyse) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('old_document', oldFile);
    form.append('new_document', newFile);

    try {
      const { data } = await axios.post(`${API_BASE}/api/diff-analysis`, form, {
        headers: HEADERS.CONTENT_TYPE_MULTIPART,
        timeout: 120000,
      });
      setResult(data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        MESSAGES.SOMETHING_WENT_WRONG;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOldFile(null);
    setNewFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-nyaya-500 selection:text-white relative transition-colors duration-300">
      <nav className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-nyaya-500/15 border border-nyaya-500/25">
                <Scale className="text-nyaya-600 dark:text-nyaya-400 w-5 h-5" />
              </span>
              <span>
                Nyaya
                <span className="text-nyaya-600 dark:text-nyaya-400">
                  Vanni
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-250 text-sm">
              <GitCompare className="w-4 h-4 text-nyaya-600 dark:text-nyaya-300" />
              Version Diff
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row gap-6 items-stretch">
          <DropZone
            label={VERSION_DIFF.OLD_DOCUMENT}
            file={oldFile}
            onFile={setOldFile}
            onClear={() => setOldFile(null)}
            gradientFrom="from-blue-500/10 dark:from-blue-500/20"
            gradientTo="to-nyaya-500/10 dark:to-nyaya-500/20"
          />
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700">
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="sm:hidden w-full h-px bg-slate-200 dark:bg-slate-800" />
          </div>
          <DropZone
            label={VERSION_DIFF.NEW_DOCUMENT}
            file={newFile}
            onFile={setNewFile}
            onClear={() => setNewFile(null)}
            gradientFrom="from-violet-500/10 dark:from-violet-500/20"
            gradientTo="to-purple-500/10 dark:to-purple-500/20"
          />
        </div>

        <button
          onClick={handleAnalyse}
          disabled={!canAnalyse}
          className={`w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg text-base ${
            canAnalyse
              ? 'bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white hover:scale-[1.02] shadow-blue-500/20 dark:shadow-blue-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Analysing changes…
            </>
          ) : (
            <>
              <GitCompare className="w-5 h-5" /> Analyse Differences
            </>
          )}
        </button>

        {loading && (
          <div className="rounded-4xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 space-y-4">
            {[75, 55, 85, 45, 65].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
              />
            ))}
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
              Extracting text and running AI analysis — this may take 15–30
              seconds.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-900/20 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-0.5">
                Analysis failed
              </p>
              <p className="text-sm text-rose-700 dark:text-rose-400">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                Analysis Results
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2 transition-colors"
              >
                Start over
              </button>
            </div>
            <DiffResults data={result} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
