import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  ClipboardPaste,
  BadgeAlert,
  BadgeCheck,
  Sparkles,
  Scale,
  Copy,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { ARIA_LABELS, PLACEHOLDERS } from '../constants';

const RULES = [
  {
    id: 'urgent',
    patterns: [
      /urgent/i,
      /immediately/i,
      /within\s+\d+\s*(hours?|mins?|minutes?)/i,
      /final\s+warning/i,
      /last\s+chance/i,
      /act\s+now/i,
    ],
    weight: 18,
  },
  {
    id: 'payment',
    patterns: [
      /pay\s+now/i,
      /transfer/i,
      /upi/i,
      /bank/i,
      /wallet/i,
      /crypto/i,
      /bitcoin/i,
      /gift\s*card/i,
      /fine/i,
      /penalty/i,
    ],
    weight: 22,
  },
  {
    id: 'impersonation',
    patterns: [
      /police/i,
      /court/i,
      /cyber\s*cell/i,
      /income\s*tax/i,
      /gst/i,
      /legal\s*notice/i,
      /advocate/i,
      /law\s*firm/i,
      /government/i,
      /ministry/i,
    ],
    weight: 16,
  },
  {
    id: 'links',
    patterns: [
      /(bit\.ly|tinyurl|t\.co|rb\.gy|cutt\.ly)/i,
      /https?:\/\/[^\s]+/i,
      /\b[a-z0-9-]+\.(xyz|top|click|info|shop|site|live)\b/i,
    ],
    weight: 18,
  },
  {
    id: 'personal',
    patterns: [
      /\botp\b/i,
      /password/i,
      /\bpin\b/i,
      /\baadhaar\b/i,
      /\bpan\b/i,
      /\bcard\b/i,
      /\bcvv\b/i,
      /\baccount\s*number\b/i,
      /\blogin\b/i,
    ],
    weight: 24,
  },
  {
    id: 'threats',
    patterns: [
      /arrest/i,
      /warrant/i,
      /case\s+filed/i,
      /legal\s+action/i,
      /jail/i,
      /freeze/i,
      /block/i,
      /blacklist/i,
    ],
    weight: 20,
  },
];

