import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ScamDetectorCard() {
  const navigate = useNavigate();

  return (
    <div
      className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
      onClick={() => navigate('/scam-detector')}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <ShieldCheck className="w-7 h-7 text-court-gold" />
      </div>
      <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
        Scam Detector
      </h3>
      <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
        Analyze suspicious legal SMS, WhatsApp messages, or emails and receive
        risk scores with clear explanations.
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/scam-detector');
        }}
        className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
      >
        Scan Text <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
