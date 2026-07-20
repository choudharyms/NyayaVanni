import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Scale, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { ensureSessionId } from '../utils/session';

const FIELD_CONFIG = [
  {
    name: 'party_one_name',
    label: 'Disclosing Party Name',
    placeholder: 'e.g., ABC Technologies Pvt. Ltd.',
    type: 'text',
    required: true,
  },
  {
    name: 'party_two_name',
    label: 'Receiving Party Name',
    placeholder: 'e.g., John Doe',
    type: 'text',
    required: true,
  },
  {
    name: 'effective_date',
    label: 'Effective Date',
    placeholder: '',
    type: 'date',
    required: true,
  },
  {
    name: 'consideration_amount',
    label: 'Consideration Amount',
    placeholder: 'e.g., INR 50,000',
    type: 'text',
    required: true,
  },
  {
    name: 'jurisdiction',
    label: 'Jurisdiction',
    placeholder: 'e.g., New Delhi, India',
    type: 'text',
    required: true,
  },
];

const INITIAL_FORM = FIELD_CONFIG.reduce((acc, field) => {
  acc[field.name] = '';
  return acc;
}, {});

function getFilename(contentDispositionHeader) {
  if (!contentDispositionHeader) return 'NDA_Document.pdf';
  const match = contentDispositionHeader.match(/filename="?([^"]+)"?/i);
  return match?.[1] || 'NDA_Document.pdf';
}

export default function DocumentGenerator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isFormComplete = useMemo(() => {
    return FIELD_CONFIG.every(
      (field) => formData[field.name].trim().length > 0
    );
  }, [formData]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    setSubmitError('');
  };

  const validate = () => {
    const nextErrors = {};

    FIELD_CONFIG.forEach((field) => {
      const value = formData[field.name]?.trim();
      if (field.required && !value) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    });

    if (
      formData.party_one_name.trim() &&
      formData.party_two_name.trim() &&
      formData.party_one_name.trim().toLowerCase() ===
        formData.party_two_name.trim().toLowerCase()
    ) {
      nextErrors.party_two_name =
        'Receiving Party must be different from Disclosing Party.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsGenerating(true);
    setSubmitError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await ensureSessionId(apiUrl);

      const response = await fetch(`${apiUrl}/api/generate-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.detail || 'Failed to generate document.');
      }

      const pdfBlob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const filename = getFilename(response.headers.get('content-disposition'));

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setSubmitError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 pb-16 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="bg-nyaya-500/10 dark:bg-nyaya-500/20 pointer-events-none absolute top-[-8%] left-[-12%] h-[50%] w-[50%] rounded-full mix-blend-multiply blur-[140px] dark:mix-blend-screen" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[52%] w-[52%] rounded-full bg-blue-600/10 mix-blend-multiply blur-[150px] dark:bg-blue-600/20 dark:mix-blend-screen" />

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/60 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="cursor-pointer rounded-full border border-slate-200 bg-slate-100 p-2 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white"
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
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm text-slate-700 sm:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <Sparkles className="text-nyaya-600 dark:text-nyaya-300 h-4 w-4" />
              NDA Generator
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-nyaya-500/10 border-nyaya-500/20 text-nyaya-600 dark:text-nyaya-300 mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Generate legally structured documents
          </div>
          <h1 className="text-slate-850 text-4xl font-extrabold tracking-tight md:text-5xl dark:text-white">
            NDA Document Generator
          </h1>
          <p className="mt-4 text-base text-slate-600 md:text-lg dark:text-slate-300">
            Fill in the details below to generate a professional NDA PDF
            instantly.
          </p>
        </div>

        <form
          onSubmit={handleGenerate}
          className="mt-10 rounded-[2rem] border border-slate-200 bg-white/60 p-6 shadow-md backdrop-blur-xl md:p-8 dark:border-white/10 dark:bg-slate-900/60"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {FIELD_CONFIG.map((field) => (
              <div
                key={field.name}
                className={field.name === 'jurisdiction' ? 'md:col-span-2' : ''}
              >
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  {field.label}
                </label>
                <input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 dark:bg-slate-950/40 ${errors[field.name] ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'} text-slate-900 transition placeholder:text-slate-500 focus:ring-2 focus:outline-none dark:text-white dark:placeholder:text-slate-400 ${
                    errors[field.name]
                      ? 'focus:ring-rose-400/50'
                      : 'focus:ring-nyaya-500/70 focus:border-nyaya-500/50'
                  }`}
                />
                {errors[field.name] && (
                  <p className="mt-1.5 text-xs text-rose-300">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {submitError}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Disclaimer: Generated by NyayaVanni for informational purposes
              only.
            </p>
            <button
              type="submit"
              disabled={isGenerating || !isFormComplete}
              className="from-nyaya-500 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r to-blue-600 px-6 py-3.5 font-semibold text-white shadow-[0_0_25px_rgba(37,99,235,0.22)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                'Generate Document'
              )}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
