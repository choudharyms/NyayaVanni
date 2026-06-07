import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

const BG_PRIMARY = `absolute top-[-10%] left-[-10%] w-[55%] h-[55%] 
  bg-nyaya-500/10 dark:bg-nyaya-500/25 rounded-full blur-[140px] 
  mix-blend-multiply dark:mix-blend-screen pointer-events-none`;

const BG_SECONDARY = `absolute bottom-[-12%] right-[-12%] w-[60%] h-[60%] 
  bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[160px] 
  mix-blend-multiply dark:mix-blend-screen pointer-events-none`;

const MAIN_CONTAINER = `relative min-h-screen overflow-hidden bg-slate-50 
  text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16 transition-colors duration-300`;

const NAV_BASE = `sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 
  bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300`;

const NAV_CONTAINER = "max-w-7xl mx-auto px-6 h-16 flex items-center justify-between";

const NAV_BADGE = `hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full 
  bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 
  text-slate-700 dark:text-slate-250 text-sm`;

const HEADER_BADGE = `inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full 
  bg-nyaya-500/10 border border-nyaya-500/20 text-nyaya-600 dark:text-nyaya-300 font-medium text-sm`;

const CARD_BASE = `rounded-[2rem] border border-slate-200 dark:border-white/10 
  bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-md`;

const ACTION_BUTTON = `h-9 px-3 rounded-full bg-slate-100 dark:bg-white/5 
  border border-slate-200 dark:border-white/10 hover:bg-slate-250 dark:hover:bg-white/10 
  transition text-slate-700 dark:text-slate-200 text-sm inline-flex items-center gap-2 cursor-pointer`;

const TEXTAREA_BASE = `w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 
  border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white 
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-nyaya-500/70 focus:border-nyaya-500/50 transition`;

const ANALYZE_BUTTON = `rounded-2xl px-6 py-3.5 font-semibold text-white
  bg-gradient-to-r from-nyaya-500 to-blue-600
  shadow-[0_0_25px_rgba(37,99,235,0.15)] dark:shadow-[0_0_25px_rgba(37,99,235,0.22)]
  transition-all duration-300
  hover:scale-[1.02] active:scale-[0.99]
  disabled:opacity-50 disabled:hover:scale-100 cursor-pointer`;

const BACK_BUTTON = `p-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 
  hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition`;

const LOGO_SPAN = `inline-flex items-center justify-center w-9 h-9 rounded-full 
  bg-nyaya-500/15 border border-nyaya-500/25`;

const NAV_LOGO_TEXT = `flex items-center gap-2 text-xl font-bold tracking-tight 
  text-slate-800 dark:text-white cursor-pointer`;

const EMPTY_STATE = `text-center py-10`;

const RISK_LABEL_BASE = `mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold`;

const RULE_ITEM_BASE = `flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300`;

const WHATS_NEXT_CARD = `mt-6 p-4 rounded-2xl border border-slate-200 dark:border-white/10 
  bg-slate-100/50 dark:bg-slate-950/30`;

