"use client";

import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface RenameModalProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
  isLoading?: boolean;
}

export default function RenameModal({
  isOpen,
  currentTitle,
  onClose,
  onRename,
  isLoading = false,
}: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const { t, isRTL, dir } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(newTitle.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-lg animate-fadeIn text-black" dir={dir}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-xl font-bold text-gray-900">{t.history.renameDocument}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="title" className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.history.documentTitle}
            </label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent transition-all"
              placeholder={t.history.enterNewTitle}
              autoFocus
              dir={dir}
            />
          </div>

          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || !newTitle.trim()}
              className="flex-1 px-4 py-3 bg-[#A4C639] text-white font-semibold rounded-lg hover:bg-[#8FB02E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t.history.renaming : t.history.rename}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

