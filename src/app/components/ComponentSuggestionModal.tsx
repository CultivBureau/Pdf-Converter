"use client";

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { ComponentSuggestion } from '../types/ExtractTypes';
import AirplaneSuggestionPreview from './suggestions/AirplaneSuggestionPreview';
import HotelSuggestionPreview from './suggestions/HotelSuggestionPreview';
import TransportSuggestionPreview from './suggestions/TransportSuggestionPreview';

interface ComponentSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: ComponentSuggestion[];
  onApprove: (suggestion: ComponentSuggestion) => void;
  onReject: (suggestionId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}

/**
 * Modal component for displaying and managing AI-generated component suggestions.
 * Shows suggestions for airplane, hotel, and transport components with approve/reject actions.
 */
const ComponentSuggestionModal: React.FC<ComponentSuggestionModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll
}) => {
  const { t, language, dir } = useLanguage();
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleApprove = (suggestion: ComponentSuggestion) => {
    setApprovedIds(prev => new Set(prev).add(suggestion.id));
    setRejectedIds(prev => {
      const next = new Set(prev);
      next.delete(suggestion.id);
      return next;
    });
    onApprove(suggestion);
  };

  const handleReject = (suggestionId: string) => {
    setRejectedIds(prev => new Set(prev).add(suggestionId));
    setApprovedIds(prev => {
      const next = new Set(prev);
      next.delete(suggestionId);
      return next;
    });
    onReject(suggestionId);
  };

  const handleApproveAllClick = () => {
    suggestions.forEach(suggestion => {
      if (!rejectedIds.has(suggestion.id)) {
        handleApprove(suggestion);
      }
    });
    onApproveAll();
  };

  const handleRejectAllClick = () => {
    suggestions.forEach(suggestion => {
      if (!approvedIds.has(suggestion.id)) {
        handleReject(suggestion.id);
      }
    });
    onRejectAll();
  };

  const getTypeIcon = (type: ComponentSuggestion['type']) => {
    switch (type) {
      case 'airplane':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        );
      case 'hotel':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
            <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
          </svg>
        );
      case 'transport':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        );
    }
  };

  const getTypeLabel = (type: ComponentSuggestion['type']) => {
    switch (type) {
      case 'airplane':
        return t.modals.flightBooking;
      case 'hotel':
        return t.modals.hotelBooking;
      case 'transport':
        return t.modals.transportation;
    }
  };

  const renderPreview = (suggestion: ComponentSuggestion) => {
    switch (suggestion.type) {
      case 'airplane':
        return <AirplaneSuggestionPreview data={suggestion.data} language={language} direction={dir} />;
      case 'hotel':
        return <HotelSuggestionPreview data={suggestion.data} language={language} direction={dir} />;
      case 'transport':
        return <TransportSuggestionPreview data={suggestion.data} language={language} direction={dir} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg z-50 flex items-center justify-center  bg-opacity-50" dir={dir}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t.modals.componentSuggestions}
              </h2>
              <p className="text-sm text-gray-600">
                {language === 'ar' 
                  ? `تم العثور على ${suggestions.length} ${t.modals.suggestionsFound}` 
                  : `${suggestions.length} ${suggestions.length !== 1 ? t.modals.suggestionsFound : t.modals.suggestion} found`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t.modals.close}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t.modals.noSuggestionsFound}</p>
            </div>
          ) : (
            suggestions.map((suggestion) => {
              const isApproved = approvedIds.has(suggestion.id);
              const isRejected = rejectedIds.has(suggestion.id);
              
              return (
                <div
                  key={suggestion.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    isApproved
                      ? 'border-green-500 bg-green-50'
                      : isRejected
                      ? 'border-red-300 bg-red-50 opacity-60'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {/* Suggestion Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        suggestion.type === 'airplane' ? 'bg-blue-100 text-blue-600' :
                        suggestion.type === 'hotel' ? 'bg-purple-100 text-purple-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{getTypeLabel(suggestion.type)}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-semibold ${getConfidenceColor(suggestion.confidence)}`}>
                            {t.modals.confidence}: {(suggestion.confidence * 100).toFixed(0)}%
                          </span>
                          {suggestion.reasoning && (
                            <span className="text-gray-500 text-xs">({suggestion.reasoning})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isApproved && !isRejected && (
                        <>
                          <button
                            onClick={() => handleApprove(suggestion)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t.modals.approve}
                          </button>
                          <button
                            onClick={() => handleReject(suggestion.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t.modals.reject}
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t.modals.approved}
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {t.modals.rejected}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-3">
                    {renderPreview(suggestion)}
                  </div>

                  {/* Source Text (if available) */}
                  {suggestion.source_text && (
                    <details className="mt-3">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                        {t.modals.showSourceText}
                      </summary>
                      <div className="mt-2 p-3 bg-gray-100 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                        {suggestion.source_text}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <button
                onClick={handleApproveAllClick}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t.modals.approveAll}
              </button>
              <button
                onClick={handleRejectAllClick}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t.modals.rejectAll}
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t.modals.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentSuggestionModal;
