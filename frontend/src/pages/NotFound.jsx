import { Link } from 'react-router-dom';
import { Scale, ArrowLeft, Home } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex w-full max-w-7xl justify-end px-6 py-6">
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="bg-nyaya-500/10 flex h-24 w-24 items-center justify-center rounded-full">
              <Scale className="text-nyaya-600 dark:text-nyaya-400 h-12 w-12" />
            </div>
          </div>

          <h1 className="from-nyaya-600 to-nyaya-400 bg-gradient-to-r bg-clip-text text-8xl font-black text-transparent md:text-9xl">
            404
          </h1>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
            Page Not Found
          </h2>

          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            The page you're looking for doesn't exist, has been moved, or the
            URL may be incorrect.
          </p>

          <p className="mt-2 text-slate-500 dark:text-slate-500">
            Let's help you get back to the right place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="from-nyaya-600 to-nyaya-500 hover:from-nyaya-500 hover:to-nyaya-400 shadow-nyaya-500/20 flex items-center gap-2 rounded-full bg-gradient-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-8 py-3 font-semibold transition-all hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </button>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need assistance? Visit the homepage to explore legal resources,
              AI-powered guidance, and support services available through Nyaya
              Vanni.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
