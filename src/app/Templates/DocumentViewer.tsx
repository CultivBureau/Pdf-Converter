"use client";

import React, { useState, useEffect } from 'react';
import BaseTemplate from '@/app/Templates/baseTemplate';
import SectionTemplate from '@/app/Templates/sectionTemplate';
import DynamicTableTemplate from '@/app/Templates/dynamicTableTemplate';

interface Section {
  type: string;
  id?: string;
  title?: string;
  content?: string;
  order?: number;
  parent_id?: string | null;
}

interface Table {
  type: string;
  id?: string;
  columns?: string[];
  rows?: any[][];
  order?: number;
  section_id?: string | null;
}

interface DocumentViewerProps {
  sections?: Section[];
  tables?: Table[];
  language?: 'ar' | 'en' | 'auto';
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  sections: initialSections = [], 
  tables = [],
  language = 'auto'
}) => {
  // State to manage sections (allows updates)
  const [sections, setSections] = useState<Section[]>(initialSections);
  
  // Update sections when initialSections prop changes
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);
  
  // Determine if content is Arabic based on language prop or content
  const isArabic = language === 'ar' || 
    (language === 'auto' && sections.some(s => {
      const text = (s.title || '') + (s.content || '');
      // Check if text contains Arabic characters
      return /[\u0600-\u06FF]/.test(text);
    }));

  // Apply RTL direction if Arabic
  const containerStyle: React.CSSProperties = {
    direction: isArabic ? 'rtl' : 'ltr',
    textAlign: isArabic ? 'right' : 'left',
  };
  
  // Handle content change for a section
  const handleContentChange = (sectionId: string | undefined, index: number, newContent: string) => {
    setSections(prevSections => {
      const updated = [...prevSections];
      if (sectionId) {
        const sectionIndex = updated.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
          updated[sectionIndex] = { ...updated[sectionIndex], content: newContent };
        }
      } else {
        // Fallback to index if no ID
        if (updated[index]) {
          updated[index] = { ...updated[index], content: newContent };
        }
      }
      return updated;
    });
  };

  return (
    <div style={containerStyle}>
      <BaseTemplate>
        {sections.map((section, index) => (
          <SectionTemplate 
            key={section.id || `section-${index}`}
            title={section.title || ""}
            content={section.content || ""}
            editable={true}
            onContentChange={(newContent) => {
              handleContentChange(section.id, index, newContent);
            }}
          />
        ))}

        {tables.map((table, index) => (
          <DynamicTableTemplate
            key={table.id || `table-${index}`}
            columns={table.columns || []}
            rows={table.rows || []}
          />
        ))}
      </BaseTemplate>
    </div>
  );
};

export default DocumentViewer;

