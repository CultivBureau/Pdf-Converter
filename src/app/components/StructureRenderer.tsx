"use client";

import React from "react";
import type { Structure, Section, Table, SeparatedStructure, UserElement } from "../types/ExtractTypes";
import SectionTemplate from "../Templates/sectionTemplate";
import DynamicTableTemplate from "../Templates/dynamicTableTemplate";
import BaseTemplate from "../Templates/baseTemplate";
import AirplaneSection from "../Templates/airplaneSection";
import HotelsSection from "../Templates/HotelsSection";
import { sortSectionsByOrder, getSectionHierarchy } from "../utils/formatSections";
import { sortTablesByOrder, groupTablesBySection } from "../utils/formatTables";
import { isSeparatedStructure, isLegacyStructure, migrateToSeparatedStructure } from "../utils/structureMigration";
import { isGeneratedId } from "../utils/contentGuards";

interface StructureRendererProps {
  structure: Structure | SeparatedStructure;
  showStats?: boolean;
  editable?: boolean;
  onSectionEdit?: (section: Section) => void;
  onTableEdit?: (table: Table) => void;
  onUserElementEdit?: (element: UserElement) => void;
  onUserElementDelete?: (id: string) => void;
  className?: string;
}

/**
 * Structure Renderer Component
 * Phase 3: Receiving Extracted Data
 * 
 * Renders complete structure with sections and tables
 * Supports both legacy (Structure) and new (SeparatedStructure) formats
 */
