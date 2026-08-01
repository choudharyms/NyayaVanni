import React from 'react';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-nyaya-600 focus:text-white focus:font-semibold focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