const RULES = [
  {
    id: "urgent",
    label: "Urgency / pressure language",
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
    id: "payment",
    label: "Payment / transfer demand",
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
    id: "impersonation",
    label: "Authority impersonation",
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
    id: "links",
    label: "Suspicious links",
    patterns: [
      /(bit\.ly|tinyurl|t\.co|rb\.gy|cutt\.ly)/i,
      /https?:\/\/[^\s]+/i,
      /\b[a-z0-9-]+\.(xyz|top|click|info|shop|site|live)\b/i,
    ],
    weight: 18,
  },
  {
    id: "personal",
    label: "Asking for personal data / OTP / passwords",
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
    id: "threats",
    label: "Threats / intimidation",
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

  // Extra heuristics
  const hasManyCaps = (text.match(/[A-Z]/g) || []).length >= 20;
  const hasLotsOfSymbols = (text.match(/[!$%^&*()_+={}[\];:'",.<>/?\\|-]/g) || []).length >= 12;
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(text);

  if (hasManyCaps) score += 8;
  if (hasLotsOfSymbols) score += 6;
  if (hasPhone) score += 6;

  score = clamp(score, 0, 100);
  return { score, hits, flags: { hasManyCaps, hasLotsOfSymbols, hasPhone } };
}

function getRiskLabel(score) {
  if (score >= 70) return { label: "High Risk", tone: "high" };
  if (score >= 40) return { label: "Medium Risk", tone: "mid" };
  return { label: "Low Risk", tone: "low" };
}

export default function ScamDetector() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => {
    if (!lastAnalyzed) return null;
    return scoreText(lastAnalyzed);
  }, [lastAnalyzed]);

  const risk = useMemo(() => {
    if (!analysis) return null;
    return getRiskLabel(analysis.score);
  }, [analysis]);

  const onAnalyze = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLastAnalyzed(trimmed);
  };

  const onReset = () => {
    setText("");
    setLastAnalyzed(null);
    setCopied(false);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className={MAIN_CONTAINER}>
      {/* background */}
      <div className={BG_PRIMARY} />
      <div className={BG_SECONDARY} />

      {/* navbar */}
      <nav className={NAV_BASE}>
        <div className={NAV_CONTAINER}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={BACK_BUTTON}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              className={NAV_LOGO_TEXT}
              onClick={() => navigate("/")}
            >
              <span className={LOGO_SPAN}>
                <Scale className="text-nyaya-600 dark:text-nyaya-400 w-5 h-5" />
              </span>
              <span>Nyaya<span className="text-nyaya-600 dark:text-nyaya-400">Vanni</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={NAV_BADGE}>
              <Sparkles className="w-4 h-4 text-nyaya-600 dark:text-nyaya-300" />
              Scam Detector
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        {/* header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className={HEADER_BADGE}>
            <ShieldAlert className="w-4 h-4" />
            Detect suspicious legal messages
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-850 dark:text-white">
            Scam Detector for Legal Messages
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-350">
            Paste a message / notice text. You'll get a risk score + reasons. (This is not legal advice.)
          </p>
        </div>

        {/* content */}
        <div className="mt-10 grid lg:grid-cols-5 gap-6">
          {/* input */}
          <div className={`lg:col-span-3 ${CARD_BASE}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-slate-850 dark:text-white">Message / Notice Text</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCopy}
                  className={ACTION_BUTTON}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={onReset}
                  className={ACTION_BUTTON}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Paste the suspicious SMS/WhatsApp/email/legal notice text here…"
              className={TEXTAREA_BASE}
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tip: include links/phone numbers if present (helps detection).
              </p>

              <button
                onClick={onAnalyze}
                disabled={!text.trim()}
                className={ANALYZE_BUTTON}
              >
                Analyze Message
              </button>
            </div>
          </div>

          {/* result */}
          <div className={`lg:col-span-2 ${CARD_BASE}`}>
            {!analysis ? (
              <div className={EMPTY_STATE}>
                <ShieldCheck className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-850 dark:text-white">No analysis yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                  Paste text and click <span className="text-slate-800 dark:text-slate-200 font-semibold">Analyze</span>.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Risk Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-slate-850 dark:text-white">{analysis.score}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
                    </div>
                    <p
                      className={`${RISK_LABEL_BASE} ${
                        risk.tone === "high"
                          ? "bg-rose-500/15 border border-rose-500/25 text-rose-800 dark:text-rose-200"
                          : risk.tone === "mid"
                            ? "bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-amber-200"
                            : "bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200"
                      }`}
                    >
                      {risk.tone === "high" ? <BadgeAlert className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
                      {risk.label}
                    </p>
                  </div>

                  {/* meter */}
                  <div className="w-28">
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-nyaya-500 to-blue-600"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-650 text-right">Heuristic score</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-slate-850 dark:text-white font-bold mb-3">Reasons flagged</h4>
                  <div className="space-y-2">
                    {RULES.map((r) => {
                      const hit = analysis.hits.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          className={`${RULE_ITEM_BASE} ${
                            hit ? "border-nyaya-500/30 bg-nyaya-500/10 text-nyaya-900 dark:text-nyaya-200" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {hit ? (
                              <BadgeAlert className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                            ) : (
                              <BadgeCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            )}
                            <span className={`text-sm ${hit ? "text-slate-800 dark:text-slate-100" : "text-slate-605 dark:text-slate-400"}`}>
                              {r.label}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold ${hit ? "text-slate-700 dark:text-slate-200" : "text-slate-500"}`}>
                            +{r.weight}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={WHATS_NEXT_CARD}>
                    <p className="text-sm text-slate-800 dark:text-slate-300 font-semibold">What to do next</p>
                    <ul className="mt-2 text-sm text-slate-650 dark:text-slate-400 space-y-1 list-disc list-inside">
                      <li>Do not share OTP/passwords/bank details.</li>
                      <li>Verify the sender via official website/number.</li>
                      <li>If it's serious, consult a lawyer (Hire a Lawyer page).</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-500 dark:text-slate-600">
              Note: This is an assistive tool, not legal advice.
            </div>
          </div>
        </div>
      </main>

      <div className="max-w-7xl mx-auto px-6">
        <Footer />
      </div>
    </div>
  );
}