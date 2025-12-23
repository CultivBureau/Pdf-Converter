"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useHistory } from "../contexts/HistoryContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import Loading from "./Loading";

export default function HistorySidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const {
    isSidebarOpen,
    toggleSidebar,
    documents,
    recentDocuments,
    favorites,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    getFilteredDocuments,
    toggleFavorite,
    refreshDocuments,
  } = useHistory();
  
  const [localSearch, setLocalSearch] = useState("");
  
  // Hide sidebar on login page
  const isLoginPage = pathname?.includes("/Login");
  const shouldShow = isAuthenticated && !isLoginPage;
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);
  
  // Get filtered documents
  const filteredDocs = getFilteredDocuments();
  
  // Handle document click
  const handleDocumentClick = (docId: string) => {
    router.push(`/pages/CodePreview?docId=${docId}`);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };
  
  // Handle filter change
  const handleFilterChange = (type: "all" | "recent" | "favorites" | "shared") => {
    setFilterType(type);
  };
  
  if (!shouldShow) {
    return null;
  }
  
  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-80" : "w-16"
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-gradient-to-r from-[#C4B454]/5 to-[#B8A040]/5">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-bold text-gray-900">History</h2>
              {documents.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full">
                  {documents.length}
                </span>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${!isSidebarOpen ? 'absolute right-2' : ''}`}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        {isSidebarOpen && (
          <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-sm"
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
            </div>
            
            {/* Filter Chips */}
            <div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "all"
                    ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange("recent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "recent"
                    ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => handleFilterChange("favorites")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  filterType === "favorites"
                    ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-3 h-3" fill={favorites.has("dummy") ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favorites
              </button>
              <button
                onClick={() => handleFilterChange("shared")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "shared"
                    ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Shared
              </button>
            </div>
            
            {/* Documents List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C4B454]"></div>
                    <p className="mt-2 text-xs text-gray-500">Loading...</p>
                  </div>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <p className="mt-2 text-sm text-gray-600">
                    {searchQuery ? "No documents found" : "No documents yet"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => router.push("/pages/PdfConverter")}
                      className="mt-3 text-xs text-[#C4B454] hover:text-[#B8A040] font-semibold"
                    >
                      Upload PDF
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredDocs.slice(0, 50).map((doc) => {
                    const isFavorite = favorites.has(doc.id);
                    const isActive = pathname?.includes(`docId=${doc.id}`);
                    const timeAgo = formatDistanceToNow(new Date(doc.updated_at), {
                      addSuffix: true,
                    });
                    
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDocumentClick(doc.id)}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          isActive
                            ? "bg-[#C4B454]/10 border-2 border-[#C4B454]"
                            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Document Icon */}
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-red-500"
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
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {doc.original_filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{timeAgo}</span>
                              {doc.shared_with.length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                  </svg>
                                  Shared
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(doc.id);
                            }}
                            className="flex-shrink-0 p-1.5 hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <svg
                              className={`w-4 h-4 ${
                                isFavorite ? "text-red-500 fill-current" : "text-gray-400"
                              }`}
                              fill={isFavorite ? "currentColor" : "none"}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => router.push("/pages/History")}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 text-sm"
              >
                View All Documents
              </button>
            </div>
          </div>
        )}
      </aside>
      
    </>
  );
}
