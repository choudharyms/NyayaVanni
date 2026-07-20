import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Document Analysis',
  chat: 'General Chat',
  lawyers: 'Lawyer Directory',
  faq: 'FAQ',
  'scam-detector': 'Scam Detector',
  'document-generator': 'Document Generator',
  contact: 'Contact Us',
  'privacy-policy': 'Privacy Policy',
  terms: 'Terms of Service',
  'version-diff': 'Version Diff',
};

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const path = '/' + segments.slice(0, idx + 1).join('/');
    const label =
      ROUTE_LABELS[seg] || (seg.length > 12 ? seg.substring(0, 8) + '…' : seg);
    const isLast = idx === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400"
    >
      <Link
        to="/"
        className="hover:text-nyaya-600 dark:hover:text-nyaya-400 flex items-center gap-1 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>

      {crumbs.map(({ path, label, isLast }) => (
        <React.Fragment key={path}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-600" />
          {isLast ? (
            <span
              className="max-w-[180px] truncate text-slate-800 dark:text-slate-200"
              aria-current="page"
            >
              {label}
            </span>
          ) : (
            <Link
              to={path}
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 max-w-[180px] truncate transition-colors"
            >
              {label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
