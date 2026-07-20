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
    subtitle:
      "Paste a message / notice text. You'll get a risk score + reasons. (This is not legal advice.)",
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
      "If it's serious, consult a lawyer (Hire a Lawyer page).",
    ],
  },
  hi: {
    badge: 'संदिग्ध कानूनी संदेशों का पता लगाएं',
    title: 'कानूनी संदेशों के लिए स्कैम डिटेक्टर',
    subtitle:
      'संदेश / नोटिस का पाठ पेस्ट करें। आपको एक जोखिम स्कोर + कारण मिलेंगे। (यह कानूनी सलाह नहीं है।)',
    section_title: 'संदेश / नोटिस पाठ',
    copied: 'कॉपी किया गया',
    copy: 'कॉपी करें',
    reset: 'रीसेट करें',
    tip: 'टिप: यदि लिंक/फ़ोन नंबर मौजूद हैं तो उन्हें शामिल करें (पता लगाने में मदद मिलती है)।',
    btn_analyze: 'संदेश का विश्लेषण करें',
    btn_analyzing: 'विश्लेषण किया जा रहा है...',
    no_analysis_title: 'अभी तक कोई विश्लेषण नहीं हुआ है',
    no_analysis_desc: 'पाठ पेस्ट करें और विश्लेषण पर क्लिक करें।',
    analyzing_pattern:
      'स्कैम पैटर्न के लिए संदेश का विश्लेषण किया जा रहा है...',
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
    <div className="bg-court-walnut text-court-cream wood-panel relative min-h-screen overflow-hidden font-sans transition-colors duration-300">
      {/* Radial vignette backdrop */}
      <div className="court-vignette pointer-events-none absolute inset-0 z-0 opacity-95"></div>

      <nav className="border-court-gold/25 bg-court-walnut/90 sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="bg-court-walnut border-court-gold/30 hover:bg-court-gold hover:text-court-walnut text-court-cream cursor-pointer rounded-full border p-2 transition"
              aria-label={ARIA_LABELS.GO_BACK}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div
              className="text-court-cream flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight"
              onClick={() => navigate('/')}
            >
              <span className="bg-court-gold/15 border-court-gold/25 inline-flex h-9 w-9 items-center justify-center rounded-full border">
                <Scale className="text-court-gold h-5 w-5" />
              </span>
              <span>
                Nyaya
                <span className="text-court-gold font-semibold">Vanni</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-court-gold/10 border-court-gold/25 text-court-gold hidden items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold sm:flex">
              <Sparkles className="text-court-gold h-4 w-4" />
              Scam Detector
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-court-gold/10 border-court-gold/20 text-court-gold animate-pulse-soft mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
            <ShieldAlert className="h-4 w-4" />
            {L.badge}
          </div>
          <h1 className="text-court-cream font-serif text-4xl leading-tight font-bold md:text-5xl">
            {L.title}
          </h1>
          <p className="text-court-muted mt-4 text-base leading-relaxed md:text-lg">
            {L.subtitle}
          </p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-5">
          {/* Left panel: Input Area */}
          <div className="court-card rounded-3xl p-8 shadow-2xl transition-all duration-300 lg:col-span-3">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-court-cream font-serif text-xl font-bold">
                {L.section_title}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCopy}
                  disabled={!text.trim() || analyzing}
                  className="bg-court-walnut border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs transition disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? L.copied : L.copy}
                </button>
                <button
                  onClick={onReset}
                  disabled={analyzing}
                  className="bg-court-walnut border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs transition disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
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
              className="bg-court-walnut/40 border-court-gold/30 text-court-cream placeholder:text-court-muted focus:ring-court-gold/20 focus:border-court-gold w-full rounded-2xl border p-4 transition focus:ring-2 focus:outline-none disabled:opacity-50"
            />

            {validationError && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                {validationError}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-court-muted text-xs leading-relaxed">
                {L.tip}
              </p>
              <button
                onClick={onAnalyze}
                disabled={analyzing}
                className="text-court-walnut bg-court-gold cursor-pointer rounded-full px-8 py-3 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500 disabled:opacity-50 disabled:hover:scale-100"
              >
                {analyzing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {L.btn_analyzing}
                  </span>
                ) : (
                  L.btn_analyze
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Results Area */}
          <div className="court-card rounded-3xl p-8 shadow-2xl transition-all duration-300 lg:col-span-2">
            {!analysis && !analyzing ? (
              <div className="py-12 text-center">
                <ShieldCheck className="text-court-gold/60 mx-auto mb-4 h-14 w-14" />
                <h3 className="text-court-cream font-serif text-xl font-bold">
                  {L.no_analysis_title}
                </h3>
                <p className="text-court-muted mt-2 text-sm">
                  {L.no_analysis_desc}
                </p>
              </div>
            ) : analyzing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-5 flex items-center gap-2">
                  <div
                    className="bg-court-gold h-3 w-3 animate-bounce rounded-full"
                    style={{ animationDelay: '0s' }}
                  ></div>
                  <div
                    className="bg-court-gold h-3 w-3 animate-bounce rounded-full"
                    style={{ animationDelay: '0.15s' }}
                  ></div>
                  <div
                    className="bg-court-gold h-3 w-3 animate-bounce rounded-full"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                </div>
                <p className="text-court-muted text-sm">
                  {L.analyzing_pattern}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-court-muted text-xs font-semibold tracking-wider uppercase">
                      {L.risk_score}
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-court-cream font-serif text-4xl font-bold">
                        {analysis.score}
                      </span>
                      <span className="text-court-muted text-xs">/ 100</span>
                    </div>
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                        risk.tone === 'high'
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                          : risk.tone === 'mid'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {risk.tone === 'high' ? (
                        <BadgeAlert className="h-4 w-4" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                      {risk.label}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="bg-court-walnut border-court-gold/15 h-2.5 overflow-hidden rounded-full border">
                      <div
                        className="bg-court-gold h-full rounded-full"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                    <p className="text-court-muted mt-2 text-right text-[10px]">
                      {L.heuristic_score}
                    </p>
                  </div>
                </div>

                <div className="border-court-gold/15 mt-8 border-t pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-court-cream text-md font-serif font-bold">
                      {L.reasons_flagged}
                    </h4>
                    <button
                      onClick={onCopyResult}
                      className="bg-court-walnut border-court-gold/25 hover:border-court-gold/50 text-court-muted hover:text-court-cream inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {resultCopied ? L.copied : L.copy}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {RULES.map((r) => {
                      const hit = analysis.hits.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all duration-300 ${
                            hit
                              ? 'border-court-gold/45 bg-court-gold/10 text-court-cream'
                              : 'border-court-gold/15 bg-court-walnut/20 text-court-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {hit ? (
                              <BadgeAlert className="text-court-gold h-4 w-4" />
                            ) : (
                              <BadgeCheck className="text-court-gold/30 h-4 w-4" />
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

                  <div className="border-court-gold/20 bg-court-walnut/45 mt-6 rounded-2xl border p-5">
                    <p className="text-court-cream text-xs font-bold tracking-wider uppercase">
                      {L.what_next}
                    </p>
                    <ul className="text-court-muted mt-3 list-inside list-disc space-y-2 text-xs">
                      {L.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="text-court-muted/70 mt-6 text-center text-[10px]">
              {L.note}
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 mt-auto w-full">
        <Footer />
      </section>
    </div>
  );
}
