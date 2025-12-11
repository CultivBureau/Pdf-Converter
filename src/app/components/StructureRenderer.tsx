"use client";

import React from "react";
import type { Structure, Section, Table, Element, ExtractResponse } from "../types/ExtractTypes";
import SectionBlock from "./SectionBlock";
import DynamicTable from "./DynamicTable";
import ImageBlock from "./ImageBlock";
import { sortSectionsByOrder, getSectionHierarchy } from "../utils/formatSections";
import { sortTablesByOrder, groupTablesBySection } from "../utils/formatTables";

interface StructureRendererProps {
  structure?: Structure;
  extractResponse?: ExtractResponse;
  showStats?: boolean;
  editable?: boolean;
  onSectionEdit?: (section: Section) => void;
  onTableEdit?: (table: Table) => void;
  onImageEdit?: (image: Element) => void;
  className?: string;
}

/**
 * Structure Renderer Component
 * Phase 3: Receiving Extracted Data
 * 
 * Renders complete structure with sections, tables, and images
 * Supports both legacy format (Structure) and new enterprise format (ExtractResponse with elements)
 */
export default function StructureRenderer({
  structure,
  extractResponse,
  showStats = false,
  editable = false,
  onSectionEdit,
  onTableEdit,
  onImageEdit,
  className = "",
}: StructureRendererProps) {
  // Handle new enterprise format (elements array)
  if (extractResponse?.elements && extractResponse.elements.length > 0) {
    return (
      <div className={`structure-renderer ${className}`}>
        {extractResponse.elements.map((element, index) => {
          switch (element.type) {
            case "section":
              return (
                <SectionBlock
                  key={element.id}
                  section={{
                    id: element.id,
                    type: "section",
                    title: element.title || "",
                    content: element.content || "",
                    order: index + 1,
                    parent_id: null,
                  }}
                  showStats={showStats}
                  editable={editable}
                  onEdit={onSectionEdit}
                />
              );
            case "table":
              return (
                <DynamicTable
                  key={element.id}
                  table={{
                    id: element.id,
                    type: "table",
                    columns: element.columns || [],
                    rows: element.rows || [],
                    order: index + 1,
                    section_id: null,
                  }}
                  showStats={showStats}
                  editable={editable}
                  onEdit={onTableEdit}
                />
              );
            case "image":
              return (
                <ImageBlock
                  key={element.id}
                  image={{
                    id: element.id,
                    type: "image",
                    page: element.page,
                    src: element.src || "",
                    caption: element.caption,
                    width: element.width,
                    height: element.height,
                  }}
                  showStats={showStats}
                  editable={editable}
                  onEdit={onImageEdit}
                />
              );
            default:
              return null;
          }
        })}
        
        {/* Empty State */}
        {extractResponse.elements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">لا توجد عناصر للعرض</p>
          </div>
        )}
        
        {/* Statistics Summary */}
        {showStats && extractResponse.meta && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">إحصائيات</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">العناصر:</span>
                <span className="font-bold ml-2">{extractResponse.elements.length}</span>
              </div>
              <div>
                <span className="text-gray-600">الأقسام:</span>
                <span className="font-bold ml-2">{extractResponse.meta.sections_count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">الجداول:</span>
                <span className="font-bold ml-2">{extractResponse.meta.tables_count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">الصور:</span>
                <span className="font-bold ml-2">{extractResponse.meta.images_count || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Handle legacy format (Structure)
  if (!structure) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">لا توجد بيانات للعرض</p>
      </div>
    );
  }
  
  // Sort sections and tables by order
  const sortedSections = sortSectionsByOrder(structure.sections);
  const sortedTables = sortTablesByOrder(structure.tables);
  
  // Group tables by section for better organization
  const tablesBySection = groupTablesBySection(sortedTables);
  
  // Get section hierarchy
  const sectionHierarchy = getSectionHierarchy(sortedSections);

  return (
    <div className={`structure-renderer ${className}`}>
      {/* Sections */}
      {sectionHierarchy.length > 0 && (
        <div className="sections-container mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">الأقسام</h2>
          {sectionHierarchy.map((section) => (
            <div key={section.id}>
              <SectionBlock
                section={section}
                level={0}
                showStats={showStats}
                editable={editable}
                onEdit={onSectionEdit}
              />
              
              {/* Render child sections */}
              {section.children && section.children.length > 0 && (
                <div className="ml-8 mt-4">
                  {section.children.map((child) => (
                    <SectionBlock
                      key={child.id}
                      section={child}
                      level={1}
                      showStats={showStats}
                      editable={editable}
                      onEdit={onSectionEdit}
                    />
                  ))}
                </div>
              )}
              
              {/* Render tables for this section */}
              {tablesBySection.has(section.id) && (
                <div className="ml-4 mt-4">
                  {tablesBySection.get(section.id)!.map((table) => (
                    <DynamicTable
                      key={table.id}
                      table={table}
                      showStats={showStats}
                      editable={editable}
                      onEdit={onTableEdit}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tables without section (orphan tables) */}
      {tablesBySection.has(null) && tablesBySection.get(null)!.length > 0 && (
        <div className="tables-container mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">الجداول</h2>
          {tablesBySection.get(null)!.map((table) => (
            <DynamicTable
              key={table.id}
              table={table}
              showStats={showStats}
              editable={editable}
              onEdit={onTableEdit}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedSections.length === 0 && sortedTables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">لا توجد أقسام أو جداول للعرض</p>
        </div>
      )}

      {/* Statistics Summary */}
      {showStats && structure.meta && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">إحصائيات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">الأقسام:</span>
              <span className="font-bold ml-2">{sortedSections.length}</span>
            </div>
            <div>
              <span className="text-gray-600">الجداول:</span>
              <span className="font-bold ml-2">{sortedTables.length}</span>
            </div>
            <div>
              <span className="text-gray-600">تاريخ الإنشاء:</span>
              <span className="font-bold ml-2">
                {structure.meta.generated_at
                  ? new Date(structure.meta.generated_at).toLocaleDateString("ar")
                  : "غير محدد"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">الحالة:</span>
              <span className="font-bold ml-2 text-green-600">جاهز</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

