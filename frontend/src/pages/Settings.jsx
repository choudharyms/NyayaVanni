import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ensureSessionId } from '../utils/session';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Settings() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureSessionId(API_URL);
  }, []);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: data.detail || 'Deletion failed' });
      } else {
        setStatus({ type: 'success', message: data.message || 'Account deleted' });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Permanently delete your account and all associated data</p>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/40">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">This action is permanent and cannot be undone.</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    All your documents, analysis history, and account data will be permanently deleted.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Type <span className="font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-2 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(''); setStatus(null); }}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || loading}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
              {status && (
                <p className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {status.message}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
