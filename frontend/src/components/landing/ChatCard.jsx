import React from 'react';
import { Bot, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ChatCard() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
      onClick={() => navigate('/chat')}
    >
      <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <Bot className="w-7 h-7 text-court-gold" />
      </div>
      <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
        {t('landing.chat.title')}
      </h3>
      <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
        {t('landing.chat.desc')}
      </p>

      <div className="flex flex-col gap-2 w-full mb-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/chat', {
              state: { initialPrompt: 'I need to draft a legal notice.' },
            });
          }}
          className="flex items-center justify-between px-4 py-1.5 text-xs text-left border rounded-lg bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition-all group/btn"
        >
          {t('landing.chat.draftNotice')}{' '}
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/chat', {
              state: {
                initialPrompt: 'I need to draft a reply to a legal notice.',
              },
            });
          }}
          className="flex items-center justify-between px-4 py-1.5 text-xs text-left border rounded-lg bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition-all group/btn"
        >
          {t('landing.chat.replyNotice')}{' '}
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate('/chat');
        }}
        className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
      >
        <MessageSquare className="w-4 h-4" /> {t('landing.chat.btn')}
      </button>
    </div>
  );
}
