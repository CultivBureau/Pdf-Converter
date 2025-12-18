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
  editable = true, // Default to true to enable text selection and buttons
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

  // State to track section content changes
  const [sectionContents, setSectionContents] = React.useState<Map<string, string>>(new Map());

  // Initialize section contents from structure
  React.useEffect(() => {
    const contents = new Map<string, string>();
    separatedStructure.generated.sections.forEach(section => {
      contents.set(section.id, section.content);
    });
    setSectionContents(contents);
  }, [separatedStructure]);

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
        const currentContent = sectionContents.get(section.id) || section.content;
        return (
          <SectionTemplate
            key={section.id}
            title={section.title}
            content={currentContent}
            type={section.type || 'section'}
            editable={editable}
            enableTextSplitting={editable}
            onContentChange={(newContent: string) => {
              setSectionContents(prev => {
                const updated = new Map(prev);
                updated.set(section.id, newContent);
                return updated;
              });
              if (onSectionEdit) {
                onSectionEdit({ ...section, content: newContent });
              }
            }}
            onTitleChange={(newTitle: string) => {
              if (onSectionEdit) {
                onSectionEdit({ ...section, title: newTitle });
              }
            }}
          />
        );
      }
      case 'table': {
        const table = element.data as Table;
        return (
          <DynamicTableTemplate
            key={table.id}
            title={table.title}
            columns={table.columns || table.headers || []}
            rows={table.rows || []}
            editable={false} // Tables are not directly editable for split/bold
            onTitleChange={(newTitle: string) => {
              if (onTableEdit) {
                onTableEdit({ ...table, title: newTitle });
              }
            }}
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

  // Render content based on layout or legacy structure
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
                  <div key={section.id} className="mb-8">
                    {renderElement(id)}
                    {children.map((child) => (
                      <div key={child.id} className="ml-8 mt-4">
                        {renderElement(child.id)}
                      </div>
                    ))}
                  </div>
                );
              }
            }
            
            return (
              <div key={id} className="mb-8">
                {renderElement(id)}
              </div>
            );
          })}
        </>
      );
    } else {
      // Legacy rendering (sections hierarchy + tables)
      const content: React.ReactNode[] = [];

      // Sections
      if (sectionHierarchy.length > 0) {
        sectionHierarchy.forEach((section) => {
          content.push(
            <div key={section.id} className="mb-6">
              {renderElement(section.id)}
              
              {/* Render child sections */}
              {section.children && section.children.length > 0 && (
                <div className="ml-8 mt-4">
                  {section.children.map((child) => (
                    <div key={child.id} className="mb-4">
                      {renderElement(child.id)}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Render tables for this section */}
              {tablesBySection.has(section.id) && (
                <div className="ml-4 mt-4">
                  {tablesBySection.get(section.id)!.map((table) => (
                    <div key={table.id} className="mb-6">
                      {renderElement(table.id)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        });
      }

      {/* Tables without section (orphan tables) */}
      if (tablesBySection.has(null) && tablesBySection.get(null)!.length > 0) {
        tablesBySection.get(null)!.forEach((table) => {
          content.push(
            <div key={table.id} className="mb-6">
              {renderElement(table.id)}
            </div>
          );
        });
      }

      {/* User elements (rendered after generated content) */}
      separatedStructure.user.elements.forEach((element) => {
        content.push(
          <div key={element.id} className="mb-8">
            {renderElement(element.id)}
          </div>
        );
      });

      return content;
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
      {/* Empty State */}
      {separatedStructure.layout.length === 0 && 
       separatedStructure.generated.sections.length === 0 && 
       separatedStructure.generated.tables.length === 0 &&
       separatedStructure.user.elements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No sections or tables to display</p>
        </div>
      )}

      {/* Content */}
      {renderContent()}

      {/* Statistics Summary */}
      {showStats && separatedStructure.meta && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Sections:</span>
              <span className="font-bold ml-2">{separatedStructure.generated.sections.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Tables:</span>
              <span className="font-bold ml-2">{separatedStructure.generated.tables.length}</span>
            </div>
            <div>
              <span className="text-gray-600">User Elements:</span>
              <span className="font-bold ml-2">{separatedStructure.user.elements.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="font-bold ml-2">
                {separatedStructure.meta.generated_at
                  ? new Date(separatedStructure.meta.generated_at).toLocaleDateString()
                  : "Not specified"}
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseTemplate>
  );
}

