import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS = {
  dashboard: "Document Analysis",
  chat: "General Chat",
  lawyers: "Lawyer Directory",
  faq: "FAQ",
  "scam-detector": "Scam Detector",
  "document-generator": "Document Generator",
  contact: "Contact Us",
  "privacy-policy": "Privacy Policy",
  terms: "Terms of Service",
  "version-diff": "Version Diff",
};

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    const label =
      ROUTE_LABELS[seg] ||
      (seg.length > 12 ? seg.substring(0, 8) + "…" : seg);
    const isLast = idx === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 flex-wrap"
    >
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {crumbs.map(({ path, label, isLast }) => (
        <React.Fragment key={path}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
          {isLast ? (
            <span
              className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]"
              aria-current="page"
            >
              {label}
            </span>
          ) : (
            <Link
              to={path}
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-colors truncate max-w-[180px]"
            >
              {label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
