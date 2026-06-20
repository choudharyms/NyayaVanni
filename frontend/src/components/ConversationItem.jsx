import React, { useState } from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import { ARIA_LABELS, TITLES, MESSAGES } from '../constants';

export default function ConversationItem({
  conversation,
  isActive = false,
  onSelect,
  onDelete,
}) {
  const [isHovering, setIsHovering] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return MESSAGES.YESTERDAY;
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (
      window.confirm(`Are you sure you want to delete "${conversation.title}"?`)
    ) {
      onDelete(conversation.id);
    }
  };

  return (
    <button
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 flex items-center justify-between group ${
        isActive
          ? 'bg-nyaya-100 dark:bg-nyaya-900/30 text-nyaya-900 dark:text-nyaya-100 ring-1 ring-nyaya-500'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
      }`}
      title={conversation.title}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{conversation.title}</p>
        <p
          className={`text-xs mt-0.5 ${
            isActive
              ? 'text-nyaya-700 dark:text-nyaya-200'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {formatDate(conversation.updatedAt || conversation.timestamp)}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-2">
        {isHovering ? (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors shrink-0"
            aria-label={ARIA_LABELS.DELETE_CONVERSATION}
            title={TITLES.DELETE_CONVERSATION}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : isActive ? (
          <ChevronRight className="w-4 h-4 text-nyaya-500 shrink-0" />
        ) : null}
      </div>
    </button>
  );
}
