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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { VERSION_DIFF, MESSAGES, HEADERS } from '../constants';
import { ensureSessionId } from '../utils/session';

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
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${SEVERITY_BADGE[level] || SEVERITY_BADGE.low}`}
    >
      {level}
    </span>
  );
}

function DropZone({ label, file, onFile, onClear, gradientFrom, gradientTo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragError, setDragError] = useState(false);
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];

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
      className="animate-float group relative w-full min-w-0 flex-1"
      style={{
        animationDelay: label === VERSION_DIFF.OLD_DOCUMENT ? '0s' : '0.2s',
      }}
    >
      <div
        className={`absolute inset-0 translate-x-1 translate-y-2 transform bg-linear-to-r transition-all duration-500 ${gradientFrom} ${gradientTo} -z-10 rounded-4xl blur-xl group-hover:scale-105 group-hover:blur-2xl`}
      ></div>
      <div
        className={`flex h-full min-h-72 flex-col items-center justify-center rounded-4xl border-2 bg-white/80 p-8 backdrop-blur-xl transition-all duration-300 dark:bg-slate-900/80 ${
          dragError
            ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            : dragging
              ? 'border-nyaya-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
              : 'hover:border-slate-350 cursor-pointer border-slate-200 hover:-translate-y-2 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:border-slate-600 dark:hover:bg-slate-800/80'
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
        <p className="mb-5 text-xs font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500">
          {label}
        </p>
        {file ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="bg-nyaya-500/15 dark:bg-nyaya-500/20 ring-nyaya-500/30 dark:ring-nyaya-500/50 flex h-14 w-14 items-center justify-center rounded-full ring-1">
              <FileText className="text-nyaya-600 dark:text-nyaya-400 h-7 w-7" />
            </div>
            <p
              className="text-slate-850 max-w-48 truncate text-center font-bold dark:text-white"
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
              className="mt-2 flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 shadow-inner ring-1 ring-slate-200 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-700 dark:group-hover:bg-slate-700">
              <Upload className="dark:text-nyaya-400 group-hover:text-nyaya-600 dark:group-hover:text-nyaya-300 h-7 w-7 text-slate-500" />
            </div>
            <div className="text-center">
              <p className="mb-1 font-semibold text-slate-700 dark:text-slate-300">
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
              className="hover:bg-slate-850 flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Browse file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function ResultSection({ icon: Icon, title, iconClass, items, renderItem }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <h4 className="text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-slate-200">
          {title}
        </h4>
        <span className="ml-auto text-xs font-medium text-slate-400">
          {items.length} finding{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  );
}

function DiffResults({ data }) {
  const { diff_stats, analysis } = data;
  const risk = analysis.overall_risk_level || 'low';

  const riskCardStyle =
    {
      low: 'border-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
      medium:
        'border-amber-200 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
      high: 'border-rose-200 bg-rose-50/80 dark:bg-rose-900/20 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
      critical:
        'border-purple-200 bg-purple-50/80 dark:bg-purple-900/20 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
    }[risk] || '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-center dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="mb-1 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Plus className="h-4 w-4" />
            <span className="text-2xl font-bold">{diff_stats.lines_added}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lines Added
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-center dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="mb-1 flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400">
            <Minus className="h-4 w-4" />
            <span className="text-2xl font-bold">
              {diff_stats.lines_removed}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lines Removed
          </p>
        </div>
        <div
          className={`rounded-3xl border-2 p-4 text-center ${riskCardStyle}`}
        >
          <p className="mb-1 text-2xl font-bold uppercase">{risk}</p>
          <p className="text-xs opacity-70">Overall Risk</p>
        </div>
      </div>

      {analysis.summary && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {analysis.summary}
          </p>
        </div>
      )}

      <div className="space-y-1 rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
        <ResultSection
          icon={TrendingUp}
          title={VERSION_DIFF.ADDED_OBLIGATIONS}
          iconClass="text-amber-500"
          items={analysis.added_obligations}
          renderItem={(item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/10"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.clause}
                </span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          )}
        />
        <ResultSection
          icon={ShieldAlert}
          title={VERSION_DIFF.INCREASED_PENALTIES}
          iconClass="text-rose-500"
          items={analysis.increased_penalties}
          renderItem={(item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-900/10"
            >
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {item.clause}
              </p>
              <div className="mb-2 flex items-center gap-3 text-sm">
                <span className="text-slate-400 line-through">
                  {item.old_value}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {item.new_value}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          )}
        />
        <ResultSection
          icon={UserMinus}
          title={VERSION_DIFF.REDUCED_EMPLOYEE_RIGHTS}
          iconClass="text-purple-500"
          items={analysis.reduced_employee_rights}
          renderItem={(item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-900/40 dark:bg-purple-900/10"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.clause}
                </span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          )}
        />
        <ResultSection
          icon={Eye}
          title={VERSION_DIFF.HIDDEN_MODIFICATIONS}
          iconClass="text-slate-500"
          items={analysis.hidden_modifications}
          renderItem={(item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700/50 dark:bg-slate-800/40"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.clause}
                </span>
                <SeverityBadge level={item.risk} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          )}
        />
        <ResultSection
          icon={AlertCircle}
          title={VERSION_DIFF.NEW_LEGAL_EXPOSURE}
          iconClass="text-red-500"
          items={analysis.new_legal_exposure}
          renderItem={(item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-900/10"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {item.clause}
                </span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {item.detail}
              </p>
            </div>
          )}
        />
      </div>

      {analysis.recommended_actions?.length > 0 && (
        <div className="border-nyaya-200 dark:border-nyaya-800/50 rounded-3xl border bg-white/80 p-6 backdrop-blur-xl dark:bg-slate-900/80">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-nyaya-600 dark:text-nyaya-400 h-4 w-4" />
            <h4 className="text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-slate-200">
              Recommended Actions
            </h4>
          </div>
          <ul className="space-y-2">
            {analysis.recommended_actions.map((action, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="bg-nyaya-500/15 dark:bg-nyaya-500/20 text-nyaya-700 dark:text-nyaya-300 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
        <Scale className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          This analysis is AI-generated and for informational purposes only. It
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
      await ensureSessionId(API_BASE);

      const { data } = await axios.post(`${API_BASE}/api/diff-analysis`, form, {
        headers: HEADERS.CONTENT_TYPE_MULTIPART,
        timeout: 120000,
        withCredentials: true,
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
    <div className="selection:bg-nyaya-500 relative min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-300 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/60 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div
              className="flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white"
              onClick={() => navigate('/')}
            >
              <span className="bg-nyaya-500/15 border-nyaya-500/25 inline-flex h-9 w-9 items-center justify-center rounded-full border">
                <Scale className="text-nyaya-600 dark:text-nyaya-400 h-5 w-5" />
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
            <div className="dark:text-slate-250 hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 sm:flex dark:border-white/10 dark:bg-white/5">
              <GitCompare className="text-nyaya-600 dark:text-nyaya-300 h-4 w-4" />
              Version Diff
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row">
          <DropZone
            label={VERSION_DIFF.OLD_DOCUMENT}
            file={oldFile}
            onFile={setOldFile}
            onClear={() => setOldFile(null)}
            gradientFrom="from-blue-500/10 dark:from-blue-500/20"
            gradientTo="to-nyaya-500/10 dark:to-nyaya-500/20"
          />
          <div className="flex flex-shrink-0 items-center justify-center">
            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 sm:flex dark:border-slate-700 dark:bg-slate-800">
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
            <div className="h-px w-full bg-slate-200 sm:hidden dark:bg-slate-800" />
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
          className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold shadow-lg transition-all duration-200 ${
            canAnalyse
              ? 'bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-blue-500/20 hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500 dark:shadow-blue-500/30'
              : 'cursor-not-allowed bg-slate-100 text-slate-400 shadow-none dark:bg-slate-800 dark:text-slate-600'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Analysing changes…
            </>
          ) : (
            <>
              <GitCompare className="h-5 w-5" /> Analyse Differences
            </>
          )}
        </button>

        {loading && (
          <div className="space-y-4 rounded-4xl border border-slate-200 bg-white/80 p-8 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
            {[75, 55, 85, 45, 65].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800"
                style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
              />
            ))}
            <p className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              Extracting text and running AI analysis — this may take 15–30
              seconds.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50/80 p-5 dark:border-rose-800/50 dark:bg-rose-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="mb-0.5 text-sm font-semibold text-rose-800 dark:text-rose-300">
                Analysis failed
              </p>
              <p className="text-sm text-rose-700 dark:text-rose-400">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 transition-colors hover:text-rose-600 dark:hover:text-rose-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Analysis Results
              </h2>
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
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
