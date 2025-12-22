"use client";

import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useHistory } from "../contexts/HistoryContext";
import { type Document } from "../services/HistoryApi";

interface DocumentTableViewProps {
  documents: Document[];
  onOpen: (docId: string) => void;
  onRename: (docId: string) => void;
  onDelete: (docId: string) => void;
  onViewVersions?: (docId: string) => void;
  showCreator?: boolean; // Whether to show creator column
  showCompany?: boolean; // Whether to show company column
  companies?: Array<{ id: string; name: string }>; // Company list for lookup
}

export default function DocumentTableView({
  documents,
  onOpen,
  onRename,
  onDelete,
  onViewVersions,
  showCreator = false,
  showCompany = false,
  companies = [],
}: DocumentTableViewProps) {
  const { favorites, toggleFavorite } = useHistory();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-600">No documents match your current filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Document
              </th>
              {showCreator && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Created By
                </th>
              )}
              {showCompany && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Company
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {documents.map((doc) => {
              const isFavorite = favorites.has(doc.id);
              const isHovered = hoveredRow === doc.id;
              
              return (
                <tr
                  key={doc.id}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? "bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setHoveredRow(doc.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Document Title */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          {isFavorite && (
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                          {doc.is_public && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              Public
                            </span>
                          )}
                          {doc.shared_with && doc.shared_with.length > 0 && !doc.is_public && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                              Shared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Creator */}
                  {showCreator && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.creator_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {doc.creator_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.creator_name}</p>
                            {doc.creator_email && (
                              <p className="text-xs text-gray-500">{doc.creator_email}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}

                  {/* Company */}
                  {showCompany && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.company_id ? (
                        (() => {
                          const company = companies.find(c => c.id === doc.company_id);
                          return company ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unknown</span>
                          );
                        })()
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}

                  {/* Filename */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-600 truncate max-w-xs" title={doc.original_filename}>
                      {doc.original_filename}
                    </p>
                  </td>

                  {/* Version */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.current_version && doc.total_versions ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        doc.total_versions > 1
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        v{doc.current_version}/{doc.total_versions}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{format(new Date(doc.created_at), "MMM d, yyyy")}</p>
                      <p className="text-xs text-gray-500">{format(new Date(doc.created_at), "h:mm a")}</p>
                    </div>
                  </td>

                  {/* Updated */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</p>
                      <p className="text-xs text-gray-500">{format(new Date(doc.updated_at), "MMM d, yyyy")}</p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onOpen(doc.id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#A4C639] to-emerald-500 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all duration-200"
                        title="Open document"
                      >
                        Open
                      </button>
                      {doc.total_versions && doc.total_versions > 1 && onViewVersions && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewVersions(doc.id);
                          }}
                          className="px-2 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all duration-200"
                          title="View versions"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(doc.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isFavorite
                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onRename(doc.id)}
                        className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Rename"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

