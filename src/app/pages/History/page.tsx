"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getCurrentUser, type User } from "@/app/services/AuthApi";
import {
  getHistory,
  deleteDocument,
  updateDocument,
  shareDocument,
  exportDocument,
  type Document,
} from "@/app/services/HistoryApi";
import DocumentCard from "@/app/components/DocumentCard";
import RenameModal from "@/app/components/RenameModal";
import ShareModal from "@/app/components/ShareModal";
import ProtectedRoute from "@/app/components/ProtectedRoute";

function HistoryPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push("/pages/Login?returnUrl=/pages/History");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        router.push("/pages/Login?returnUrl=/pages/History");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch documents
  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getHistory(page, 20, searchQuery || undefined);
        setDocuments(response.documents);
        setTotalPages(response.total_pages);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load documents";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [user, page, searchQuery]);

  const handleOpen = (docId: string) => {
    // Store document ID and navigate to editor
    router.push(`/pages/CodePreview?docId=${docId}`);
  };

  const handleRename = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setRenameModal({ isOpen: true, docId, currentTitle: doc.title });
    }
  };

  const handleRenameSubmit = async (newTitle: string) => {
    setIsModalLoading(true);
    try {
      await updateDocument(renameModal.docId, { title: newTitle });
      setDocuments((docs) =>
        docs.map((doc) =>
          doc.id === renameModal.docId ? { ...doc, title: newTitle } : doc
        )
      );
      setRenameModal({ isOpen: false, docId: "", currentTitle: "" });
    } catch (err) {
      alert("Failed to rename document");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleShare = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setShareModal({ isOpen: true, docId, title: doc.title });
    }
  };

  const handleShareSubmit = async (emails: string[], isPublic: boolean) => {
    setIsModalLoading(true);
    try {
      await shareDocument(shareModal.docId, { emails, is_public: isPublic });
      alert("Document shared successfully!");
      setShareModal({ isOpen: false, docId: "", title: "" });
    } catch (err) {
      alert("Failed to share document");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(docId);
      setDocuments((docs) => docs.filter((doc) => doc.id !== docId));
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  const handleExport = async (docId: string) => {
    try {
      const doc = documents.find((d) => d.id === docId);
      const data = await exportDocument(docId, "json");
      
      // Download JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc?.title || "document"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export document");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C639]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-lime-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/logoHappylife.jpg"
                alt="HappyLife Travel & Tourism"
                width={150}
                height={50}
                className="object-contain"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Link
                href="/pages/PdfConverter"
                className="px-4 py-2 bg-[#A4C639] text-white rounded-lg font-medium hover:bg-[#8FB02E] transition-colors shadow-md text-sm"
              >
                Upload PDF
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document History</h1>
          <p className="text-gray-600">Manage all your converted documents</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-[#A4C639] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-[#A4C639] text-white"
                  : "text-gray-600 hover:bg-gray-100"
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

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C639]"></div>
          </div>
        )}

        {/* Documents Grid */}
        {!isLoading && documents.length > 0 && (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onOpen={handleOpen}
                  onRename={handleRename}
                  onShare={handleShare}
                  onDelete={handleDelete}
                  onExport={handleExport}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && documents.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
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
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No documents yet</h3>
            <p className="mt-2 text-gray-600">Upload your first PDF to get started</p>
            <Link
              href="/pages/PdfConverter"
              className="mt-4 inline-block px-6 py-3 bg-[#A4C639] text-white rounded-lg font-medium hover:bg-[#8FB02E] transition-colors"
            >
              Upload PDF
            </Link>
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

