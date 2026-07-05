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

  const L = language === 'en' ? EN : HI;

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
    <div className="relative min-h-screen bg-court-walnut text-court-cream wood-panel flex flex-col transition-colors duration-300 font-sans">
      {/* Radial vignette backdrop */}
      <div className="absolute inset-0 court-vignette opacity-95 pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col flex-1 w-full px-6 py-6">
        <header className="flex items-center justify-between py-4 mb-8 border-b border-court-gold/25">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-court-gold/30 hover:bg-court-gold hover:text-court-walnut transition text-court-cream cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        <main className="flex-1 w-full flex flex-col md:flex-row gap-12">
          <div className="flex-1 flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-court-cream mb-4">
              {L.CONTACT_TITLE}
            </h1>
            <p className="text-court-muted mb-8 text-lg">
              {L.CONTACT_DESC}
            </p>

            <form
              onSubmit={handleSubmit}
              className="court-card p-8 rounded-3xl flex flex-col gap-6"
            >
              {submitStatus === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {language === 'en' ? 'Message Sent!' : 'संदेश भेजा गया!'}
                    </p>
                    <p className="text-sm mt-1">
                      {language === 'en'
                        ? 'Thank you for reaching out. We will get back to you shortly.'
                        : 'संपर्क करने के लिए धन्यवाद। हम शीघ्र ही आपसे संपर्क करेंगे।'}
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {language === 'en'
                        ? 'Failed to send message.'
                        : 'संदेश भेजने में विफल।'}
                    </p>
                    <p className="text-sm mt-1">
                      {language === 'en'
                        ? 'Please try again later.'
                        : 'कृपया बाद में पुनः प्रयास करें।'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-court-cream"
                  >
                    {L.FULL_NAME}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-court-gold/35 focus:border-court-gold'} bg-court-walnut/40 text-court-cream focus:ring-2 focus:ring-court-gold/20 outline-none transition-all`}
                    placeholder={
                      language === 'en'
                        ? CONTACT_PLACEHOLDERS.NAME_EN
                        : CONTACT_PLACEHOLDERS.NAME_HI
                    }
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs">{errors.name}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-court-cream"
                  >
                    {L.EMAIL_ADDRESS}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-court-gold/35 focus:border-court-gold'} bg-court-walnut/40 text-court-cream focus:ring-2 focus:ring-court-gold/20 outline-none transition-all`}
                    placeholder={
                      CONTACT_PLACEHOLDERS.CONTACT_EMAIL || 'john@example.com'
                    }
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-semibold text-court-cream"
                >
                  {L.SUBJECT}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`px-4 py-3 rounded-xl border ${errors.subject ? 'border-red-500 focus:ring-red-500/20' : 'border-court-gold/35 focus:border-court-gold'} bg-court-walnut/40 text-court-cream focus:ring-2 focus:ring-court-gold/20 outline-none transition-all`}
                  placeholder={
                    language === 'en'
                      ? CONTACT_PLACEHOLDERS.HELP_EN
                      : CONTACT_PLACEHOLDERS.HELP_HI
                  }
                />
                {errors.subject && (
                  <span className="text-red-500 text-xs">{errors.subject}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="message"
                  className="text-sm font-semibold text-court-cream"
                >
                  {L.MESSAGE}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className={`px-4 py-3 rounded-xl border ${errors.message ? 'border-red-500 focus:ring-red-500/20' : 'border-court-gold/35 focus:border-court-gold'} bg-court-walnut/40 text-court-cream focus:ring-2 focus:ring-court-gold/20 outline-none transition-all resize-none`}
                  placeholder={
                    language === 'en'
                      ? CONTACT_PLACEHOLDERS.ISSUE_EN
                      : CONTACT_PLACEHOLDERS.ISSUE_HI
                  }
                />
                {errors.message && (
                  <span className="text-red-500 text-xs">{errors.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex items-center justify-center gap-2 w-full md:w-auto self-start bg-court-gold hover:bg-yellow-500 text-court-walnut px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-court-gold/10 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-court-walnut/30 border-t-court-walnut rounded-full animate-spin"></div>
                    {L.SENDING}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {L.SEND_MESSAGE}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-6 mt-8 md:mt-24">
            <div className="court-card p-8 rounded-3xl shadow-sm">
              <h3 className="text-xl font-bold font-serif text-court-cream mb-6">
                {L.CONTACT_INFO}
              </h3>
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-court-gold/15 flex items-center justify-center shrink-0 text-court-gold border border-court-gold/25">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-court-cream">
                      Email
                    </p>
                    <a
                      href="mailto:support@nyayavanni.com"
                      className="text-sm text-court-muted hover:text-court-gold transition-colors"
                    >
                      support@nyayavanni.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-court-gold/15 flex items-center justify-center shrink-0 text-court-gold border border-court-gold/25">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-court-cream">
                      {L.BUSINESS_HOURS}
                    </p>
                    <p className="text-sm text-court-muted">
                      {L.BUSINESS_HOURS_VALUE}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-court-gold/15 flex items-center justify-center shrink-0 text-court-gold border border-court-gold/25">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-court-cream">
                      {L.LOCATION}
                    </p>
                    <p className="text-sm text-court-muted">
                      {L.LOCATION_VALUE}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="relative z-10 w-full mt-auto">
        <Footer />
      </section>
    </div>
  );
}
