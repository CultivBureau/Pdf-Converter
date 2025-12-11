/**
 * Generate JSX Template from Extracted JSON
 * 
 * This utility generates a React component template from extracted PDF data
 * using React components directly (no backend JSX generation needed)
 */
import type { ExtractResponse, Element } from "../types/ExtractTypes";

export function generateTemplateFromJson(extractResponse: ExtractResponse): string {
  const { elements, sections, tables, images, meta } = extractResponse;
  
  // Use elements array if available (new format), otherwise use legacy format
  const allElements: Element[] = elements || [];
  
  // If no elements, convert legacy format to elements (preserve order)
  if (allElements.length === 0) {
    // Combine sections, tables, and images while preserving order
    const combined: Array<{element: Element, order: number}> = [];
    
    if (sections) {
      sections.forEach((section, index) => {
        combined.push({
          element: {
            id: section.id || `section_${index}`,
            type: "section",
            page: (section as any).page || 1,
            title: section.title || "",
            content: section.content || "",
          },
          order: (section as any).order || index
        });
      });
    }
    
    if (tables) {
      tables.forEach((table, index) => {
        combined.push({
          element: {
            id: table.id || `table_${index}`,
            type: "table",
            page: (table as any).page || 1,
            columns: table.columns || [],
            rows: table.rows || [],
          },
          order: (table as any).order || (sections?.length || 0) + index
        });
      });
    }
    
    if (images) {
      images.forEach((image, index) => {
        combined.push({
          element: {
            id: `image_${index}`,
            type: "image",
            page: (image as any).page || 1,
            src: (image as any).src || (image as any).path || "",
            caption: (image as any).caption,
          },
          order: (sections?.length || 0) + (tables?.length || 0) + index
        });
      });
    }
    
    // Sort by order and extract elements
    combined.sort((a, b) => a.order - b.order);
    allElements.push(...combined.map(item => item.element));
  }
  
  // Generate JSX template - preserve order from allElements
  const elementsJsx = allElements.map((el) => {
    if (el.type === "section") {
      const title = el.title || "";
      const content = el.content || "";
      
      // Only render if there's actual content
      if (!title && !content) return null;
      
      return `        <SectionTemplate
          key={${JSON.stringify(el.id)}}
          title={${JSON.stringify(title)}}
          content={${JSON.stringify(content)}}
          type="section"
        />`;
    } else if (el.type === "table") {
      const columns = el.columns || [];
      const rows = el.rows || [];
      
      // Only render if there's actual data
      if (columns.length === 0 && rows.length === 0) return null;
      
      return `        <DynamicTable
          key={${JSON.stringify(el.id)}}
          headers={${JSON.stringify(columns)}}
          rows={${JSON.stringify(rows)}}
        />`;
    } else if (el.type === "image") {
      const src = el.src || "";
      const caption = el.caption || "";
      
      // Only render if there's a source
      if (!src) return null;
      
      return `        <div key={${JSON.stringify(el.id)}} className="mb-6">
          <img src={${JSON.stringify(src)}} alt={${JSON.stringify(caption)}} className="max-w-full h-auto rounded-lg" />
          ${caption ? `\n          <p className="text-sm text-gray-600 mt-2 text-center italic">{${JSON.stringify(caption)}}</p>` : ""}
        </div>`;
    }
    return null;
  }).filter(Boolean).join("\n");
  
  const template = `"use client";

import React from 'react';
import SectionTemplate from "@/app/Templates/sectionTemplate";
import DynamicTable from "@/app/components/DynamicTable";
import BaseTemplate from "@/app/Templates/baseTemplate";

export default function Template() {
  return (
    <BaseTemplate>
${elementsJsx || "        <p>No content available</p>"}
    </BaseTemplate>
  );
}`;
  
  return template;
}

function escapeJsxString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

