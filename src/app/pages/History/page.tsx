"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { useHistory } from "@/app/contexts/HistoryContext";
import {
  deleteDocument,
  updateDocument,
  shareDocument,
  type Document,
} from "@/app/services/HistoryApi";
import DocumentCard from "@/app/components/DocumentCard";
import RenameModal from "@/app/components/RenameModal";
import ShareModal from "@/app/components/ShareModal";
import VersionHistoryModal from "@/app/components/VersionHistoryModal";
import HistoryFilters from "@/app/components/HistoryFilters";
import HistorySort from "@/app/components/HistorySort";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Loading from "@/app/components/Loading";
import { getDocument } from "@/app/services/HistoryApi";

function HistoryPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    documents,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    getFilteredDocuments,
    refreshDocuments,
  } = useHistory();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearch, setLocalSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    docId: string;
    currentTitle: string;
  }>({ isOpen: false, docId: "", currentTitle: "" });
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    docId: string;
    title: string;
  }>({ isOpen: false, docId: "", title: "" });
  const [versionModal, setVersionModal] = useState<{
    isOpen: boolean;
    docId: string;
    currentVersion: number;
    totalVersions: number;
  }>({ isOpen: false, docId: "", currentVersion: 1, totalVersions: 1 });
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);
  
  // Refresh documents when needed
  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);
  
  // Get filtered documents
  const filteredDocuments = getFilteredDocuments();

  const handleOpen = (docId: string) => {
    // Store document ID and navigate to document view
    router.push(`/pages/DocumentView?docId=${docId}`);
  };

  const handleRename = (docId: string) => {
    const doc = filteredDocuments.find((d) => d.id === docId);
    if (doc) {
      setRenameModal({ isOpen: true, docId, currentTitle: doc.title });
    }
  };

  const handleRenameSubmit = async (newTitle: string) => {
    setIsModalLoading(true);
    try {
      await updateDocument(renameModal.docId, { title: newTitle });
      await refreshDocuments();
      setRenameModal({ isOpen: false, docId: "", currentTitle: "" });
    } catch (err) {
      alert("Failed to rename document");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleShare = (docId: string) => {
    // Share functionality disabled - do nothing
    return;
  };

  const handleShareSubmit = async (emails: string[], isPublic: boolean) => {
    // Share functionality disabled - do nothing
    return;
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(docId);
      await refreshDocuments();
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  const handleViewVersions = async (docId: string) => {
    try {
      const response = await getDocument(docId);
      const doc = response.document;
      setVersionModal({
        isOpen: true,
        docId: doc.id,
        currentVersion: doc.current_version || 1,
        totalVersions: doc.total_versions || 1,
      });
    } catch (err) {
      alert("Failed to load document versions");
    }
  };

  const handleVersionRestore = async () => {
    await refreshDocuments();
    // Reload version modal data
    if (versionModal.docId) {
      try {
        const response = await getDocument(versionModal.docId);
        const doc = response.document;
        setVersionModal({
          ...versionModal,
          currentVersion: doc.current_version || 1,
          totalVersions: doc.total_versions || 1,
        });
      } catch (err) {
        console.error("Failed to refresh version info:", err);
      }
    }
  };


  if (isLoading && documents.length === 0) {
    return <Loading message="Loading your documents..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/logoHappylife.jpg"
                alt="HappyLife Travel & Tourism"
                width={160}
                height={55}
                className="object-contain"
                priority
              />
            </Link>
            <div className="flex items-center gap-6">
              {user && (
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Welcome, {user.name}</span>
                </div>
              )}
              <Link
                href="/pages/PdfConverter"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload PDF
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-10">
        {/* Page Title */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Document History
              </h1>
              <p className="text-slate-600 mt-2 text-lg font-medium">Manage and organize all your converted documents</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col lg:flex-row gap-5">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by title, date, or content..."
                className="w-full pl-14 pr-6 py-4 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 placeholder-slate-400 font-medium shadow-lg hover:shadow-xl"
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode & Filter Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                showFilters
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white scale-105"
                  : "bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-500"
              }`}
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters & Sort
              </span>
            </button>
            <div className="flex gap-2 bg-white rounded-2xl p-1.5 border-2 border-slate-200 shadow-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 font-semibold ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2.5 rounded-xl transition-all duration-300 font-semibold ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters & Sort Panel */}
        {showFilters && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <HistoryFilters />
            <HistorySort />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-5 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900 mb-1">Error</h4>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents Count */}
        {filteredDocuments.length > 0 && (
          <div className="mb-6 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-slate-700">
              Showing <span className="text-lg font-black text-blue-600">{filteredDocuments.length}</span> of <span className="font-bold text-slate-900">{documents.length}</span> documents
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onOpen={handleOpen}
                onRename={handleRename}
                onDelete={handleDelete}
                onViewVersions={handleViewVersions}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try adjusting your search or filters" : "Upload your first PDF to get started"}
            </p>
            {!searchQuery && (
              <Link
                href="/pages/PdfConverter"
                className="inline-block px-6 py-3 bg-gradient-to-r from-[#A4C639] to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200"
              >
                Upload PDF
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <RenameModal
        isOpen={renameModal.isOpen}
        currentTitle={renameModal.currentTitle}
        onClose={() => setRenameModal({ isOpen: false, docId: "", currentTitle: "" })}
        onRename={handleRenameSubmit}
        isLoading={isModalLoading}
      />
      <ShareModal
        isOpen={shareModal.isOpen}
        documentTitle={shareModal.title}
        onClose={() => setShareModal({ isOpen: false, docId: "", title: "" })}
        onShare={handleShareSubmit}
        isLoading={isModalLoading}
      />
      <VersionHistoryModal
        isOpen={versionModal.isOpen}
        docId={versionModal.docId}
        currentVersion={versionModal.currentVersion}
        totalVersions={versionModal.totalVersions}
        onClose={() => setVersionModal({ isOpen: false, docId: "", currentVersion: 1, totalVersions: 1 })}
        onRestore={handleVersionRestore}
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryPageContent />
    </ProtectedRoute>
  );
}

