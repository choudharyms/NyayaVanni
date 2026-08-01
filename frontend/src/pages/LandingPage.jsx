import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentHistory } from '../hooks/useDocumentHistory';
import RecentDocuments from '../components/RecentDocuments';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import UploadCard from '../components/landing/UploadCard';
import ChatCard from '../components/landing/ChatCard';
import ScamDetectorCard from '../components/landing/ScamDetectorCard';
import VersionDiffCard from '../components/landing/VersionDiffCard';
import BarristerIllustration from '../components/landing/BarristerIllustration';
import FAQSection from '../components/landing/FAQSection';
import LandingFooter from '../components/landing/LandingFooter';
import { ensureSessionId } from '../utils/session';

export default function LandingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { history, clearHistory } = useDocumentHistory();
  const [openFaq, setOpenFaq] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.stopPropagation();
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await ensureSessionId(apiUrl);

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        let errMessage = 'Upload failed';
        try {
          const errData = await response.json();
          errMessage = errData.detail || errMessage;
        } catch {
          try {
            const errText = await response.text();
            if (errText) errMessage = errText;
          } catch {
            // Ignore: response body is not readable.
          }
        }
        throw new Error(errMessage);
      }
      const data = await response.json();

      navigate(`/dashboard/${data.documentId}`, { state: { file } });
    } catch (error) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      if (
        apiUrl.includes('localhost') &&
        window.location.hostname !== 'localhost'
      ) {
        alert(
          'Configuration Error: The app is trying to connect to a local server (localhost) while deployed. Please set the VITE_API_URL environment variable in your Vercel dashboard.'
        );
      } else {
        alert(
          'Upload failed: ' +
            (error.message || 'Please check your connection and try again.')
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-court-walnut text-court-cream wood-panel transition-colors duration-300 font-sans">
      <div className="absolute inset-0 court-vignette opacity-95 pointer-events-none z-0"></div>

      <Navbar />

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-7xl px-6 py-8 md:py-12 mx-auto gap-8 items-stretch">
        <div className="w-full lg:w-[62%] flex flex-col justify-center text-left lg:pr-8">
          <HeroSection />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            <UploadCard
              file={file}
              dragActive={dragActive}
              loading={loading}
              inputRef={inputRef}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onChange={handleChange}
              onButtonClick={onButtonClick}
              onClearFile={handleClearFile}
              onAnalyze={handleAnalyze}
            />
            <ChatCard />
            <ScamDetectorCard />
            <VersionDiffCard />
          </div>
        </div>

        <BarristerIllustration />
      </main>

      {history.length > 0 && (
        <section className="relative z-10 w-full max-w-7xl px-6 mb-8 mx-auto">
          <RecentDocuments history={history} onClear={clearHistory} />
        </section>
      )}

      <section className="relative z-10 w-full pb-0 mt-8">
        <div className="w-full px-6 mx-auto max-w-7xl">
          <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
        </div>

        <LandingFooter />
      </section>
    </div>
  );
}
