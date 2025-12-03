"use client";

import React from "react";
import type { Section } from "../types/ExtractTypes";
import { formatSection } from "../utils/formatSections";

interface SectionBlockProps {
  section: Section;
  level?: number; // For nested sections (hierarchy)
  className?: string;
  showStats?: boolean;
  editable?: boolean;
  onEdit?: (section: Section) => void;
}

/**
 * Section Block Component
 * Phase 3: Receiving Extracted Data
 * 
 * Displays a section with title and content
 */
// Helper function to detect Arabic text
function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export default function SectionBlock({
  section,
  level = 0,
  className = "",
  showStats = false,
  editable = false,
  onEdit,
}: SectionBlockProps) {
  const formatted = formatSection(section);
  
  // Detect Arabic content for RTL support
  const isArabic = hasArabic(section.title + section.content);
  const textDirection = isArabic ? 'rtl' : 'ltr';
  
  // Determine heading level based on hierarchy level
  const HeadingTag = level === 0 ? "h2" : level === 1 ? "h3" : level === 2 ? "h4" : "h5";
  const headingSize = level === 0 ? "text-2xl" : level === 1 ? "text-xl" : level === 2 ? "text-lg" : "text-base";
  
  return (
    <div
      className={`section-block mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200 ${className}`}
      data-section-id={section.id}
      data-section-order={section.order}
    >
      {/* Section Title */}
      {formatted.displayTitle && (
        <div className="flex items-center justify-between mb-4" dir={textDirection}>
          <HeadingTag
            className={`${headingSize} font-bold text-gray-900 mb-2`}
            style={{ marginLeft: `${level * 1.5}rem` }}
          >
            {formatted.displayTitle}
          </HeadingTag>
          
          {editable && onEdit && (
            <button
              onClick={() => onEdit(section)}
              className="ml-4 p-2 text-gray-600 hover:text-[#A4C639] hover:bg-gray-100 rounded transition-colors"
              title="تعديل القسم"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Section Content */}
      {formatted.hasContent && (
        <div
          className="section-content text-gray-700 leading-relaxed whitespace-pre-wrap"
          style={{ marginLeft: `${level * 1.5}rem` }}
          dir={textDirection}
        >
          {formatted.displayContent}
        </div>
      )}

      {/* Empty State */}
      {!formatted.hasContent && (
        <div className="text-gray-400 italic text-sm" style={{ marginLeft: `${level * 1.5}rem` }}>
          لا يوجد محتوى في هذا القسم
        </div>
      )}

      {/* Statistics (optional) */}
      {showStats && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
          <span>الكلمات: {formatted.wordCount}</span>
          <span>الأحرف: {formatted.charCount}</span>
          <span>الترتيب: {section.order}</span>
          {section.parent_id && <span>الأب: {section.parent_id}</span>}
        </div>
      )}

      {/* Section Metadata (debug) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-gray-400 font-mono">
          ID: {section.id} | Order: {section.order} | Level: {level}
        </div>
      )}
    </div>
  );
}

/**
 * Render multiple sections
 * @param sections - Array of sections
 * @param props - Additional props for SectionBlock
 * @returns Array of SectionBlock components
 */
export function renderSections(
  sections: Section[],
  props?: Omit<SectionBlockProps, "section">
) {
  return sections.map((section) => (
    <SectionBlock key={section.id} section={section} {...props} />
  ));
}

