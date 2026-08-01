import React from 'react';
import { GitCompare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VersionDiffCard() {
  const navigate = useNavigate();

  return (
    <div
      className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
      onClick={() => navigate('/version-diff')}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <GitCompare className="w-7 h-7 text-court-gold" />
      </div>
      <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
        Version Diff Analysis
      </h3>
      <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
        Compare two document versions side-by-side. Instantly spot new
        obligations, increased penalties, or hidden terms.
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/version-diff');
        }}
        className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
      >
        Compare Versions <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
