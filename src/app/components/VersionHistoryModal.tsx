"use client";

import React, { useState, useEffect } from "react";
import {
  getDocumentVersions,
  restoreDocumentVersion,
  resetToOriginal,
  type DocumentVersion,
} from "../services/HistoryApi";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "../contexts/LanguageContext";

interface VersionHistoryModalProps {
  isOpen: boolean;
  docId: string;
  currentVersion: number;
  totalVersions: number;
  onClose: () => void;
  onRestore: () => Promise<void>;
}

export default function VersionHistoryModal({
  isOpen,
  docId,
  currentVersion,
  totalVersions,
  onClose,
  onRestore,
}: VersionHistoryModalProps) {
  const { t, isRTL, dir, language } = useLanguage();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [showNameInput, setShowNameInput] = useState<number | null>(null);
  const [versionName, setVersionName] = useState("");

  useEffect(() => {
    if (isOpen && docId) {
      loadVersions();
    }
  }, [isOpen, docId]);

  const loadVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDocumentVersions(docId);
      setVersions(response.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number, versionName?: string) => {
    if (!confirm(`${t.modals.confirmRestore} ${versionNumber}? ${t.modals.confirmRestoreDetails}`)) {
      return;
    }

    setRestoringVersion(versionNumber);
    setError(null);
    setShowNameInput(null);
    try {
      await restoreDocumentVersion(docId, versionNumber, undefined, versionName || undefined);
      await onRestore();
      await loadVersions();
      setVersionName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleResetToOriginal = async (versionName?: string) => {
    if (!confirm(t.modals.confirmReset)) {
      return;
    }

    setRestoringVersion(0);
    setError(null);
    setShowNameInput(null);
    try {
      await resetToOriginal(docId, undefined, versionName || undefined);
      await onRestore();
      await loadVersions();
      setVersionName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset to original");
    } finally {
      setRestoringVersion(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-lg animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scaleIn" dir={dir}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h2 className="text-2xl font-black text-gray-900">{t.modals.versionHistory}</h2>
              <p className="text-sm font-medium text-gray-600 mt-0.5">
                {totalVersions} {t.modals.versionsAvailable}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t.modals.noVersionsFound}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => {
                const isCurrent = version.version_number === currentVersion;
                const isRestoring = restoringVersion === version.version_number;
                const timeAgo = formatDistanceToNow(new Date(version.created_at), { 
                  addSuffix: true,
                  locale: language === 'ar' ? ar : undefined
                });

                return (
                  <div
                    key={version.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isCurrent
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-md"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                            version.is_original
                              ? "bg-green-100 text-green-700"
                              : isCurrent
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {version.is_original ? t.modals.original : `v${version.version_number}`}
                          </div>
                          {isCurrent && (
                            <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs">
                              {t.modals.current}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 font-medium">{timeAgo}</span>
                        </div>
                        {version.version_name && (
                          <p className="text-sm font-semibold text-indigo-700 mt-1">
                            "{version.version_name}"
                          </p>
                        )}
                        {version.change_summary && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            {version.change_summary}
                          </p>
                        )}
                        {!version.change_summary && !version.version_name && version.is_original && (
                          <p className={`text-sm text-gray-600 mt-2 italic ${isRTL ? 'text-right' : ''}`}>
                            {t.modals.originalVersionDesc}
                          </p>
                        )}
                        {showNameInput === version.version_number && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <input
                              type="text"
                              value={versionName}
                              onChange={(e) => setVersionName(e.target.value)}
                              placeholder={t.modals.enterVersionName}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${isRTL ? 'text-right' : ''}`}
                              maxLength={100}
                              autoFocus
                              dir={dir}
                            />
                            <div className={`flex gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <button
                                onClick={() => {
                                  handleRestore(version.version_number, versionName.trim() || undefined);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                              >
                                {t.modals.restoreWithName}
                              </button>
                              <button
                                onClick={() => {
                                  setShowNameInput(null);
                                  setVersionName("");
                                }}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300"
                              >
                                {t.modals.cancel}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrent && (
                          <>
                            {showNameInput !== version.version_number ? (
                              <button
                                onClick={() => {
                                  setShowNameInput(version.version_number);
                                  setVersionName("");
                                }}
                                disabled={isRestoring || restoringVersion !== null}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                              >
                                {isRestoring ? t.modals.restoring : t.modals.restore}
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {showNameInput === 0 ? (
            <div className="space-y-3">
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder={t.modals.enterVersionName}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${isRTL ? 'text-right' : ''}`}
                maxLength={100}
                autoFocus
                dir={dir}
              />
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => handleResetToOriginal(versionName.trim() || undefined)}
                  disabled={restoringVersion !== null}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {restoringVersion === 0 ? t.modals.resetting : t.modals.resetWithName}
                </button>
                <button
                  onClick={() => {
                    setShowNameInput(null);
                    setVersionName("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-all"
                >
                  {t.modals.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => {
                  setShowNameInput(0);
                  setVersionName("");
                }}
                disabled={restoringVersion !== null || currentVersion === 1}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {t.modals.resetToOriginal}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
              >
                {t.modals.close}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

