import React, { useState } from 'react';
import { Trash2, ChevronRight, Edit2 } from 'lucide-react';
import { ARIA_LABELS, TITLES, MESSAGES } from '../constants';

export default function ConversationItem({
  conversation,
  isActive = false,
  onSelect,
  onDelete,
  onRename,
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
      className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-all duration-200 ${
        isActive
          ? 'bg-nyaya-100 dark:bg-nyaya-900/30 text-nyaya-900 dark:text-nyaya-100 ring-nyaya-500 ring-1'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
      aria-label={ARIA_LABELS.SELECT_CONVERSATION}
      title={conversation.title}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{conversation.title}</p>
        <p
          className={`mt-0.5 text-xs ${
            isActive
              ? 'text-nyaya-700 dark:text-nyaya-200'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {formatDate(conversation.updatedAt || conversation.timestamp)}
        </p>
      </div>
      <div className="ml-2 flex items-center gap-1">
        {isHovering ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newTitle = window.prompt(
                  'Rename conversation:',
                  conversation.title
                );
                if (newTitle && newTitle.trim()) {
                  onRename(conversation.id, newTitle.trim());
                }
              }}
              className="hover:text-slate-750 cursor-pointer rounded p-1 text-slate-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Rename Conversation"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="cursor-pointer rounded p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              aria-label={ARIA_LABELS.DELETE_CONVERSATION}
              title={TITLES.DELETE_CONVERSATION}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : isActive ? (
          <ChevronRight className="text-nyaya-500 h-4 w-4 shrink-0" />
        ) : null}
      </div>
    </button>
  );
}
