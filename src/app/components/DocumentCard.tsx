"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Heart, 
  Globe, 
  Users, 
  Clock, 
  FileText, 
  Database, 
  Edit2, 
  Trash2, 
  History,
  Link as LinkIcon,
  Check
} from "lucide-react";
import { useHistory } from "../contexts/HistoryContext";
import { generatePublicLink, getPublicLink } from "../services/HistoryApi";

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
    creator_name?: string | null;
    creator_email?: string | null;
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
  showCreator?: boolean; // Whether to show creator information
}

export default function DocumentCard({
  document,
  onOpen,
  onRename,
  onDelete,
  onViewVersions,
  showCreator = false,
}: DocumentCardProps) {
  const { favorites, toggleFavorite } = useHistory();
  const [showActions, setShowActions] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopyingLink(true);
    setLinkCopied(false);
    
    try {
      // Try to get existing public link first
      let publicLink: string | null = null;
      try {
        const result = await getPublicLink(document.id);
        publicLink = result.public_link;
      } catch (err) {
        // If no link exists, generate one
      }
      
      // Generate new link if it doesn't exist
      if (!publicLink) {
        const result = await generatePublicLink(document.id);
        publicLink = result.public_link;
      }
      
      // Copy to clipboard
      if (publicLink) {
        await navigator.clipboard.writeText(publicLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link. Please try again.");
    } finally {
      setIsCopyingLink(false);
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-[#C4B454] shadow-lg hover:shadow-2xl transition-all duration-300 p-6 relative overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Status Indicators */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {isFavorite && (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
        )}
        {document.is_public && (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
            <Globe className="w-4 h-4 text-white" />
          </div>
        )}
        {document.shared_with && document.shared_with.length > 0 && !document.is_public && (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
            <Users className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      {/* PDF Icon/Thumbnail */}
      <div className="mb-4 flex items-center justify-center h-40 bg-gradient-to-br from-[#C4B454]/5 via-[#B8A040]/10 to-amber-50 rounded-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4B454]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FileText className="w-20 h-20 text-[#B8A040] relative z-10" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg text-gray-900 mb-2 truncate group-hover:text-[#B8A040] transition-colors" title={document.title}>
        {document.title}
      </h3>
      
      {/* Filename */}
      <p className="text-xs text-gray-500 mb-3 truncate" title={document.original_filename}>
        {document.original_filename}
      </p>

      {/* Creator Info */}
      {showCreator && document.creator_name && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-gray-700">Created by:</span>
            <span className="text-gray-600">{document.creator_name}</span>
            {document.creator_email && (
              <span className="text-gray-500">({document.creator_email})</span>
            )}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#B8A040]" />
          {timeAgo}
        </span>
        {document.current_version && document.total_versions && (
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-semibold ${
            document.total_versions > 1 
              ? "bg-[#C4B454]/10 text-[#B8A040]" 
              : "bg-gray-100 text-gray-600"
          }`}>
            <FileText className={`w-4 h-4 ${document.total_versions > 1 ? "text-[#B8A040]" : "text-gray-500"}`} />
            v{document.current_version}/{document.total_versions}
          </span>
        )}
        {document.metadata?.sectionsCount && (
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            {document.metadata.sectionsCount} sections
          </span>
        )}
        {document.metadata?.fileSize && (
          <span className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-purple-500" />
            {formatFileSize(document.metadata.fileSize)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`flex flex-wrap gap-2 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-90'}`}>
        <button
          onClick={() => onOpen(document.id)}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Open
        </button>
        {document.total_versions && document.total_versions > 1 && onViewVersions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewVersions(document.id);
            }}
            className="px-3 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-1.5"
            title="View version history"
          >
            <History className="w-4 h-4" />
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
            <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleCopyLink}
            disabled={isCopyingLink}
            className={`p-2.5 rounded-xl transition-colors ${
              linkCopied
                ? "bg-green-50 text-green-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={linkCopied ? "Link copied!" : "Copy public link"}
          >
            {linkCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onRename(document.id)}
            className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            title="Rename"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(document.id)}
            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

