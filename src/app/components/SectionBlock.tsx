"use client";

import React from "react";
import type { Section } from "../types/ExtractTypes";
import SectionTemplate from "../Templates/sectionTemplate";

interface SectionBlockProps {
  section: Section;
  level?: number; // For nested sections (hierarchy)
  className?: string;
  showStats?: boolean;
  editable?: boolean;
  onEdit?: (section: Section) => void;
  onDelete?: (section: Section) => void;
  onAddAfter?: (section: Section) => void;
}

/**
 * Section Block Component
 * Uses SectionTemplate with all editing features (bold, split, etc.)
 */
export default function SectionBlock({
  section,
  level = 0,
  className = "",
  showStats = false,
  editable = false,
  onEdit,
  onDelete,
  onAddAfter,
}: SectionBlockProps) {
  const handleContentChange = (newContent: string) => {
    if (onEdit) {
      onEdit({
        ...section,
        content: newContent,
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (onEdit) {
      onEdit({
        ...section,
        title: newTitle,
      });
    }
  };

  // Determine section type based on title/content patterns
  const getSectionType = (): 'section' | 'day' | 'included' | 'excluded' | 'notes' => {
    const titleLower = section.title.toLowerCase();
    const contentLower = section.content.toLowerCase();
    
    if (titleLower.includes('day') || titleLower.includes('يوم')) {
      return 'day';
    }
    if (titleLower.includes('included') || titleLower.includes('يشمل') || contentLower.includes('included')) {
      return 'included';
    }
    if (titleLower.includes('excluded') || titleLower.includes('لا يشمل') || contentLower.includes('excluded')) {
      return 'excluded';
    }
    if (titleLower.includes('note') || titleLower.includes('ملاحظ') || titleLower.includes('تنبيه')) {
      return 'notes';
    }
    return 'section';
  };

  return (
    <div
      className={`section-block relative ${className}`}
      data-section-id={section.id}
      data-section-order={section.order}
    >
      {/* Delete Icon - Top Right */}
      {editable && onDelete && (
        <button
          onClick={() => onDelete(section)}
          className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
          title="Delete Section"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <SectionTemplate
        title={section.title}
        content={section.content}
        type={getSectionType()}
        editable={editable}
        onContentChange={editable ? handleContentChange : undefined}
        onTitleChange={editable ? handleTitleChange : undefined}
        showTitle={!!section.title}
        titleLevel={level === 0 ? 2 : level === 1 ? 3 : 4}
        enableTextSplitting={editable}
        preserveWhitespace={true}
        parseParagraphs={true}
      />
      
      {/* Add Icon - Bottom Center */}
      {editable && onAddAfter && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => onAddAfter(section)}
            className="p-3 bg-[#A4C639] text-white rounded-full hover:bg-[#8FB02E] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
            title="Add New Section After This"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Statistics (optional) */}
      {showStats && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
          <span>Order: {section.order}</span>
          {section.parent_id && <span>Parent: {section.parent_id}</span>}
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