export default function StructureRenderer({
  structure,
  showStats = false,
  editable = false,
  onSectionEdit,
  onTableEdit,
  onUserElementEdit,
  onUserElementDelete,
  className = "",
}: StructureRendererProps) {
  // Normalize structure to SeparatedStructure format
  let separatedStructure: SeparatedStructure;
  if (isSeparatedStructure(structure)) {
    separatedStructure = structure;
  } else if (isLegacyStructure(structure)) {
    separatedStructure = migrateToSeparatedStructure(structure);
  } else {
    // Fallback: empty structure
    separatedStructure = {
      generated: { sections: [], tables: [] },
      user: { elements: [] },
      layout: [],
      meta: {}
    };
  }

  // Build element map for quick lookup by ID
  const elementMap = new Map<string, { type: 'section' | 'table' | 'user'; data: any }>();
  
  separatedStructure.generated.sections.forEach(section => {
    elementMap.set(section.id, { type: 'section', data: section });
  });
  
  separatedStructure.generated.tables.forEach(table => {
    elementMap.set(table.id, { type: 'table', data: table });
  });
  
  separatedStructure.user.elements.forEach(element => {
    elementMap.set(element.id, { type: 'user', data: element });
  });

  // Sort sections and tables for legacy rendering (when not using layout order)
  const sortedSections = sortSectionsByOrder(separatedStructure.generated.sections);
  const sortedTables = sortTablesByOrder(separatedStructure.generated.tables);
  
  // Group tables by section for better organization
  const tablesBySection = groupTablesBySection(sortedTables);
  
  // Get section hierarchy
  const sectionHierarchy = getSectionHierarchy(sortedSections);

  // Render element by ID
  const renderElement = (id: string) => {
    const element = elementMap.get(id);
    if (!element) return null;

    switch (element.type) {
      case 'section': {
        const section = element.data as Section;
        return (
          <SectionTemplate
            key={section.id}
            title={section.title}
            content={section.content}
            type={section.type || 'section'}
            editable={editable}
            onTitleChange={onSectionEdit ? (newTitle: string) => {
              onSectionEdit({ ...section, title: newTitle });
            } : undefined}
            onContentChange={onSectionEdit ? (newContent: string) => {
              onSectionEdit({ ...section, content: newContent });
            } : undefined}
          />
        );
      }
      case 'table': {
        const table = element.data as Table;
        return (
          <DynamicTableTemplate
            key={table.id}
            title={table.title}
            columns={table.columns}
            rows={table.rows}
            editable={editable}
            onTitleChange={onTableEdit ? (newTitle: string) => {
              onTableEdit({ ...table, title: newTitle });
            } : undefined}
            onHeaderChange={onTableEdit ? (headerIndex: number, newValue: string) => {
              const updatedColumns = Array.isArray(table.columns) 
                ? table.columns.map((col: any, idx: number) => {
                    if (idx === headerIndex) {
                      if (typeof col === 'string') {
                        return newValue;
                      } else if (col && typeof col === 'object') {
                        return { ...col, label: newValue };
                      } else {
                        return newValue;
                      }
                    }
                    return col;
                  })
                : [];
              onTableEdit({ ...table, columns: updatedColumns });
            } : undefined}
            onCellChange={onTableEdit ? (rowIndex: number, cellIndex: number, newValue: string) => {
              const updatedRows = table.rows.map((row: any, rIdx: number) => {
                if (rIdx === rowIndex) {
                  if (Array.isArray(row)) {
                    const newRow = [...row];
                    newRow[cellIndex] = newValue;
                    return newRow;
                  } else if (typeof row === 'object') {
                    const col = table.columns[cellIndex];
                    const key = typeof col === 'string' ? col : (col?.key || col?.label || `col_${cellIndex}`);
                    return { ...row, [key]: newValue };
                  }
                }
                return row;
              });
              onTableEdit({ ...table, rows: updatedRows });
            } : undefined}
          />
        );
      }
      case 'user': {
        const userElement = element.data as UserElement;
        const handleEdit = () => {
          if (onUserElementEdit) {
            onUserElementEdit(userElement);
          }
        };
        const handleDelete = () => {
          if (onUserElementDelete) {
            onUserElementDelete(userElement.id);
          }
        };

        if (userElement.type === 'airplane') {
          return (
            <AirplaneSection
              key={userElement.id}
              id={userElement.id}
              {...userElement.data}
              editable={editable}
              onEditSection={handleEdit}
            />
          );
        } else if (userElement.type === 'hotel') {
          return (
            <HotelsSection
              key={userElement.id}
              id={userElement.id}
              {...userElement.data}
              editable={editable}
              onEditSection={handleEdit}
            />
          );
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Use layout order if available, otherwise fall back to legacy rendering
  const useLayoutOrder = separatedStructure.layout && separatedStructure.layout.length > 0;

  // Render content
  const renderContent = () => {
    if (useLayoutOrder) {
      // New layout order rendering
      return (
        <>
          {separatedStructure.layout.map((id) => {
            const element = elementMap.get(id);
            if (!element) return null;

            // For sections, render with hierarchy if they have children
            if (element.type === 'section') {
              const section = element.data as Section;
              // Check if this section has children
              const children = separatedStructure.generated.sections.filter(s => s.parent_id === section.id);
              if (children.length > 0) {
                return (
                  <React.Fragment key={section.id}>
                    <SectionTemplate
                      title={section.title}
                      content={section.content}
                      type={section.type || 'section'}
                      editable={false}
                    />
                    {children.map((child) => (
                      <SectionTemplate
                        key={child.id}
                        title={child.title}
                        content={child.content}
                        type={child.type || 'section'}
                        editable={false}
                      />
                    ))}
                  </React.Fragment>
                );
              }
            }
            
            return <React.Fragment key={id}>{renderElement(id)}</React.Fragment>;
          })}
        </>
      );
    } else {
      // Legacy rendering (sections + tables)
      const content: React.ReactNode[] = [];

      // Add sections
      sortedSections.forEach((section) => {
        content.push(
          <SectionTemplate
            key={section.id}
            title={section.title}
            content={section.content}
            type={section.type || 'section'}
            editable={false}
          />
        );

        // Add tables for this section
        if (tablesBySection.has(section.id)) {
          tablesBySection.get(section.id)!.forEach((table) => {
            content.push(
              <DynamicTableTemplate
                key={table.id}
                title={table.title}
                columns={table.columns}
                rows={table.rows}
                editable={false}
              />
            );
          });
        }
      });

      // Add orphan tables (tables without section)
      if (tablesBySection.has(null)) {
        tablesBySection.get(null)!.forEach((table) => {
          content.push(
            <DynamicTableTemplate
              key={table.id}
              title={table.title}
              columns={table.columns}
              rows={table.rows}
              editable={false}
            />
          );
        });
      }

      // Add user elements
      separatedStructure.user.elements.forEach((element) => {
        content.push(renderElement(element.id));
      });

      return <>{content}</>;
    }
  };

  return (
    <BaseTemplate
      headerImage="/happylifeHeader.jpeg"
      footerImage="/happylifeFooter.jpg"
      showHeader={true}
      showFooter={true}
      className={className}
    >
      {separatedStructure.layout.length === 0 && 
       separatedStructure.generated.sections.length === 0 && 
       separatedStructure.generated.tables.length === 0 &&
       separatedStructure.user.elements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">لا توجد أقسام أو جداول للعرض</p>
        </div>
      ) : (
        renderContent()
      )}

      {/* Statistics Summary */}
      {showStats && separatedStructure.meta && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">إحصائيات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">الأقسام:</span>
              <span className="font-bold ml-2">{separatedStructure.generated.sections.length}</span>
            </div>
            <div>
              <span className="text-gray-600">الجداول:</span>
              <span className="font-bold ml-2">{separatedStructure.generated.tables.length}</span>
            </div>
            <div>
              <span className="text-gray-600">عناصر المستخدم:</span>
              <span className="font-bold ml-2">{separatedStructure.user.elements.length}</span>
            </div>
            <div>
              <span className="text-gray-600">تاريخ الإنشاء:</span>
              <span className="font-bold ml-2">
                {separatedStructure.meta.generated_at
                  ? new Date(separatedStructure.meta.generated_at).toLocaleDateString("ar")
                  : "غير محدد"}
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseTemplate>
  );
}

