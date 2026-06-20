import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-24 right-6 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full
        transition-all duration-300

        ${
          show
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }

        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-xl

        border border-teal-400/30
        dark:border-teal-400/20

        shadow-[0_0_20px_rgba(20,184,166,0.15)]

        hover:scale-110
        hover:border-teal-400/60
        hover:shadow-[0_0_30px_rgba(20,184,166,0.35)]
      `}
    >
      <ChevronUp
        size={24}
        className="
          text-teal-500
          dark:text-cyan-400
        "
      />
    </button>
  );
}
