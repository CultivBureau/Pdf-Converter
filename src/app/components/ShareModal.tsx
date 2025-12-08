"use client";

import React, { useState } from "react";

interface ShareModalProps {
  isOpen: boolean;
  documentTitle: string;
  onClose: () => void;
  onShare: (emails: string[], isPublic: boolean) => void;
  isLoading?: boolean;
}

export default function ShareModal({
  isOpen,
  documentTitle,
  onClose,
  onShare,
  isLoading = false,
}: ShareModalProps) {
  const [emails, setEmails] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailList = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);
    onShare(emailList, isPublic);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Share Document</h2>
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

        <p className="text-sm text-gray-600 mb-4">
          Share <span className="font-semibold">{documentTitle}</span> with others
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="emails" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Addresses
            </label>
            <input
              type="text"
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent transition-all"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 text-[#A4C639] border-gray-300 rounded focus:ring-[#A4C639]"
              />
              <div>
                <span className="text-sm font-semibold text-gray-900">Make Public</span>
                <p className="text-xs text-gray-500">Anyone with the link can view</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#A4C639] text-white font-semibold rounded-lg hover:bg-[#8FB02E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

