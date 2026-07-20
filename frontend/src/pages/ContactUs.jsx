import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { EN, HI, CONTACT_PLACEHOLDERS } from '../constants';

export default function ContactUs() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const L = language === 'hi' ? HI : EN;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim())
      newErrors.name =
        language === 'en' ? 'Full Name is required' : 'पूरा नाम आवश्यक है';
    if (!formData.email.trim())
      newErrors.email =
        language === 'en' ? 'Email is required' : 'ईमेल आवश्यक है';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      newErrors.email =
        language === 'en' ? 'Invalid email format' : 'अमान्य ईमेल प्रारूप';
    if (!formData.subject.trim())
      newErrors.subject =
        language === 'en' ? 'Subject is required' : 'विषय आवश्यक है';
    if (!formData.message.trim())
      newErrors.message =
        language === 'en' ? 'Message is required' : 'संदेश आवश्यक है';
    else if (formData.message.trim().length < 10)
      newErrors.message =
        language === 'en'
          ? 'Message must be at least 10 characters'
          : 'संदेश कम से कम 10 वर्णों का होना चाहिए';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 py-4 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />{' '}
            {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        <main className="flex w-full flex-1 flex-col gap-12 md:flex-row">
          <div className="flex flex-1 flex-col">
            <h1 className="text-slate-850 mb-4 text-4xl font-extrabold md:text-5xl dark:text-white">
              {L.CONTACT_TITLE}
            </h1>
            <p className="mb-8 text-lg text-slate-600 dark:text-slate-400">
              {L.CONTACT_DESC}
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
            >
              {submitStatus === 'success' && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {language === 'en' ? 'Message Sent!' : 'संदेश भेजा गया!'}
                    </p>
                    <p className="mt-1 text-sm">
                      {language === 'en'
                        ? 'Thank you for reaching out. We will get back to you shortly.'
                        : 'संपर्क करने के लिए धन्यवाद। हम शीघ्र ही आपसे संपर्क करेंगे।'}
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {language === 'en'
                        ? 'Failed to send message.'
                        : 'संदेश भेजने में विफल।'}
                    </p>
                    <p className="mt-1 text-sm">
                      {language === 'en'
                        ? 'Please try again later.'
                        : 'कृपया बाद में पुनः प्रयास करें।'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {L.FULL_NAME}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={200}
                    className={`rounded-xl border px-4 py-3 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:border-nyaya-500 dark:focus:border-nyaya-500 border-slate-200 dark:border-slate-700'} focus:ring-nyaya-500/20 bg-slate-50 transition-all outline-none focus:ring-2 dark:bg-slate-950`}
                    placeholder={
                      language === 'en'
                        ? CONTACT_PLACEHOLDERS.NAME_EN
                        : CONTACT_PLACEHOLDERS.NAME_HI
                    }
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500">{errors.name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {L.EMAIL_ADDRESS}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={320}
                    className={`rounded-xl border px-4 py-3 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:border-nyaya-500 dark:focus:border-nyaya-500 border-slate-200 dark:border-slate-700'} focus:ring-nyaya-500/20 bg-slate-50 transition-all outline-none focus:ring-2 dark:bg-slate-950`}
                    placeholder={
                      CONTACT_PLACEHOLDERS.CONTACT_EMAIL || 'john@example.com'
                    }
                  />
                  {errors.email && (
                    <span className="text-xs text-red-500">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  {L.SUBJECT}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={500}
                  className={`rounded-xl border px-4 py-3 ${errors.subject ? 'border-red-500 focus:ring-red-500' : 'focus:border-nyaya-500 dark:focus:border-nyaya-500 border-slate-200 dark:border-slate-700'} focus:ring-nyaya-500/20 bg-slate-50 transition-all outline-none focus:ring-2 dark:bg-slate-950`}
                  placeholder={
                    language === 'en'
                      ? CONTACT_PLACEHOLDERS.HELP_EN
                      : CONTACT_PLACEHOLDERS.HELP_HI
                  }
                />
                {errors.subject && (
                  <span className="text-xs text-red-500">{errors.subject}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="message"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  {L.MESSAGE}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={10000}
                  className={`rounded-xl border px-4 py-3 ${errors.message ? 'border-red-500 focus:ring-red-500' : 'focus:border-nyaya-500 dark:focus:border-nyaya-500 border-slate-200 dark:border-slate-700'} focus:ring-nyaya-500/20 resize-none bg-slate-50 transition-all outline-none focus:ring-2 dark:bg-slate-950`}
                  placeholder={
                    language === 'en'
                      ? CONTACT_PLACEHOLDERS.ISSUE_EN
                      : CONTACT_PLACEHOLDERS.ISSUE_HI
                  }
                />
                {errors.message && (
                  <span className="text-xs text-red-500">{errors.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="from-nyaya-600 to-nyaya-500 hover:from-nyaya-500 hover:to-nyaya-400 shadow-nyaya-500/20 dark:shadow-nyaya-500/30 mt-2 flex w-full cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-linear-to-r px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    {L.SENDING}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {L.SEND_MESSAGE}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 flex w-full flex-col gap-6 md:mt-24 md:w-80">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
              <h3 className="text-slate-850 mb-6 text-xl font-bold dark:text-white">
                {L.CONTACT_INFO}
              </h3>
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-nyaya-500/10 text-nyaya-600 dark:text-nyaya-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      Email
                    </p>
                    <a
                      href="mailto:support@nyayavanni.com"
                      className="hover:text-nyaya-600 dark:hover:text-nyaya-400 text-sm text-slate-600 transition-colors dark:text-slate-400"
                    >
                      support@nyayavanni.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-nyaya-500/10 text-nyaya-600 dark:text-nyaya-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {L.BUSINESS_HOURS}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {L.BUSINESS_HOURS_VALUE}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-nyaya-500/10 text-nyaya-600 dark:text-nyaya-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {L.LOCATION}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {L.LOCATION_VALUE}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="z-10 w-full">
        <Footer />
      </section>
    </div>
  );
}
