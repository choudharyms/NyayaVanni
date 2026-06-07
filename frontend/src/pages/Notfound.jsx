import { Link } from "react-router-dom";
import { Scale, ArrowLeft, Home } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-end">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">

          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-nyaya-500/10 flex items-center justify-center">
              <Scale className="w-12 h-12 text-nyaya-600 dark:text-nyaya-400" />
            </div>
          </div>

          <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-nyaya-600 to-nyaya-400 bg-clip-text text-transparent">
            404
          </h1>

          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Page Not Found
          </h2>

          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            The page you're looking for doesn't exist, has been moved,
            or the URL may be incorrect.
          </p>

          <p className="mt-2 text-slate-500 dark:text-slate-500">
            Let's help you get back to the right place.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-nyaya-600 to-nyaya-500 hover:from-nyaya-500 hover:to-nyaya-400 text-white font-semibold shadow-lg shadow-nyaya-500/20 transition-all hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-8 py-3 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need assistance? Visit the homepage to explore legal resources,
              AI-powered guidance, and support services available through
              Nyaya Vanni.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
