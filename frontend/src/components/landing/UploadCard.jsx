import React from 'react';
import {
  UploadCloud,
  ShieldCheck,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function UploadCard({
  file,
  dragActive,
  loading,
  inputRef,
  onDrag,
  onDrop,
  onChange,
  onButtonClick,
  onClearFile,
  onAnalyze,
}) {
  const { t } = useLanguage();

  return (
    <div className="relative group">
      <div
        className={`h-full court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer
          ${dragActive ? 'border-yellow-400 shadow-[0_0_25px_rgba(212,168,32,0.35)]' : ''}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/png,image/jpeg"
          onChange={onChange}
        />

        {!file ? (
          <>
            <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-7 h-7 text-court-gold" />
            </div>
            <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
              {t('landing.upload.title')}
            </h3>
            <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
              {t('landing.upload.desc')}
            </p>
            <button
              onClick={onButtonClick}
              className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg shadow-court-gold/10 hover:scale-105 transition-all text-sm"
            >
              <FileText className="w-4 h-4" /> {t('landing.upload.btn')}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-gold/15 border border-court-gold/30">
              <ShieldCheck className="w-7 h-7 text-court-gold" />
            </div>
            <h3
              className="mb-1 text-lg font-bold text-court-cream truncate max-w-[200px]"
              title={file.name}
            >
              {file.name}
            </h3>
            <p className="mb-8 text-xs text-court-muted">
              {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
            </p>

            <div className="flex flex-col sm:flex-row justify-center w-full gap-3">
              <button
                onClick={onClearFile}
                className="px-5 py-2 font-semibold text-court-muted hover:text-court-cream hover:bg-white/5 rounded-full transition-colors text-sm"
                disabled={loading}
              >
                {t('landing.upload.cancel')}
              </button>
              <button
                onClick={onAnalyze}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{' '}
                    {t('landing.upload.analyzing')}
                  </>
                ) : (
                  <>
                    {t('landing.upload.analyze')}{' '}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