const SCAM_LANG = {
  en: {
    badge: 'Detect suspicious legal messages',
    title: 'Scam Detector for Legal Messages',
    subtitle: 'Paste a message / notice text. You\'ll get a risk score + reasons. (This is not legal advice.)',
    section_title: 'Message / Notice Text',
    copied: 'Copied',
    copy: 'Copy',
    reset: 'Reset',
    tip: 'Tip: include links/phone numbers if present (helps detection).',
    btn_analyze: 'Analyze Message',
    btn_analyzing: 'Analyzing...',
    no_analysis_title: 'No analysis yet',
    no_analysis_desc: 'Paste text and click Analyze.',
    analyzing_pattern: 'Analyzing message for scam patterns...',
    risk_score: 'Risk Score',
    risk_high: 'High Risk',
    risk_mid: 'Medium Risk',
    risk_low: 'Low Risk',
    heuristic_score: 'Heuristic score',
    reasons_flagged: 'Reasons flagged',
    what_next: 'What to do next',
    note: 'Note: This is an assistive tool, not legal advice.',
    error_empty: 'Please enter some text to analyze.',
    error_short: 'Message text must be at least 10 characters long.',
    rules: {
      urgent: 'Urgency / pressure language',
      payment: 'Payment / transfer demand',
      impersonation: 'Authority impersonation',
      links: 'Suspicious links',
      personal: 'Asking for personal data / OTP / passwords',
      threats: 'Threats / intimidation',
    },
    tips: [
      'Do not share OTP/passwords/bank details.',
      'Verify the sender via official website/number.',
      'If it\'s serious, consult a lawyer (Hire a Lawyer page).',
    ],
  },
  hi: {
    badge: 'संदिग्ध कानूनी संदेशों का पता लगाएं',
    title: 'कानूनी संदेशों के लिए स्कैम डिटेक्टर',
    subtitle: 'संदेश / नोटिस का पाठ पेस्ट करें। आपको एक जोखिम स्कोर + कारण मिलेंगे। (यह कानूनी सलाह नहीं है।)',
    section_title: 'संदेश / नोटिस पाठ',
    copied: 'कॉपी किया गया',
    copy: 'कॉपी करें',
    reset: 'रीसेट करें',
    tip: 'टिप: यदि लिंक/फ़ोन नंबर मौजूद हैं तो उन्हें शामिल करें (पता लगाने में मदद मिलती है)।',
    btn_analyze: 'संदेश का विश्लेषण करें',
    btn_analyzing: 'विश्लेषण किया जा रहा है...',
    no_analysis_title: 'अभी तक कोई विश्लेषण नहीं हुआ है',
    no_analysis_desc: 'पाठ पेस्ट करें और विश्लेषण पर क्लिक करें।',
    analyzing_pattern: 'स्कैम पैटर्न के लिए संदेश का विश्लेषण किया जा रहा है...',
    risk_score: 'जोखिम स्कोर',
    risk_high: 'उच्च जोखिम',
    risk_mid: 'मध्यम जोखिम',
    risk_low: 'कम जोखिम',
    heuristic_score: 'अनुमानित स्कोर',
    reasons_flagged: 'चिह्नित किए गए कारण',
    what_next: 'आगे क्या करना है',
    note: 'नोट: यह एक सहायक उपकरण है, कानूनी सलाह नहीं है।',
    error_empty: 'विश्लेषण करने के लिए कृपया कुछ पाठ दर्ज करें।',
    error_short: 'संदेश पाठ कम से कम 10 वर्णों का होना चाहिए।',
    rules: {
      urgent: 'जल्दबाजी / दबाव की भाषा',
      payment: 'भुगतान / स्थानांतरण की मांग',
      impersonation: 'प्राधिकरण का रूप धारण करना',
      links: 'संदिग्ध लिंक',
      personal: 'व्यक्तिगत डेटा / ओटीपी / पासवर्ड मांगना',
      threats: 'धमकी / डराना-धमकाना',
    },
    tips: [
      'ओटीपी/पासवर्ड/बैंक विवरण साझा न करें।',
      'आधिकारिक वेबसाइट/नंबर के माध्यम से प्रेषक को सत्यापित करें।',
      'यदि यह गंभीर है, तो किसी वकील से परामर्श लें (वकील किराए पर लें पृष्ठ)।',
    ],
  },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreText(text) {
  const hits = [];
  let score = 0;
  for (const rule of RULES) {
    const matched = rule.patterns.some((re) => re.test(text));
    if (matched) {
      score += rule.weight;
      hits.push(rule.id);
    }
  }
  const hasManyCaps = (text.match(/[A-Z]/g) || []).length >= 20;
  const hasLotsOfSymbols =
    (text.match(/[!$%^&*()_+={}[\];:'",.<>/?\\|-]/g) || []).length >= 12;
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);
  if (hasManyCaps) score += 8;
  if (hasLotsOfSymbols) score += 6;
  if (hasPhone) score += 6;
  score = clamp(score, 0, 100);
  return { score, hits, flags: { hasManyCaps, hasLotsOfSymbols, hasPhone } };
}

export default function ScamDetector() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [text, setText] = useState('');
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resultCopied, setResultCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  const L = SCAM_LANG[language] || SCAM_LANG.en;

  const analysis = useMemo(() => {
    if (!lastAnalyzed) return null;
    return scoreText(lastAnalyzed);
  }, [lastAnalyzed]);

  const risk = useMemo(() => {
    if (!analysis) return null;
    const score = analysis.score;
    if (score >= 70) return { label: L.risk_high, tone: 'high' };
    if (score >= 40) return { label: L.risk_mid, tone: 'mid' };
    return { label: L.risk_low, tone: 'low' };
  }, [analysis, L]);

  const onAnalyze = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError(L.error_empty);
      return;
    }
    if (trimmed.length < 10) {
      setValidationError(L.error_short);
      return;
    }

    setValidationError('');
    setAnalyzing(true);
    setTimeout(() => {
      setLastAnalyzed(trimmed);
      setAnalyzing(false);
    }, 1800);
  };

  const onReset = () => {
    setText('');
    setLastAnalyzed(null);
    setCopied(false);
    setAnalyzing(false);
    setResultCopied(false);
    setValidationError('');
  };

  const onCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  const onCopyResult = async () => {
    if (!analysis) return;
    try {
      const flaggedReasons = analysis.hits
        .map((id) => L.rules[id])
        .filter(Boolean)
        .join(', ');
      const summary = `Risk Score: ${analysis.score}/100 (${risk.label})\nFlagged: ${flaggedReasons || 'None'}\n\nAnalyzed Text:\n${lastAnalyzed}`;
      await navigator.clipboard.writeText(summary);
      setResultCopied(true);
      setTimeout(() => setResultCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-court-walnut text-court-cream wood-panel transition-colors duration-300 font-sans">
      {/* Radial vignette backdrop */}
      <div className="absolute inset-0 court-vignette opacity-95 pointer-events-none z-0"></div>

      <nav className="sticky top-0 z-30 border-b border-court-gold/25 bg-court-walnut/90 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-court-walnut border border-court-gold/30 hover:bg-court-gold hover:text-court-walnut text-court-cream transition cursor-pointer"
              aria-label={ARIA_LABELS.GO_BACK}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-court-cream cursor-pointer" onClick={() => navigate('/')}>
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-court-gold/15 border border-court-gold/25">
                <Scale className="text-court-gold w-5 h-5" />
              </span>
              <span>
                Nyaya
                <span className="text-court-gold font-semibold">Vanni</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-court-gold/10 border border-court-gold/25 text-court-gold text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-court-gold" />
              Scam Detector
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-court-gold/10 border border-court-gold/20 text-court-gold font-medium text-xs animate-pulse-soft">
            <ShieldAlert className="w-4 h-4" />
            {L.badge}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-court-cream leading-tight">
            {L.title}
          </h1>
          <p className="mt-4 text-base md:text-lg text-court-muted leading-relaxed">
            {L.subtitle}
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-5 gap-8 items-start">
          {/* Left panel: Input Area */}
          <div className="lg:col-span-3 court-card p-8 rounded-3xl shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-bold font-serif text-court-cream">
                {L.section_title}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCopy}
                  disabled={!text.trim() || analyzing}
                  className="h-9 px-4 rounded-full bg-court-walnut border border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? L.copied : L.copy}
                </button>
                <button
                  onClick={onReset}
                  disabled={analyzing}
                  className="h-9 px-4 rounded-full bg-court-walnut border border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  {L.reset}
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (validationError) setValidationError('');
              }}
              rows={10}
              disabled={analyzing}
              placeholder={PLACEHOLDERS.SCAM_DETECTOR}
              className="w-full p-4 rounded-2xl bg-court-walnut/40 border border-court-gold/30 text-court-cream placeholder:text-court-muted focus:outline-none focus:ring-2 focus:ring-court-gold/20 focus:border-court-gold transition disabled:opacity-50"
            />

            {validationError && (
              <p className="text-red-400 text-xs mt-2 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {validationError}
              </p>
            )}

            <div className="mt-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <p className="text-xs text-court-muted leading-relaxed">
                {L.tip}
              </p>
              <button
                onClick={onAnalyze}
                disabled={analyzing}
                className="rounded-full px-8 py-3 font-bold text-court-walnut bg-court-gold hover:bg-yellow-500 shadow-lg hover:scale-105 transition-all text-sm disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {analyzing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {L.btn_analyzing}
                  </span>
                ) : (
                  L.btn_analyze
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Results Area */}
          <div className="lg:col-span-2 court-card p-8 rounded-3xl shadow-2xl transition-all duration-300">
            {!analysis && !analyzing ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-14 h-14 text-court-gold/60 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-serif text-court-cream">
                  {L.no_analysis_title}
                </h3>
                <p className="text-court-muted mt-2 text-sm">
                  {L.no_analysis_desc}
                </p>
              </div>
            ) : analyzing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex gap-2 items-center mb-5">
                  <div
                    className="w-3 h-3 rounded-full bg-court-gold animate-bounce"
                    style={{ animationDelay: '0s' }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full bg-court-gold animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full bg-court-gold animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                </div>
                <p className="text-sm text-court-muted">
                  {L.analyzing_pattern}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-court-muted font-semibold uppercase tracking-wider">
                      {L.risk_score}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-bold font-serif text-court-cream">
                        {analysis.score}
                      </span>
                      <span className="text-xs text-court-muted">
                        / 100
                      </span>
                    </div>
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        risk.tone === 'high'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : risk.tone === 'mid'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {risk.tone === 'high' ? (
                        <BadgeAlert className="w-4 h-4" />
                      ) : (
                        <BadgeCheck className="w-4 h-4" />
                      )}
                      {risk.label}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="h-2.5 rounded-full bg-court-walnut border border-court-gold/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-court-gold"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-court-muted text-right">
                      {L.heuristic_score}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-court-gold/15 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-court-cream font-bold font-serif text-md">
                      {L.reasons_flagged}
                    </h4>
                    <button onClick={onCopyResult} className="h-8 px-3 rounded-full bg-court-walnut border border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition text-xs inline-flex items-center gap-1.5 cursor-pointer">
                      <Copy className="w-3.5 h-3.5" />
                      {resultCopied ? L.copied : L.copy}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {RULES.map((r) => {
                      const hit = analysis.hits.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                            hit
                              ? 'border-court-gold/45 bg-court-gold/10 text-court-cream'
                              : 'border-court-gold/15 bg-court-walnut/20 text-court-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {hit ? (
                              <BadgeAlert className="w-4 h-4 text-court-gold" />
                            ) : (
                              <BadgeCheck className="w-4 h-4 text-court-gold/30" />
                            )}
                            <span className="text-xs font-medium">
                              {L.rules[r.id]}
                            </span>
                          </div>
                          <span className="text-xs font-semibold">
                            +{r.weight}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-5 rounded-2xl border border-court-gold/20 bg-court-walnut/45">
                    <p className="text-xs text-court-cream font-bold uppercase tracking-wider">
                      {L.what_next}
                    </p>
                    <ul className="mt-3 text-xs text-court-muted space-y-2 list-disc list-inside">
                      {L.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 text-[10px] text-court-muted/70 text-center">
              {L.note}
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 w-full mt-auto">
        <Footer />
      </section>
    </div>
  );
}
