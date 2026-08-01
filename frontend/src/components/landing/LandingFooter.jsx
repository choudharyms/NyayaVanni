import React from 'react';
import {
  Scale,
  ChevronRight,
  Twitter,
  Github,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingFooter() {
  const navigate = useNavigate();

  const footerLinkClass =
    ' group text-left transition-all duration-300 ease-out hover:text-court-gold hover:translate-x-1 hover:[text-shadow:0_0_4px_rgba(212,168,32,0.4)]';

  return (
    <footer className="w-full mt-12 border-t border-court-gold/25 bg-court-walnut/95 backdrop-blur-xl z-20">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 text-xl font-bold text-court-cream">
              <span className="inline-flex items-center justify-center w-9 h-9 border rounded-full bg-court-gold/15 border-court-gold/25">
                <Scale className="w-4.5 h-4.5 text-court-gold" />
              </span>
              <span>
                Nyaya<span className="text-court-gold font-semibold">Vanni</span>
              </span>
            </div>
            <p className="mt-3.5 text-sm text-court-muted leading-relaxed">
              Understand Indian legal documents in simple language. Upload
              contracts or notices and get clearer insights fast.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-3 md:w-auto">
            <div>
              <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                Product
              </p>
              <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                <button
                  onClick={() => navigate('/chat')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Chat with AI
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate('/document-generator')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Generate NDA{' '}
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Upload Document{' '}
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/lawyers')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Hire a Lawyer
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/version-diff')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Version Diff
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                Resources
              </p>
              <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                <button
                  onClick={() => navigate('/faq')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  FAQ
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Privacy Policy{' '}
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className={`${footerLinkClass} flex items-center gap-1`}
                >
                  Terms of Service{' '}
                  <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                Contact
              </p>
              <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                <a
                  href="mailto:support@nyayavanni.com"
                  className="transition-all duration-300 ease-out hover:text-court-gold hover:translate-x-1 hover:[text-shadow:0_0_4px_rgba(212,168,32,0.4)]"
                >
                  support@nyayavanni.com
                </a>
                <span className="text-xs text-court-muted/70">
                  Mon–Fri, 10AM–6PM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-start justify-between gap-4 pt-6 mt-8 border-t border-court-gold/20 sm:flex-row">
          <p className="text-xs text-court-muted text-center sm:text-left mt-1">
            © {new Date().getFullYear()} NyayaVanni. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a
              href="#"
              className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="w-4.5 h-4.5" />
            </a>
            <a
              href="#"
              className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4.5 h-4.5" />
            </a>
            <a
              href="#"
              className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
          </div>

          <p className="text-xs text-court-muted text-center sm:text-right mt-1 italic">
            Not legal advice. For professional help, consult a lawyer.
          </p>
        </div>
      </div>
    </footer>
  );
}
