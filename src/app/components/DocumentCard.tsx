"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useHistory } from "../contexts/HistoryContext";

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    original_filename: string;
    created_at: string;
    updated_at: string;
    shared_with?: string[];
    is_public?: boolean;
    current_version?: number;
    total_versions?: number;
    metadata?: {
      sectionsCount?: number;
      tablesCount?: number;
      fileSize?: number;
    };
  };
  onOpen: (docId: string) => void;
  onRename: (docId: string) => void;
  onDelete: (docId: string) => void;
  onViewVersions?: (docId: string) => void;
}

export default function DocumentCard({
  document,
  onOpen,
  onRename,
  onDelete,
  onViewVersions,
}: DocumentCardProps) {
  const { favorites, toggleFavorite } = useHistory();
  const [showActions, setShowActions] = useState(false);
  const isFavorite = favorites.has(document.id);
  const timeAgo = formatDistanceToNow(new Date(document.updated_at), {
    addSuffix: true,
  });
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-[#A4C639] shadow-lg hover:shadow-2xl transition-all duration-300 p-6 relative overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Status Indicators */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {isFavorite && (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
        {document.is_public && (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
        )}
        {document.shared_with && document.shared_with.length > 0 && !document.is_public && (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* PDF Icon/Thumbnail */}
      <div className="mb-4 flex items-center justify-center h-40 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A4C639]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <svg
          className="w-20 h-20 text-red-500 relative z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-gray-900 mb-2 truncate group-hover:text-[#A4C639] transition-colors" title={document.title}>
        {document.title}
      </h3>
      
      {/* Filename */}
      <p className="text-xs text-gray-500 mb-3 truncate" title={document.original_filename}>
        {document.original_filename}
      </p>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {timeAgo}
        </span>
        {document.current_version && document.total_versions && (
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-semibold ${
            document.total_versions > 1 
              ? "bg-indigo-50 text-indigo-700" 
              : "bg-gray-100 text-gray-600"
          }`}>
            <svg className={`w-4 h-4 ${document.total_versions > 1 ? "text-indigo-600" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            v{document.current_version}/{document.total_versions}
          </span>
        )}
        {document.metadata?.sectionsCount && (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {document.metadata.sectionsCount} sections
          </span>
        )}
        {document.metadata?.fileSize && (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            {formatFileSize(document.metadata.fileSize)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`flex flex-wrap gap-2 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-90'}`}>
        <button
          onClick={() => onOpen(document.id)}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#A4C639] to-emerald-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Open
        </button>
        {document.total_versions && document.total_versions > 1 && onViewVersions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewVersions(document.id);
            }}
            className="px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
            title="View version history"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Versions
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(document.id);
            }}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              isFavorite
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => onRename(document.id)}
            className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            title="Rename"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(document.id)}
            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

