import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShow(scrollTop > 300);
      setScrollProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const startPos = window.scrollY;
    const startTime = performance.now();
    const duration = 400;

    const easeInOut = (t) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startPos * (1 - easeInOut(progress)));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Scroll to top"
      className={[
        'fixed z-50 flex items-center justify-center rounded-full transition-all duration-300',
        'bottom-6 right-6 sm:bottom-8 sm:right-8',
        'h-12 w-12 sm:h-14 sm:w-14',
        show
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
        'border border-teal-400/30 dark:border-teal-400/20',
        'shadow-[0_0_20px_rgba(20,184,166,0.15)]',
        'hover:scale-110 hover:border-teal-400/60 hover:shadow-[0_0_30px_rgba(20,184,166,0.35)]',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50',
        'cursor-pointer active:scale-95',
      ].join(' ')}
    >
      <div className="relative flex items-center justify-center">
        <svg
          className="absolute -inset-0.5 h-full w-full -rotate-90"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-teal-500/20 dark:stroke-teal-400/10"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-teal-500 dark:stroke-cyan-400"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - scrollProgress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <ChevronUp
          size={20}
          className="text-teal-500 dark:text-cyan-400 relative"
        />
      </div>
    </button>
  );
}
