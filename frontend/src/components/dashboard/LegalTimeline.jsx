import React, { useMemo } from 'react';
import { CalendarClock, CalendarX } from 'lucide-react';

const DATE_TYPE_META = {
  notice_date: {
    title: 'Notice Date',
    description: 'Date on which the notice was issued',
  },
  response_deadline: {
    title: 'Response Deadline',
    description: 'Last date to submit your response',
  },
  effective_date: {
    title: 'Effective Date',
    description: 'Date the agreement takes effect',
  },
  signing_date: {
    title: 'Signing Date',
    description: 'Date the document was signed',
  },
  renewal_date: {
    title: 'Renewal Date',
    description: 'Scheduled renewal milestone',
  },
  termination_date: {
    title: 'Termination Date',
    description: 'Scheduled termination milestone',
  },
  payment_due: {
    title: 'Payment Due',
    description: 'Scheduled payment due date',
  },
  compliance_deadline: {
    title: 'Compliance Deadline',
    description: 'Deadline for regulatory compliance',
  },
};

function parseDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LegalTimeline({ dates = [], onSelectDate }) {
  const events = useMemo(() => {
    if (!Array.isArray(dates)) return [];

    return dates
      .map((entry) => {
        const parsed = parseDate(entry?.value);
        if (!parsed) return null;
        const meta = DATE_TYPE_META[entry.type] || {
          title: entry.type ? entry.type.replace(/_/g, ' ') : 'Important Date',
          description: 'AI-detected legal milestone',
        };
        return { ...entry, date: parsed, ...meta };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
  }, [dates]);

  if (!events.length) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800">
          <CalendarX className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No important dates were detected in this document.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CalendarClock className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
        <h3 className={`text-lg font-bold text-slate-900 dark:text-white`}>
          Legal Timeline
        </h3>
      </div>

      <ol className="relative ml-3 border-l-2 border-slate-200 dark:border-slate-700">
        {events.map((event, idx) => (
          <li key={`${event.type}-${idx}`} className="mb-8 ml-6 last:mb-0">
            <span className="absolute -left-[9px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-nyaya-500 ring-4 ring-slate-50 dark:ring-slate-900" />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {event.title}
                </span>
                <time
                  dateTime={event.value}
                  className="rounded-full bg-nyaya-50 dark:bg-nyaya-950/40 px-2.5 py-0.5 text-xs font-semibold text-nyaya-700 dark:text-nyaya-300 border border-nyaya-200 dark:border-nyaya-800/50"
                >
                  {formatDate(event.date)}
                </time>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {event.description}
              </p>
              {onSelectDate && (
                <button
                  onClick={() => onSelectDate(event)}
                  className="mt-1 self-start text-xs font-semibold text-nyaya-600 hover:text-nyaya-500 dark:text-nyaya-400 dark:hover:text-nyaya-300 underline underline-offset-2 cursor-pointer"
                >
                  View in document →
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
