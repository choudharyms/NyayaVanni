import React, { useState, useRef, useCallback } from 'react';
import { GitCompare, Upload, FileText, ArrowRight, ArrowLeft, Loader2, AlertCircle, X, ShieldAlert, TrendingUp, UserMinus, Eye, CheckCircle2, Scale, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SEVERITY_BADGE = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  critical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

function SeverityBadge({ level }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${SEVERITY_BADGE[level] || SEVERITY_BADGE.low}`}>
      {level}
    </span>
  );
}

function DropZone({ label, file, onFile, onClear, gradientFrom, gradientTo }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }, [onFile]);

  return (
    <div className="relative w-full animate-float group flex-1 min-w-0" style={{ animationDelay: label === 'Old Document' ? '0s' : '0.2s' }}>
      <div className={`absolute inset-0 transition-all duration-500 transform translate-x-1 translate-y-2 bg-linear-to-r ${gradientFrom} ${gradientTo} rounded-4xl blur-xl -z-10 group-hover:blur-2xl group-hover:scale-105`}></div>

      <div
        className={`h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-4xl p-8 border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-72 ${
          dragging
            ? 'border-nyaya-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
            : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:-translate-y-2 cursor-pointer'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
        />

        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">{label}</p>

        {file ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-nyaya-500/15 dark:bg-nyaya-500/20 ring-1 ring-nyaya-500/30 dark:ring-nyaya-500/50">
              <FileText className="w-7 h-7 text-nyaya-600 dark:text-nyaya-400" />
            </div>
            <p className="font-bold text-slate-850 dark:text-white truncate max-w-48 text-center" title={file.name}>{file.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
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
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Drop file here</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">PDF, PNG, or JPG · max 10 MB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
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

function ResultSection({ icon: Icon, title, iconClass, borderClass, bgClass, items, renderItem }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">{title}</h4>
        <span className="ml-auto text-xs text-slate-400 font-medium">{items.length} finding{items.length !== 1 ? 's' : ''}</span>
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

  const riskCardStyle = {
    low: 'border-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    medium: 'border-amber-200 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    high: 'border-rose-200 bg-rose-50/80 dark:bg-rose-900/20 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
    critical: 'border-purple-200 bg-purple-50/80 dark:bg-purple-900/20 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
  }[risk] || '';

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
            <Plus className="w-4 h-4" />
            <span className="text-2xl font-bold">{diff_stats.lines_added}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Lines Added</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
            <Minus className="w-4 h-4" />
            <span className="text-2xl font-bold">{diff_stats.lines_removed}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Lines Removed</p>
        </div>
        <div className={`rounded-3xl border-2 p-4 text-center ${riskCardStyle}`}>
          <p className="text-2xl font-bold uppercase mb-1">{risk}</p>
          <p className="text-xs opacity-70">Overall Risk</p>
        </div>
      </div>

      {analysis.summary && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 space-y-1">

        <ResultSection
          icon={TrendingUp} title="Added Obligations" iconClass="text-amber-500"
          items={analysis.added_obligations}
          renderItem={(item, i) => (
            <div key={i} className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.clause}</span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          )}
        />

        <ResultSection
          icon={ShieldAlert} title="Increased Penalties" iconClass="text-rose-500"
          items={analysis.increased_penalties}
          renderItem={(item, i) => (
            <div key={i} className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-900/10 p-4">
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-2">{item.clause}</p>
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="line-through text-slate-400">{item.old_value}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-rose-600 dark:text-rose-400">{item.new_value}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          )}
        />

        <ResultSection
          icon={UserMinus} title="Reduced Employee Rights" iconClass="text-purple-500"
          items={analysis.reduced_employee_rights}
          renderItem={(item, i) => (
            <div key={i} className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-900/10 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.clause}</span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          )}
        />

        <ResultSection
          icon={Eye} title="Hidden / Subtle Modifications" iconClass="text-slate-500"
          items={analysis.hidden_modifications}
          renderItem={(item, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.clause}</span>
                <SeverityBadge level={item.risk} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          )}
        />

        <ResultSection
          icon={AlertCircle} title="New Legal Exposure" iconClass="text-red-500"
          items={analysis.new_legal_exposure}
          renderItem={(item, i) => (
            <div key={i} className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10 p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{item.clause}</span>
                <SeverityBadge level={item.severity} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
            </div>
          )}
        />
      </div>

      {analysis.recommended_actions?.length > 0 && (
        <div className="rounded-3xl border border-nyaya-200 dark:border-nyaya-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-nyaya-600 dark:text-nyaya-400" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">Recommended Actions</h4>
          </div>
          <ul className="space-y-2">
            {analysis.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-nyaya-500/15 dark:bg-nyaya-500/20 text-nyaya-700 dark:text-nyaya-300 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/40 p-4">
        <Scale className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          This analysis is AI-generated and for informational purposes only. It does not constitute legal advice. Consult a qualified lawyer before acting on any findings.
        </p>
      </div>
    </div>
  );
}

export default function VersionDiff() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong. Please try again.';
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
              onClick={() => navigate("/")}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-nyaya-500/15 border border-nyaya-500/25">
                <Scale className="text-nyaya-600 dark:text-nyaya-400 w-5 h-5" />
              </span>
              <span>Nyaya<span className="text-nyaya-600 dark:text-nyaya-400">Vanni</span></span>
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
            label="Old Document"
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
            label="New Document"
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
            <><Loader2 className="w-5 h-5 animate-spin" /> Analysing changes…</>
          ) : (
            <><GitCompare className="w-5 h-5" /> Analyse Differences</>
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
              Extracting text and running AI analysis — this may take 15–30 seconds.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-900/20 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-0.5">Analysis failed</p>
              <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">Analysis Results</h2>
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