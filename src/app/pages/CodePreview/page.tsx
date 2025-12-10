"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CodeEditor from "../../components/CodeEditor";
import PreviewRenderer from "../../components/PreviewRenderer";
import ToggleSwitch from "../../components/ToggleSwitch";
import CustomizationPanel, { PanelContext } from "../../components/CustomizationPanel";
import CreateTableModal from "../../components/CreateTableModal";
import AirplaneSectionModal, { type AirplaneSectionData } from "../../components/AirplaneSectionModal";
import HotelsSectionModal, { type HotelsSectionData } from "../../components/HotelsSectionModal";
import { getElementInfo } from "../../utils/jsxParser";
import { addSection, removeSection, addNewTable, updateTableCell, updateTableColumnHeader } from "../../utils/codeManipulator";
import { insertAirplaneSection, insertHotelsSection } from "../../utils/sectionInserter";
import { updateAirplaneSectionFlights, updateHotelsSectionHotels, updateAirplaneSection, updateHotelsSection, deleteAirplaneSection, deleteHotelsSection } from "../../utils/sectionCodeUpdater";
import { extractAllTablesFromDOM, updateCodeWithTableData } from "../../utils/extractTableData";
import { isAuthenticated } from "../../services/AuthApi";
import { saveDocument, updateDocument, getDocument } from "../../services/HistoryApi";
import ProtectedRoute from "../../components/ProtectedRoute";

type Mode = "code" | "preview" | "split";

// Enhanced starter template showcasing DynamicTable, Section, and Header components
// Import components at the top of the generated template
const STARTER_TEMPLATE = `export default function Template() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto w-[794px] bg-white text-gray-900 shadow-lg print:shadow-none">
        {/* Header */}
        <div className="bg-linear-to-r from-[#A4C639] to-[#8FB02E] px-10 py-6">
          <div className="flex items-center justify-between">
            <div className="bg-white px-4 py-2 rounded">
              <h1 className="text-2xl font-bold text-[#A4C639]">
                HappyLife Travel & Tourism
              </h1>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center py-6 px-10">
          <h1 className="text-3xl font-bold text-[#A4C639] underline decoration-2">
            Travel Package Template
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Start editing this template or upload a PDF to generate a custom one
          </p>
        </div>

        {/* Content Section */}
        <div className="px-10 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Welcome to the Template Editor
          </h2>
          <p className="text-gray-700 mb-4">
            This is a simple starter template. You can:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Edit this code directly in the Code view</li>
            <li>Upload a PDF to generate a custom template with editable fields</li>
            <li>Export your template as code or PDF</li>
          </ul>
        </div>

        {/* Example Content */}
        <div className="px-10 pb-8">
          <h3 className="font-bold text-gray-900 mb-3">
            Example Section
          </h3>
          <p className="text-sm text-gray-700">
            Replace this with your own content. When you upload a PDF, 
            the AI will generate a template with your content and add 
            interactive editing features automatically.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-10 py-4 text-center text-xs text-gray-600">
          <p>Created with HappyLife PDF Template Generator</p>
        </div>
      </div>
    </div>
  );
}`;

function CodePageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("preview");
  const [code, setCode] = useState<string>(STARTER_TEMPLATE);
  const [values, setValues] = useState<Record<string, string>>({});
  const [externalWarnings, setExternalWarnings] = useState<string[]>([]);
  const [sourceMetadata, setSourceMetadata] = useState<{
    filename?: string;
    uploadedAt?: string;
  } | null>(null);
  const [processedTables, setProcessedTables] = useState<Array<{
    tableId: string;
    jsx: string;
  }>>([]);
  const [panelContext, setPanelContext] = useState<PanelContext>(null);
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
  const [showTableCreatedToast, setShowTableCreatedToast] = useState(false);
  const [airplaneModalOpen, setAirplaneModalOpen] = useState(false);
  const [hotelsModalOpen, setHotelsModalOpen] = useState(false);
  const [editingAirplaneSectionId, setEditingAirplaneSectionId] = useState<string | null>(null);
  const [editingHotelsSectionId, setEditingHotelsSectionId] = useState<string | null>(null);
  const [airplaneSectionInitialData, setAirplaneSectionInitialData] = useState<AirplaneSectionData | undefined>(undefined);
  const [hotelsSectionInitialData, setHotelsSectionInitialData] = useState<HotelsSectionData | undefined>(undefined);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<string>(code);
  
  // Keep code ref updated
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we're loading a specific document
    const docIdParam = searchParams?.get("docId");
    if (docIdParam && isAuthenticated()) {
      loadDocument(docIdParam);
      return;
    }

    const storedCode = sessionStorage.getItem("codePreview.initialCode");
    const storedWarnings = sessionStorage.getItem("codePreview.warnings");
    const storedMetadata = sessionStorage.getItem("codePreview.metadata");
    const storedTables = sessionStorage.getItem("codePreview.processedTables");
    const storedDocId = sessionStorage.getItem("codePreview.documentId");

    if (storedDocId) {
      setDocumentId(storedDocId);
      sessionStorage.removeItem("codePreview.documentId");
    }

    if (storedCode) {
      // Clean and fix import paths when loading from storage
      import("../../utils/parseGptCode").then(({ cleanJSXCode }) => {
        const cleanedCode = cleanJSXCode(storedCode);
        setCode(cleanedCode);
      });
      sessionStorage.removeItem("codePreview.initialCode");
    }

    if (storedWarnings) {
      try {
        const parsed = JSON.parse(storedWarnings);
        if (Array.isArray(parsed)) {
          setExternalWarnings(parsed as string[]);
        }
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.warnings");
    }

    if (storedMetadata) {
      try {
        const parsed = JSON.parse(storedMetadata);
        setSourceMetadata(parsed);
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.metadata");
    }

    if (storedTables) {
      try {
        const parsed = JSON.parse(storedTables);
        if (Array.isArray(parsed)) {
          setProcessedTables(parsed);
        }
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("codePreview.processedTables");
    }
  }, [searchParams]);

  const loadDocument = async (docId: string) => {
    try {
      const response = await getDocument(docId);
      const doc = response.document;
      
      setDocumentId(doc.id);
      if (doc.jsx_code) {
        setCode(doc.jsx_code);
      }
      if (doc.metadata) {
        setSourceMetadata({
          filename: doc.metadata.filename || doc.original_filename,
          uploadedAt: doc.created_at,
        });
        if (doc.metadata.warnings) {
          setExternalWarnings(doc.metadata.warnings);
        }
      }
    } catch (err) {
      console.error("Failed to load document:", err);
      alert("Failed to load document");
    }
  };

  const setValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  // Add data attributes to preview elements for the edit icons
  useEffect(() => {
    if (mode !== "preview" && mode !== "split") return;
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Don't trigger if clicking on add button
      if (target.closest('.section-add-btn')) return;
      
      const elementInfo = getElementInfo(target);
      
      // Double click for sections only (not tables)
      if (elementInfo.type === 'section' && elementInfo.sectionIndex !== undefined) {
        setPanelContext({ type: 'section', index: elementInfo.sectionIndex });
      }
    };
    
    container.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [mode, code]);
  useEffect(() => {
    if (mode !== "preview" && mode !== "split") return;
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    // Wait for content to render
    const timeout = setTimeout(() => {
      // Parse code to get structure
      import('../../utils/jsxParser').then(({ parseJSXCode }) => {
        const parsed = parseJSXCode(code);
        
        // Clean up existing buttons and remove old event listeners
        const existingButtons = container.querySelectorAll('.section-add-btn, .section-edit-btn, .section-delete-btn, .table-edit-btn, .airplane-section-edit-btn, .hotels-section-edit-btn');
        existingButtons.forEach(btn => btn.remove());
        
        // Remove old setup flags and clone elements to remove event listeners
        const existingSections = container.querySelectorAll('[data-section-setup]');
        existingSections.forEach(section => {
          (section as HTMLElement).removeAttribute('data-section-setup');
        });
        const existingTables = container.querySelectorAll('[data-table-setup]');
        existingTables.forEach(table => {
          (table as HTMLElement).removeAttribute('data-table-setup');
        });
        const existingAirplaneSections = container.querySelectorAll('[data-airplane-section-setup]');
        existingAirplaneSections.forEach(section => {
          (section as HTMLElement).removeAttribute('data-airplane-section-setup');
        });
        const existingHotelsSections = container.querySelectorAll('[data-hotels-section-setup]');
        existingHotelsSections.forEach(section => {
          (section as HTMLElement).removeAttribute('data-hotels-section-setup');
        });
        
        // Find all sections (section elements or divs that look like sections)
        const sections = container.querySelectorAll('section, [class*="section"]');
        let sectionIndex = 0;
        sections.forEach((section) => {
          // Only mark as section if it's likely a SectionTemplate (has title or content structure)
          const hasTitle = section.querySelector('h1, h2, h3, h4, h5, h6');
          const hasContent = section.textContent && section.textContent.trim().length > 0;
          
          if (hasTitle || hasContent) {
            if (sectionIndex < parsed.sections.length) {
              const sectionEl = section as HTMLElement;
              
              sectionEl.setAttribute('data-section-index', sectionIndex.toString());
              sectionEl.setAttribute('data-section-setup', 'true');
              sectionEl.style.cursor = 'pointer';
              sectionEl.style.position = 'relative';
              sectionEl.style.transition = 'all 0.3s ease';
              sectionEl.style.opacity = '1';
              sectionEl.style.transform = 'translateY(0)';
              sectionEl.style.marginBottom = '24px'; // Space for buttons
              sectionEl.title = 'Click edit button to modify section';
              
              let addButton: HTMLButtonElement | null = null;
              let editButton: HTMLButtonElement | null = null;
              let deleteButton: HTMLButtonElement | null = null;
              
              // Add hover effect and action buttons
              sectionEl.addEventListener('mouseenter', function() {
                this.style.outline = '2px dashed #A4C639';
                this.style.outlineOffset = '2px';
                this.style.transform = 'translateY(-2px)';
                
                // Create edit button (top right)
                if (!editButton) {
                  editButton = document.createElement('button');
                  editButton.className = 'section-edit-btn';
                  editButton.style.cssText = 'position: absolute; right: 8px; top: 8px; width: 36px; height: 36px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                  editButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                  editButton.title = 'تعديل القسم';
                  
                  editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionId = sectionEl.getAttribute('data-section-id');
                    const sectionIdx = parseInt(sectionEl.getAttribute('data-section-index') || '0', 10);
                    if (sectionId) {
                      // Use ID if available, but PanelContext still uses index for now
                      setPanelContext({ type: 'section', index: sectionIdx });
                    } else {
                      setPanelContext({ type: 'section', index: sectionIdx });
                    }
                  });
                  
                  editButton.addEventListener('mouseenter', function() {
                    this.style.background = '#8FB02E';
                    this.style.transform = 'scale(1.1)';
                  });
                  
                  editButton.addEventListener('mouseleave', function() {
                    this.style.background = '#A4C639';
                    this.style.transform = 'scale(1)';
                  });
                  
                  sectionEl.appendChild(editButton);
                }
                editButton.style.opacity = '1';
                
                // Create delete button (top left)
                if (!deleteButton) {
                  deleteButton = document.createElement('button');
                  deleteButton.className = 'section-delete-btn';
                  deleteButton.style.cssText = 'position: absolute; left: 8px; top: 8px; width: 36px; height: 36px; background: #ef4444; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                  deleteButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                  deleteButton.title = 'حذف القسم';
                  
                  deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionId = sectionEl.getAttribute('data-section-id');
                    if (!sectionId) {
                      // Fallback: try to find ID from parsed code
                      const sectionIdx = parseInt(sectionEl.getAttribute('data-section-index') || '0', 10);
                      const parsed = parseJSXCode(codeRef.current);
                      if (parsed.sections[sectionIdx]?.id) {
                        const confirmed = window.confirm('هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.');
                        if (confirmed) {
                          const newCode = removeSection(codeRef.current, parsed.sections[sectionIdx].id!);
                          setCode(newCode);
                        }
                        return;
                      }
                      console.error('Could not find section ID');
                      return;
                    }
                    const confirmed = window.confirm('هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.');
                    if (confirmed) {
                      const currentCode = codeRef.current;
                      const newCode = removeSection(currentCode, sectionId);
                      setCode(newCode);
                    }
                  });
                  
                  deleteButton.addEventListener('mouseenter', function() {
                    this.style.background = '#dc2626';
                    this.style.transform = 'scale(1.1)';
                  });
                  
                  deleteButton.addEventListener('mouseleave', function() {
                    this.style.background = '#ef4444';
                    this.style.transform = 'scale(1)';
                  });
                  
                  sectionEl.appendChild(deleteButton);
                }
                deleteButton.style.opacity = '1';
                
                // Create and show add button (bottom center)
                if (!addButton) {
                  addButton = document.createElement('button');
                  addButton.className = 'section-add-btn';
                  addButton.style.cssText = 'position: absolute; left: 50%; bottom: -16px; transform: translate(-50%, 0) scale(0.8); width: 32px; height: 32px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: none;';
                  addButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>';
                  addButton.title = 'إضافة قسم جديد';
                  
                  addButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionIdx = parseInt(sectionEl.getAttribute('data-section-index') || '0', 10);
                    // Use current code from ref (always latest)
                    const currentCode = codeRef.current;
                    const newCode = addSection(currentCode, {
                      title: "قسم جديد",
                      content: "محتوى القسم هنا",
                      type: "section",
                    }, sectionIdx + 1);
                    setCode(newCode);
                  });
                  
                  addButton.addEventListener('mouseenter', function() {
                    this.style.background = '#8FB02E';
                    this.style.transform = 'translate(-50%, 0) scale(1.1)';
                  });
                  
                  addButton.addEventListener('mouseleave', function() {
                    this.style.background = '#A4C639';
                    this.style.transform = 'translate(-50%, 0) scale(1)';
                  });
                  
                  sectionEl.appendChild(addButton);
                }
                addButton.style.opacity = '1';
                addButton.style.transform = 'translate(-50%, 0) scale(1)';
              });
              
              sectionEl.addEventListener('mouseleave', function(e) {
                // Don't hide if mouse is moving to any button
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget && (
                  relatedTarget === addButton || 
                  relatedTarget === editButton ||
                  relatedTarget === deleteButton ||
                  relatedTarget.closest('.section-add-btn, .section-edit-btn, .section-delete-btn')
                )) {
                  return;
                }
                
                this.style.outline = '';
                this.style.outlineOffset = '';
                this.style.transform = 'translateY(0)';
                
                // Hide all buttons
                if (addButton) {
                  addButton.style.opacity = '0';
                  addButton.style.transform = 'translate(-50%, 0) scale(0.8)';
                }
                if (editButton) {
                  editButton.style.opacity = '0';
                }
                if (deleteButton) {
                  deleteButton.style.opacity = '0';
                }
              });
              
              // Keep buttons visible when hovering over them
              if (addButton) {
                addButton.addEventListener('mouseenter', function() {
                  this.style.opacity = '1';
                  this.style.transform = 'translate(-50%, 0) scale(1.1)';
                });
              }
              if (editButton) {
                editButton.addEventListener('mouseenter', function() {
                  this.style.opacity = '1';
                });
              }
              if (deleteButton) {
                deleteButton.addEventListener('mouseenter', function() {
                  this.style.opacity = '1';
                });
              }
              
              
              sectionIndex++;
            }
          }
        });
        
        // Find all tables (only actual table elements)
        // Exclude tables that are inside AirplaneSection or HotelsSection components
        const allTables = container.querySelectorAll('table');
        const tables: Element[] = [];
        
        allTables.forEach((table) => {
          // Check if this table is inside an AirplaneSection or HotelsSection
          const parentSection = table.closest('[data-airplane-section-setup], [data-hotels-section-setup]');
          // Only include tables that are NOT inside airplane/hotel sections
          if (!parentSection) {
            tables.push(table);
          }
        });
        
        console.log('Found', tables.length, 'table elements in DOM (excluding airplane/hotel sections), parsed', parsed.tables.length, 'tables from code');
        
        tables.forEach((table, domIndex) => {
          // Only process actual table elements
          if (table.tagName === 'TABLE') {
            const tableElement = table.closest('div') || table;
            const tableEl = tableElement as HTMLElement;
            
            // Try to find matching parsed table by position or by checking nearby code
            // For now, match by order in DOM
            let matchedTable = parsed.tables[domIndex];
            
            // If we can't match by index, try to find by checking the table structure
            if (!matchedTable && parsed.tables.length > 0) {
              // Find the closest match by checking if table has similar structure
              // This is a fallback - ideally tables should have IDs
              matchedTable = parsed.tables[Math.min(domIndex, parsed.tables.length - 1)];
            }
            
            if (!matchedTable) {
              console.warn('Could not match table at DOM index', domIndex);
              return;
            }
            
            const tableId = matchedTable.id || `table_${domIndex}_${Date.now()}`;
            
            console.log(`Setting up table ${tableId} (DOM index ${domIndex})`);
            tableEl.setAttribute('data-table-id', tableId);
            tableEl.setAttribute('data-table-index', domIndex.toString()); // Keep for backward compatibility
            tableEl.setAttribute('data-table-setup', 'true');
            tableEl.style.cursor = 'pointer';
            tableEl.style.transition = 'all 0.3s ease';
            tableEl.style.opacity = '1';
            tableEl.style.position = 'relative';
            tableEl.title = 'Click the gear icon to manage table';
            let editButton: HTMLButtonElement | null = null;
            
            // Add hover effect and edit button
            tableEl.addEventListener('mouseenter', function() {
              this.style.outline = '2px dashed #A4C639';
              this.style.outlineOffset = '2px';
              this.style.transform = 'translateY(-2px)';
              
              // Create and show edit button
              if (!editButton) {
                editButton = document.createElement('button');
                editButton.className = 'table-edit-btn';
                editButton.style.cssText = 'position: absolute; right: 8px; top: 8px; width: 36px; height: 36px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                editButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>';
                editButton.title = 'Edit table structure';
                
                editButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const tblId = tableEl.getAttribute('data-table-id');
                  if (tblId) {
                    console.log('Clicked table ID:', tblId);
                    setPanelContext({ type: 'table', tableId: tblId });
                  } else {
                    // Fallback to index for backward compatibility
                  const tblIdx = parseInt(tableEl.getAttribute('data-table-index') || '0', 10);
                    console.log('Clicked table index (fallback):', tblIdx);
                  setPanelContext({ type: 'table', index: tblIdx });
                  }
                });
                
                editButton.addEventListener('mouseenter', function() {
                  this.style.background = '#8FB02E';
                  this.style.transform = 'scale(1.1)';
                });
                
                editButton.addEventListener('mouseleave', function() {
                  this.style.background = '#A4C639';
                  this.style.transform = 'scale(1)';
                });
                
                tableEl.appendChild(editButton);
              }
              editButton.style.opacity = '1';
            });
            
            tableEl.addEventListener('mouseleave', function(e) {
              // Don't hide if mouse is moving to the edit button
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget && (relatedTarget === editButton || relatedTarget.closest('.table-edit-btn'))) {
                return;
              }
              
              this.style.outline = '';
              this.style.outlineOffset = '';
              this.style.transform = 'translateY(0)';
              
              // Hide edit button
              if (editButton) {
                editButton.style.opacity = '0';
              }
            });
            
            // Keep button visible when hovering over it
            if (editButton) {
              editButton.addEventListener('mouseenter', function() {
                this.style.opacity = '1';
              });
            }
          }
        });

        // Find and setup AirplaneSection components
        const airplaneSections = container.querySelectorAll('[dir="rtl"]');
        let airplaneSectionIndex = 0;
        airplaneSections.forEach((section) => {
          // Check if this is an AirplaneSection by looking for the characteristic table structure
          const hasAirplaneTable = section.querySelector('table thead tr.bg-\\[\\#F5A623\\]') || 
                                   section.querySelector('table thead tr[style*="background"]');
          const hasAirplaneIcon = section.querySelector('svg path[d*="2.405"]'); // Airplane icon path
          
          if (hasAirplaneTable && hasAirplaneIcon) {
            const sectionEl = section as HTMLElement;
            // Extract ID from code
            const sectionRegex = /<AirplaneSection\s+[^>]*\/>/g;
            const matches = Array.from(codeRef.current.matchAll(sectionRegex));
            let sectionId: string | null = null;
            if (matches[airplaneSectionIndex]) {
              const idMatch = matches[airplaneSectionIndex][0].match(/id\s*=\s*["']([^"']+)["']/);
              if (idMatch) {
                sectionId = idMatch[1];
              }
            }
            
            sectionEl.setAttribute('data-airplane-section-index', airplaneSectionIndex.toString());
            if (sectionId) {
              sectionEl.setAttribute('data-airplane-section-id', sectionId);
            }
            sectionEl.setAttribute('data-airplane-section-setup', 'true');
            sectionEl.style.position = 'relative';
            sectionEl.style.cursor = 'pointer';
            
            let editButton: HTMLButtonElement | null = null;
            let deleteButton: HTMLButtonElement | null = null;
            
            sectionEl.addEventListener('mouseenter', function() {
              this.style.outline = '2px dashed #4A5568';
              this.style.outlineOffset = '2px';
              
              if (!editButton) {
                editButton = document.createElement('button');
                editButton.className = 'airplane-section-edit-btn';
                editButton.style.cssText = 'position: absolute; right: 8px; top: 8px; width: 36px; height: 36px; background: #4A5568; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                editButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                editButton.title = 'تعديل قسم الطيران';
                
                // Create delete button
                deleteButton = document.createElement('button');
                deleteButton.className = 'airplane-section-delete-btn';
                deleteButton.style.cssText = 'position: absolute; left: 8px; top: 8px; width: 36px; height: 36px; background: #ef4444; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                deleteButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                deleteButton.title = 'حذف قسم الطيران';
                
                deleteButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Extract ID from the component code
                  const sectionId = sectionEl.getAttribute('data-airplane-section-id');
                  if (!sectionId) {
                    // Fallback: try to find ID from parsed code
                    const idx = parseInt(sectionEl.getAttribute('data-airplane-section-index') || '0', 10);
                    const parsed = parseJSXCode(codeRef.current);
                    // Find AirplaneSection in code by index
                    const sectionRegex = /<AirplaneSection\s+[^>]*\/>/g;
                    const matches = Array.from(codeRef.current.matchAll(sectionRegex));
                    if (matches[idx]) {
                      const idMatch = matches[idx][0].match(/id\s*=\s*["']([^"']+)["']/);
                      if (idMatch) {
                        const confirmed = window.confirm('هل أنت متأكد من حذف قسم الطيران؟ لا يمكن التراجع عن هذا الإجراء.');
                        if (confirmed) {
                          const newCode = deleteAirplaneSection(codeRef.current, idMatch[1]);
                          setCode(newCode);
                        }
                        return;
                      }
                    }
                    console.error('Could not find AirplaneSection ID');
                    return;
                  }
                  const confirmed = window.confirm('هل أنت متأكد من حذف قسم الطيران؟ لا يمكن التراجع عن هذا الإجراء.');
                  if (confirmed) {
                    const currentCode = codeRef.current;
                    const newCode = deleteAirplaneSection(currentCode, sectionId);
                    setCode(newCode);
                  }
                });
                
                deleteButton.addEventListener('mouseenter', function() {
                  this.style.background = '#dc2626';
                  this.style.transform = 'scale(1.1)';
                });
                
                deleteButton.addEventListener('mouseleave', function() {
                  this.style.background = '#ef4444';
                  this.style.transform = 'scale(1)';
                });
                
                sectionEl.appendChild(deleteButton);
                
                editButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const sectionId = sectionEl.getAttribute('data-airplane-section-id');
                  const idx = parseInt(sectionEl.getAttribute('data-airplane-section-index') || '0', 10);
                  
                  // Extract current data from the rendered component
                  const titleEl = sectionEl.querySelector('h2');
                  const title = titleEl?.textContent?.trim() || 'حجز الطيران';
                  
                  const noticeEl = sectionEl.querySelector('p.text-\\[\\#DC143C\\]');
                  const noticeMessage = noticeEl?.textContent?.trim() || '';
                  
                  // Extract flights from table rows
                  const tableRows = sectionEl.querySelectorAll('tbody tr');
                  const flights: AirplaneSectionData['flights'] = [];
                  
                  tableRows.forEach((row) => {
                    const cells = row.querySelectorAll('td');
                    // Check if first cell has edit buttons (editable mode)
                    const hasEditButtons = cells[0]?.querySelector('button');
                    const startIndex = hasEditButtons ? 1 : 0;
                    
                    if (cells.length >= (5 + (hasEditButtons ? 1 : 0))) {
                      const date = cells[startIndex]?.textContent?.trim() || '';
                      const fromAirport = cells[startIndex + 1]?.textContent?.trim() || '';
                      const toAirport = cells[startIndex + 2]?.textContent?.trim() || '';
                      const travelersText = cells[startIndex + 3]?.textContent?.trim() || '';
                      const luggage = cells[startIndex + 4]?.textContent?.trim() || '';
                      
                      // Parse travelers
                      const adultsMatch = travelersText.match(/البالغين:(\d+)|Adults:(\d+)/);
                      const childrenMatch = travelersText.match(/الاطفال:(\d+)|Children:(\d+)/);
                      const infantsMatch = travelersText.match(/رضيع:(\d+)|Infants:(\d+)/);
                      
                      flights.push({
                        date,
                        fromAirport,
                        toAirport,
                        travelers: {
                          adults: parseInt(adultsMatch?.[1] || adultsMatch?.[2] || '0', 10),
                          children: parseInt(childrenMatch?.[1] || childrenMatch?.[2] || '0', 10),
                          infants: parseInt(infantsMatch?.[1] || infantsMatch?.[2] || '0', 10),
                        },
                        luggage,
                      });
                    }
                  });
                  
                  setAirplaneSectionInitialData({
                    title,
                    flights,
                    noticeMessage,
                    showTitle: true,
                    showNotice: !!noticeMessage,
                  });
                  setEditingAirplaneSectionId(sectionId || null);
                  setAirplaneModalOpen(true);
                });
                
                sectionEl.appendChild(editButton);
              }
              if (editButton) {
                editButton.style.opacity = '1';
              }
            });
            
            // Add edit/remove buttons to each flight row if they don't exist
            const flightRows = sectionEl.querySelectorAll('tbody tr');
            const table = sectionEl.querySelector('table');
            const thead = table?.querySelector('thead tr');
            
            // Add actions column header if it doesn't exist
            if (thead && !thead.querySelector('th:first-child')?.textContent?.includes('إجراءات')) {
              const actionsHeader = document.createElement('th');
              actionsHeader.className = 'px-2 py-2.5 text-center text-white font-bold text-xs border-r-2 border-white';
              actionsHeader.textContent = 'إجراءات';
              actionsHeader.style.cssText = 'background: #F5A623;';
              thead.insertBefore(actionsHeader, thead.firstChild);
            }
            
            flightRows.forEach((row, flightIdx) => {
              // Add actions cell if it doesn't exist
              let actionsCell = row.querySelector('td:first-child');
              if (!actionsCell || !actionsCell.querySelector('button')) {
                actionsCell = document.createElement('td');
                actionsCell.className = 'px-2 py-3 border-r-2 border-white';
                actionsCell.style.cssText = 'background: #E8E8E8;';
                
                const btnContainer = document.createElement('div');
                btnContainer.className = 'flex flex-col gap-1';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
                editBtn.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                editBtn.title = 'تعديل';
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors';
                removeBtn.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                removeBtn.title = 'حذف';
                removeBtn.style.display = flightRows.length > 1 ? 'block' : 'none';
                
                btnContainer.appendChild(editBtn);
                btnContainer.appendChild(removeBtn);
                actionsCell.appendChild(btnContainer);
                row.insertBefore(actionsCell, row.firstChild);
              }
              
              const editBtn = row.querySelector('button.bg-blue-500') as HTMLButtonElement;
              const removeBtn = row.querySelector('button.bg-red-500') as HTMLButtonElement;
              const addBtn = sectionEl.querySelector('button.bg-green-500');
              
              if (editBtn && !editBtn.hasAttribute('data-flight-edit-handler')) {
                editBtn.setAttribute('data-flight-edit-handler', 'true');
                editBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Extract flight data from this row
                  const cells = row.querySelectorAll('td');
                  const hasEditButtons = cells[0]?.querySelector('button');
                  const startIndex = hasEditButtons ? 1 : 0;
                  
                  if (cells.length >= (5 + (hasEditButtons ? 1 : 0))) {
                    const date = cells[startIndex]?.textContent?.trim() || '';
                    const fromAirport = cells[startIndex + 1]?.textContent?.trim() || '';
                    const toAirport = cells[startIndex + 2]?.textContent?.trim() || '';
                    const travelersText = cells[startIndex + 3]?.textContent?.trim() || '';
                    const luggage = cells[startIndex + 4]?.textContent?.trim() || '';
                    
                    const adultsMatch = travelersText.match(/البالغين:(\d+)|Adults:(\d+)/);
                    const childrenMatch = travelersText.match(/الاطفال:(\d+)|Children:(\d+)/);
                    const infantsMatch = travelersText.match(/رضيع:(\d+)|Infants:(\d+)/);
                    
                    const flight = {
                      date,
                      fromAirport,
                      toAirport,
                      travelers: {
                        adults: parseInt(adultsMatch?.[1] || adultsMatch?.[2] || '0', 10),
                        children: parseInt(childrenMatch?.[1] || childrenMatch?.[2] || '0', 10),
                        infants: parseInt(infantsMatch?.[1] || infantsMatch?.[2] || '0', 10),
                      },
                      luggage,
                    };
                    
                    // Extract all flights and update the one being edited
                    const allFlights: AirplaneSectionData['flights'] = [];
                    flightRows.forEach((r) => {
                      const c = r.querySelectorAll('td');
                      const sIdx = c[0]?.querySelector('button') ? 1 : 0;
                      if (c.length >= (5 + (c[0]?.querySelector('button') ? 1 : 0))) {
                        const d = c[sIdx]?.textContent?.trim() || '';
                        const fa = c[sIdx + 1]?.textContent?.trim() || '';
                        const ta = c[sIdx + 2]?.textContent?.trim() || '';
                        const tt = c[sIdx + 3]?.textContent?.trim() || '';
                        const l = c[sIdx + 4]?.textContent?.trim() || '';
                        
                        const am = tt.match(/البالغين:(\d+)|Adults:(\d+)/);
                        const cm = tt.match(/الاطفال:(\d+)|Children:(\d+)/);
                        const im = tt.match(/رضيع:(\d+)|Infants:(\d+)/);
                        
                        allFlights.push({
                          date: d,
                          fromAirport: fa,
                          toAirport: ta,
                          travelers: {
                            adults: parseInt(am?.[1] || am?.[2] || '0', 10),
                            children: parseInt(cm?.[1] || cm?.[2] || '0', 10),
                            infants: parseInt(im?.[1] || im?.[2] || '0', 10),
                          },
                          luggage: l,
                        });
                      }
                    });
                    
                    // Replace the flight at flightIdx with the extracted one (in case it was edited)
                    allFlights[flightIdx] = flight;
                    
                    const titleEl = sectionEl.querySelector('h2');
                    const title = titleEl?.textContent?.trim() || 'حجز الطيران';
                    const noticeEl = sectionEl.querySelector('p.text-\\[\\#DC143C\\]');
                    const noticeMessage = noticeEl?.textContent?.trim() || '';
                    
                    setAirplaneSectionInitialData({
                      title,
                      flights: allFlights,
                      noticeMessage,
                      showTitle: true,
                      showNotice: !!noticeMessage,
                    });
                    const sectionId = sectionEl.getAttribute('data-airplane-section-id');
                    setEditingAirplaneSectionId(sectionId || null);
                    setAirplaneModalOpen(true);
                  }
                });
              }
              
              if (removeBtn && !removeBtn.hasAttribute('data-flight-remove-handler')) {
                removeBtn.setAttribute('data-flight-remove-handler', 'true');
                removeBtn.addEventListener('click', async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Extract all flights except the one being removed
                  const allFlights: AirplaneSectionData['flights'] = [];
                  flightRows.forEach((r, i) => {
                    if (i === flightIdx) return; // Skip the one being removed
                    
                    const c = r.querySelectorAll('td');
                    const sIdx = c[0]?.querySelector('button') ? 1 : 0;
                    if (c.length >= (5 + (c[0]?.querySelector('button') ? 1 : 0))) {
                      const d = c[sIdx]?.textContent?.trim() || '';
                      const fa = c[sIdx + 1]?.textContent?.trim() || '';
                      const ta = c[sIdx + 2]?.textContent?.trim() || '';
                      const tt = c[sIdx + 3]?.textContent?.trim() || '';
                      const l = c[sIdx + 4]?.textContent?.trim() || '';
                      
                      const am = tt.match(/البالغين:(\d+)|Adults:(\d+)/);
                      const cm = tt.match(/الاطفال:(\d+)|Children:(\d+)/);
                      const im = tt.match(/رضيع:(\d+)|Infants:(\d+)/);
                      
                      allFlights.push({
                        date: d,
                        fromAirport: fa,
                        toAirport: ta,
                        travelers: {
                          adults: parseInt(am?.[1] || am?.[2] || '0', 10),
                          children: parseInt(cm?.[1] || cm?.[2] || '0', 10),
                          infants: parseInt(im?.[1] || im?.[2] || '0', 10),
                        },
                        luggage: l,
                      });
                    }
                  });
                  
                  if (allFlights.length > 0) {
                    const updatedCode = updateAirplaneSectionFlights(codeRef.current, idx, allFlights);
                    setCode(updatedCode);
                  } else {
                    // Can't remove last flight - show message or prevent
                    alert('يجب أن يكون هناك رحلة واحدة على الأقل');
                  }
                });
              }
            });
            
            // Add "Add Flight" button if it doesn't exist
            let addFlightBtn = sectionEl.querySelector('button.bg-green-500');
            const tbody = table?.querySelector('tbody');
            if (!addFlightBtn && tbody) {
              const addRow = document.createElement('tr');
              const addCell = document.createElement('td');
              addCell.colSpan = thead?.querySelectorAll('th').length || 6;
              addCell.className = 'px-4 py-3 text-center';
              addCell.style.cssText = 'background: #E8E8E8;';
              
              addFlightBtn = document.createElement('button');
              addFlightBtn.className = 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2 mx-auto';
              addFlightBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>إضافة رحلة جديدة';
              
              addCell.appendChild(addFlightBtn);
              addRow.appendChild(addCell);
              tbody.appendChild(addRow);
            }
            
            if (addFlightBtn && !addFlightBtn.hasAttribute('data-add-flight-handler')) {
              addFlightBtn.setAttribute('data-add-flight-handler', 'true');
              addFlightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Extract current flights and add a new empty one
                const flightRows = sectionEl.querySelectorAll('tbody tr:not(:last-child)');
                const allFlights: AirplaneSectionData['flights'] = [];
                
                flightRows.forEach((r) => {
                  const c = r.querySelectorAll('td');
                  const sIdx = c[0]?.querySelector('button') ? 1 : 0;
                  if (c.length >= (5 + (c[0]?.querySelector('button') ? 1 : 0))) {
                    const d = c[sIdx]?.textContent?.trim() || '';
                    const fa = c[sIdx + 1]?.textContent?.trim() || '';
                    const ta = c[sIdx + 2]?.textContent?.trim() || '';
                    const tt = c[sIdx + 3]?.textContent?.trim() || '';
                    const l = c[sIdx + 4]?.textContent?.trim() || '';
                    
                    const am = tt.match(/البالغين:(\d+)|Adults:(\d+)/);
                    const cm = tt.match(/الاطفال:(\d+)|Children:(\d+)/);
                    const im = tt.match(/رضيع:(\d+)|Infants:(\d+)/);
                    
                    allFlights.push({
                      date: d,
                      fromAirport: fa,
                      toAirport: ta,
                      travelers: {
                        adults: parseInt(am?.[1] || am?.[2] || '0', 10),
                        children: parseInt(cm?.[1] || cm?.[2] || '0', 10),
                        infants: parseInt(im?.[1] || im?.[2] || '0', 10),
                      },
                      luggage: l,
                    });
                  }
                });
                
                // Add new empty flight
                allFlights.push({
                  date: '',
                  fromAirport: '',
                  toAirport: '',
                  travelers: { adults: 0, children: 0, infants: 0 },
                  luggage: '',
                });
                
                const titleEl = sectionEl.querySelector('h2');
                const title = titleEl?.textContent?.trim() || 'حجز الطيران';
                const noticeEl = sectionEl.querySelector('p.text-\\[\\#DC143C\\]');
                const noticeMessage = noticeEl?.textContent?.trim() || '';
                
                setAirplaneSectionInitialData({
                  title,
                  flights: allFlights,
                  noticeMessage,
                  showTitle: true,
                  showNotice: !!noticeMessage,
                });
                const sectionId = sectionEl.getAttribute('data-airplane-section-id');
                setEditingAirplaneSectionId(sectionId || null);
                setAirplaneModalOpen(true);
              });
            }
            
            sectionEl.addEventListener('mouseleave', function(e) {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget && (relatedTarget === editButton || relatedTarget.closest('.airplane-section-edit-btn'))) {
                return;
              }
              this.style.outline = '';
              if (editButton) {
                editButton.style.opacity = '0';
              }
            });
            
            airplaneSectionIndex++;
          }
        });

        // Find and setup HotelsSection components
        const hotelsSections = container.querySelectorAll('[dir="rtl"]');
        let hotelsSectionIndex = 0;
        hotelsSections.forEach((section) => {
          // Check if this is a HotelsSection by looking for hotel cards
          const hasHotelCards = section.querySelector('.border-2.border-blue-300.rounded-2xl');
          const hasHotelIcon = section.querySelector('svg path[d*="3.705"]'); // Hotel icon path
          
          if (hasHotelCards && hasHotelIcon && !section.hasAttribute('data-airplane-section-setup')) {
            const sectionEl = section as HTMLElement;
            sectionEl.setAttribute('data-hotels-section-index', hotelsSectionIndex.toString());
            sectionEl.setAttribute('data-hotels-section-setup', 'true');
            sectionEl.style.position = 'relative';
            sectionEl.style.cursor = 'pointer';
            
            let editButton: HTMLButtonElement | null = null;
            let deleteButton: HTMLButtonElement | null = null;
            
            sectionEl.addEventListener('mouseenter', function() {
              this.style.outline = '2px dashed #3B5998';
              this.style.outlineOffset = '2px';
              
              if (!editButton) {
                editButton = document.createElement('button');
                editButton.className = 'hotels-section-edit-btn';
                editButton.style.cssText = 'position: absolute; right: 8px; top: 8px; width: 36px; height: 36px; background: #3B5998; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                editButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                editButton.title = 'تعديل قسم الفنادق';
                
                // Create delete button
                deleteButton = document.createElement('button');
                deleteButton.className = 'hotels-section-delete-btn';
                deleteButton.style.cssText = 'position: absolute; left: 8px; top: 8px; width: 36px; height: 36px; background: #ef4444; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 20; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: 2px solid white;';
                deleteButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                deleteButton.title = 'حذف قسم الفنادق';
                
                deleteButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const sectionId = sectionEl.getAttribute('data-hotels-section-id');
                  if (!sectionId) {
                    // Fallback: try to find ID from code
                    const idx = parseInt(sectionEl.getAttribute('data-hotels-section-index') || '0', 10);
                    const hotelsSectionRegex = /<HotelsSection\s+[^>]*\/>/g;
                    const hotelsMatches = Array.from(codeRef.current.matchAll(hotelsSectionRegex));
                    if (hotelsMatches[idx]) {
                      const idMatch = hotelsMatches[idx][0].match(/id\s*=\s*["']([^"']+)["']/);
                      if (idMatch) {
                        const confirmed = window.confirm('هل أنت متأكد من حذف قسم الفنادق؟ لا يمكن التراجع عن هذا الإجراء.');
                        if (confirmed) {
                          const newCode = deleteHotelsSection(codeRef.current, idMatch[1]);
                          setCode(newCode);
                        }
                        return;
                      }
                    }
                    console.error('Could not find HotelsSection ID');
                    return;
                  }
                  const confirmed = window.confirm('هل أنت متأكد من حذف قسم الفنادق؟ لا يمكن التراجع عن هذا الإجراء.');
                  if (confirmed) {
                    const currentCode = codeRef.current;
                    const newCode = deleteHotelsSection(currentCode, sectionId);
                    setCode(newCode);
                  }
                });
                
                deleteButton.addEventListener('mouseenter', function() {
                  this.style.background = '#dc2626';
                  this.style.transform = 'scale(1.1)';
                });
                
                deleteButton.addEventListener('mouseleave', function() {
                  this.style.background = '#ef4444';
                  this.style.transform = 'scale(1)';
                });
                
                sectionEl.appendChild(deleteButton);
                
                editButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const idx = parseInt(sectionEl.getAttribute('data-hotels-section-index') || '0', 10);
                  
                  // Extract current data from the rendered component
                  const titleEl = sectionEl.querySelector('h2');
                  const title = titleEl?.textContent?.trim() || 'حجز الفنادق';
                  
                  // Extract hotels from cards
                  const hotelCards = sectionEl.querySelectorAll('.border-2.border-blue-300.rounded-2xl');
                  const hotels: HotelsSectionData['hotels'] = [];
                  
                  hotelCards.forEach((card) => {
                    const cityEl = card.querySelector('.bg-\\[\\#1E88E5\\] span:last-child');
                    const city = cityEl?.textContent?.trim() || '';
                    
                    const nightsEl = card.querySelector('.bg-white.text-\\[\\#1E88E5\\]');
                    const nightsText = nightsEl?.textContent?.trim() || '';
                    const nights = parseInt(nightsText.match(/\d+/)?.[0] || '0', 10);
                    
                    const cityBadgeEl = card.querySelector('.bg-\\[\\#FF6B35\\]');
                    const cityBadge = cityBadgeEl?.textContent?.trim();
                    
                    const hotelNameEl = card.querySelector('.bg-\\[\\#1E88E5\\] span.font-bold');
                    const hotelName = hotelNameEl?.textContent?.trim() || '';
                    
                    const hasDetailsLink = !!card.querySelector('.bg-white.rounded-full.p-1\\.5');
                    
                    const roomDivs = card.querySelectorAll('.bg-\\[\\#1E88E5\\].text-white.px-4');
                    const includesAll = roomDivs[0]?.textContent?.trim() || '';
                    const roomType = roomDivs[1]?.textContent?.trim();
                    const bedType = roomDivs[2]?.textContent?.trim() || '';
                    
                    const dateSection = card.querySelector('.bg-\\[\\#FF6B35\\]');
                    const dateText = dateSection?.textContent || '';
                    const checkInMatch = dateText.match(/تاريخ الدخول\s+(\d{4}-\d{2}-\d{2})/);
                    const checkOutMatch = dateText.match(/تاريخ الخروج\s+(\d{4}-\d{2}-\d{2})/);
                    const checkInDate = checkInMatch?.[1] || '';
                    const checkOutDate = checkOutMatch?.[1] || '';
                    
                    const dayInfoEl = card.querySelector('.absolute.top-6.right-4');
                    const dayInfoText = dayInfoEl?.textContent || '';
                    const checkInDayMatch = dayInfoText.match(/^(.+)$/m);
                    const checkOutDayMatch = dayInfoText.match(/\n(.+)$/m);
                    const checkInDay = checkInDayMatch?.[1]?.trim() || '';
                    const checkOutDay = checkOutDayMatch?.[1]?.trim() || '';
                    
                    hotels.push({
                      city,
                      nights,
                      cityBadge,
                      hotelName,
                      hasDetailsLink,
                      roomDescription: {
                        includesAll,
                        bedType,
                        roomType,
                      },
                      checkInDate,
                      checkOutDate,
                      dayInfo: {
                        checkInDay,
                        checkOutDay,
                      },
                    });
                  });
                  
                  setHotelsSectionInitialData({
                    title,
                    hotels,
                    showTitle: true,
                  });
                  const sectionId = sectionEl.getAttribute('data-hotels-section-id');
                  setEditingHotelsSectionId(sectionId || null);
                  setHotelsModalOpen(true);
                });
                
                sectionEl.appendChild(editButton);
              }
              if (editButton) {
                editButton.style.opacity = '1';
              }
            });
            
            // Add edit/remove buttons to each hotel card if they don't exist
            const hotelCards = sectionEl.querySelectorAll('.border-2.border-blue-300.rounded-2xl');
            hotelCards.forEach((card, hotelIdx) => {
              let editBtn = card.querySelector('button.bg-blue-500') as HTMLButtonElement;
              let removeBtn = card.querySelector('button.bg-red-500') as HTMLButtonElement;
              
              // Add buttons if they don't exist
              if (!editBtn || !removeBtn) {
                const cardEl = card as HTMLElement;
                cardEl.style.position = 'relative';
                
                if (!editBtn) {
                  editBtn = document.createElement('button');
                  editBtn.className = 'p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md absolute top-2 left-2 z-10';
                  editBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>';
                  editBtn.title = 'تعديل';
                  cardEl.appendChild(editBtn);
                }
                
                if (!removeBtn) {
                  removeBtn = document.createElement('button');
                  removeBtn.className = 'p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md absolute top-2 left-14 z-10';
                  removeBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
                  removeBtn.title = 'حذف';
                  removeBtn.style.display = hotelCards.length > 1 ? 'block' : 'none';
                  cardEl.appendChild(removeBtn);
                }
              }
              
              if (editBtn && !editBtn.hasAttribute('data-hotel-edit-handler')) {
                editBtn.setAttribute('data-hotel-edit-handler', 'true');
                editBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Extract hotel data from this card (same logic as above)
                  const cityEl = card.querySelector('.bg-\\[\\#1E88E5\\] span:last-child');
                  const city = cityEl?.textContent?.trim() || '';
                  
                  const nightsEl = card.querySelector('.bg-white.text-\\[\\#1E88E5\\]');
                  const nightsText = nightsEl?.textContent?.trim() || '';
                  const nights = parseInt(nightsText.match(/\d+/)?.[0] || '0', 10);
                  
                  const cityBadgeEl = card.querySelector('.bg-\\[\\#FF6B35\\]');
                  const cityBadge = cityBadgeEl?.textContent?.trim();
                  
                  const hotelNameEl = card.querySelector('.bg-\\[\\#1E88E5\\] span.font-bold');
                  const hotelName = hotelNameEl?.textContent?.trim() || '';
                  
                  const hasDetailsLink = !!card.querySelector('.bg-white.rounded-full.p-1\\.5');
                  
                  const roomDivs = card.querySelectorAll('.bg-\\[\\#1E88E5\\].text-white.px-4');
                  const includesAll = roomDivs[0]?.textContent?.trim() || '';
                  const roomType = roomDivs[1]?.textContent?.trim();
                  const bedType = roomDivs[2]?.textContent?.trim() || '';
                  
                  const dateSection = card.querySelector('.bg-\\[\\#FF6B35\\]');
                  const dateText = dateSection?.textContent || '';
                  const checkInMatch = dateText.match(/تاريخ الدخول\s+(\d{4}-\d{2}-\d{2})/);
                  const checkOutMatch = dateText.match(/تاريخ الخروج\s+(\d{4}-\d{2}-\d{2})/);
                  const checkInDate = checkInMatch?.[1] || '';
                  const checkOutDate = checkOutMatch?.[1] || '';
                  
                  const dayInfoEl = card.querySelector('.absolute.top-6.right-4');
                  const dayInfoText = dayInfoEl?.textContent || '';
                  const checkInDayMatch = dayInfoText.match(/^(.+)$/m);
                  const checkOutDayMatch = dayInfoText.match(/\n(.+)$/m);
                  const checkInDay = checkInDayMatch?.[1]?.trim() || '';
                  const checkOutDay = checkOutDayMatch?.[1]?.trim() || '';
                  
                  // Extract all hotels and update the one being edited
                  const allHotels: HotelsSectionData['hotels'] = [];
                  hotelCards.forEach((c, i) => {
                    const cityE = c.querySelector('.bg-\\[\\#1E88E5\\] span:last-child');
                    const cityV = cityE?.textContent?.trim() || '';
                    
                    const nightsE = c.querySelector('.bg-white.text-\\[\\#1E88E5\\]');
                    const nightsTextV = nightsE?.textContent?.trim() || '';
                    const nightsV = parseInt(nightsTextV.match(/\d+/)?.[0] || '0', 10);
                    
                    const cityBadgeE = c.querySelector('.bg-\\[\\#FF6B35\\]');
                    const cityBadgeV = cityBadgeE?.textContent?.trim();
                    
                    const hotelNameE = c.querySelector('.bg-\\[\\#1E88E5\\] span.font-bold');
                    const hotelNameV = hotelNameE?.textContent?.trim() || '';
                    
                    const hasDetailsLinkV = !!c.querySelector('.bg-white.rounded-full.p-1\\.5');
                    
                    const roomDivsV = c.querySelectorAll('.bg-\\[\\#1E88E5\\].text-white.px-4');
                    const includesAllV = roomDivsV[0]?.textContent?.trim() || '';
                    const roomTypeV = roomDivsV[1]?.textContent?.trim();
                    const bedTypeV = roomDivsV[2]?.textContent?.trim() || '';
                    
                    const dateSectionV = c.querySelector('.bg-\\[\\#FF6B35\\]');
                    const dateTextV = dateSectionV?.textContent || '';
                    const checkInMatchV = dateTextV.match(/تاريخ الدخول\s+(\d{4}-\d{2}-\d{2})/);
                    const checkOutMatchV = dateTextV.match(/تاريخ الخروج\s+(\d{4}-\d{2}-\d{2})/);
                    const checkInDateV = checkInMatchV?.[1] || '';
                    const checkOutDateV = checkOutMatchV?.[1] || '';
                    
                    const dayInfoElV = c.querySelector('.absolute.top-6.right-4');
                    const dayInfoTextV = dayInfoElV?.textContent || '';
                    const checkInDayMatchV = dayInfoTextV.match(/^(.+)$/m);
                    const checkOutDayMatchV = dayInfoTextV.match(/\n(.+)$/m);
                    const checkInDayV = checkInDayMatchV?.[1]?.trim() || '';
                    const checkOutDayV = checkOutDayMatchV?.[1]?.trim() || '';
                    
                    allHotels.push({
                      city: cityV,
                      nights: nightsV,
                      cityBadge: cityBadgeV,
                      hotelName: hotelNameV,
                      hasDetailsLink: hasDetailsLinkV,
                      roomDescription: {
                        includesAll: includesAllV,
                        bedType: bedTypeV,
                        roomType: roomTypeV,
                      },
                      checkInDate: checkInDateV,
                      checkOutDate: checkOutDateV,
                      dayInfo: {
                        checkInDay: checkInDayV,
                        checkOutDay: checkOutDayV,
                      },
                    });
                  });
                  
                  // Replace the hotel at hotelIdx
                  allHotels[hotelIdx] = {
                    city,
                    nights,
                    cityBadge,
                    hotelName,
                    hasDetailsLink,
                    roomDescription: {
                      includesAll,
                      bedType,
                      roomType,
                    },
                    checkInDate,
                    checkOutDate,
                    dayInfo: {
                      checkInDay,
                      checkOutDay,
                    },
                  };
                  
                  const titleEl = sectionEl.querySelector('h2');
                  const title = titleEl?.textContent?.trim() || 'حجز الفنادق';
                  
                  setHotelsSectionInitialData({
                    title,
                    hotels: allHotels,
                    showTitle: true,
                  });
                  setEditingHotelsSectionIndex(idx);
                  setHotelsModalOpen(true);
                });
              }
              
              if (removeBtn && !removeBtn.hasAttribute('data-hotel-remove-handler')) {
                removeBtn.setAttribute('data-hotel-remove-handler', 'true');
                removeBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Extract all hotels except the one being removed
                  const allHotels: HotelsSectionData['hotels'] = [];
                  hotelCards.forEach((c, i) => {
                    if (i === hotelIdx) return;
                    
                    const cityE = c.querySelector('.bg-\\[\\#1E88E5\\] span:last-child');
                    const cityV = cityE?.textContent?.trim() || '';
                    
                    const nightsE = c.querySelector('.bg-white.text-\\[\\#1E88E5\\]');
                    const nightsTextV = nightsE?.textContent?.trim() || '';
                    const nightsV = parseInt(nightsTextV.match(/\d+/)?.[0] || '0', 10);
                    
                    const cityBadgeE = c.querySelector('.bg-\\[\\#FF6B35\\]');
                    const cityBadgeV = cityBadgeE?.textContent?.trim();
                    
                    const hotelNameE = c.querySelector('.bg-\\[\\#1E88E5\\] span.font-bold');
                    const hotelNameV = hotelNameE?.textContent?.trim() || '';
                    
                    const hasDetailsLinkV = !!c.querySelector('.bg-white.rounded-full.p-1\\.5');
                    
                    const roomDivsV = c.querySelectorAll('.bg-\\[\\#1E88E5\\].text-white.px-4');
                    const includesAllV = roomDivsV[0]?.textContent?.trim() || '';
                    const roomTypeV = roomDivsV[1]?.textContent?.trim();
                    const bedTypeV = roomDivsV[2]?.textContent?.trim() || '';
                    
                    const dateSectionV = c.querySelector('.bg-\\[\\#FF6B35\\]');
                    const dateTextV = dateSectionV?.textContent || '';
                    const checkInMatchV = dateTextV.match(/تاريخ الدخول\s+(\d{4}-\d{2}-\d{2})/);
                    const checkOutMatchV = dateTextV.match(/تاريخ الخروج\s+(\d{4}-\d{2}-\d{2})/);
                    const checkInDateV = checkInMatchV?.[1] || '';
                    const checkOutDateV = checkOutMatchV?.[1] || '';
                    
                    const dayInfoElV = c.querySelector('.absolute.top-6.right-4');
                    const dayInfoTextV = dayInfoElV?.textContent || '';
                    const checkInDayMatchV = dayInfoTextV.match(/^(.+)$/m);
                    const checkOutDayMatchV = dayInfoTextV.match(/\n(.+)$/m);
                    const checkInDayV = checkInDayMatchV?.[1]?.trim() || '';
                    const checkOutDayV = checkOutDayMatchV?.[1]?.trim() || '';
                    
                    allHotels.push({
                      city: cityV,
                      nights: nightsV,
                      cityBadge: cityBadgeV,
                      hotelName: hotelNameV,
                      hasDetailsLink: hasDetailsLinkV,
                      roomDescription: {
                        includesAll: includesAllV,
                        bedType: bedTypeV,
                        roomType: roomTypeV,
                      },
                      checkInDate: checkInDateV,
                      checkOutDate: checkOutDateV,
                      dayInfo: {
                        checkInDay: checkInDayV,
                        checkOutDay: checkOutDayV,
                      },
                    });
                  });
                  
                  if (allHotels.length > 0) {
                    const updatedCode = updateHotelsSectionHotels(codeRef.current, idx, allHotels);
                    setCode(updatedCode);
                  } else {
                    // Can't remove last hotel - show message or prevent
                    alert('يجب أن يكون هناك فندق واحد على الأقل');
                  }
                });
              }
            });
            
            // Add "Add Hotel" button if it doesn't exist
            const hotelsContainer = sectionEl.querySelector('.space-y-4');
            let addHotelBtn = sectionEl.querySelector('button.bg-green-500') as HTMLButtonElement;
            
            if (!addHotelBtn && hotelsContainer) {
              const addCard = document.createElement('div');
              addCard.className = 'border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50 text-center';
              
              addHotelBtn = document.createElement('button');
              addHotelBtn.className = 'px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2 mx-auto';
              addHotelBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>إضافة فندق جديد';
              
              addCard.appendChild(addHotelBtn);
              hotelsContainer.appendChild(addCard);
            }
            
            if (addHotelBtn && !addHotelBtn.hasAttribute('data-add-hotel-handler')) {
              addHotelBtn.setAttribute('data-add-hotel-handler', 'true');
              addHotelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Extract current hotels and add a new empty one
                const hotelCards = sectionEl.querySelectorAll('.border-2.border-blue-300.rounded-2xl');
                const allHotels: HotelsSectionData['hotels'] = [];
                
                hotelCards.forEach((c) => {
                  const cityE = c.querySelector('.bg-\\[\\#1E88E5\\] span:last-child');
                  const cityV = cityE?.textContent?.trim() || '';
                  
                  const nightsE = c.querySelector('.bg-white.text-\\[\\#1E88E5\\]');
                  const nightsTextV = nightsE?.textContent?.trim() || '';
                  const nightsV = parseInt(nightsTextV.match(/\d+/)?.[0] || '0', 10);
                  
                  const cityBadgeE = c.querySelector('.bg-\\[\\#FF6B35\\]');
                  const cityBadgeV = cityBadgeE?.textContent?.trim();
                  
                  const hotelNameE = c.querySelector('.bg-\\[\\#1E88E5\\] span.font-bold');
                  const hotelNameV = hotelNameE?.textContent?.trim() || '';
                  
                  const hasDetailsLinkV = !!c.querySelector('.bg-white.rounded-full.p-1\\.5');
                  
                  const roomDivsV = c.querySelectorAll('.bg-\\[\\#1E88E5\\].text-white.px-4');
                  const includesAllV = roomDivsV[0]?.textContent?.trim() || '';
                  const roomTypeV = roomDivsV[1]?.textContent?.trim();
                  const bedTypeV = roomDivsV[2]?.textContent?.trim() || '';
                  
                  const dateSectionV = c.querySelector('.bg-\\[\\#FF6B35\\]');
                  const dateTextV = dateSectionV?.textContent || '';
                  const checkInMatchV = dateTextV.match(/تاريخ الدخول\s+(\d{4}-\d{2}-\d{2})/);
                  const checkOutMatchV = dateTextV.match(/تاريخ الخروج\s+(\d{4}-\d{2}-\d{2})/);
                  const checkInDateV = checkInMatchV?.[1] || '';
                  const checkOutDateV = checkOutMatchV?.[1] || '';
                  
                  const dayInfoElV = c.querySelector('.absolute.top-6.right-4');
                  const dayInfoTextV = dayInfoElV?.textContent || '';
                  const checkInDayMatchV = dayInfoTextV.match(/^(.+)$/m);
                  const checkOutDayMatchV = dayInfoTextV.match(/\n(.+)$/m);
                  const checkInDayV = checkInDayMatchV?.[1]?.trim() || '';
                  const checkOutDayV = checkOutDayMatchV?.[1]?.trim() || '';
                  
                  allHotels.push({
                    city: cityV,
                    nights: nightsV,
                    cityBadge: cityBadgeV,
                    hotelName: hotelNameV,
                    hasDetailsLink: hasDetailsLinkV,
                    roomDescription: {
                      includesAll: includesAllV,
                      bedType: bedTypeV,
                      roomType: roomTypeV,
                    },
                    checkInDate: checkInDateV,
                    checkOutDate: checkOutDateV,
                    dayInfo: {
                      checkInDay: checkInDayV,
                      checkOutDay: checkOutDayV,
                    },
                  });
                });
                
                // Add new empty hotel
                allHotels.push({
                  city: '',
                  nights: 0,
                  cityBadge: '',
                  hotelName: '',
                  hasDetailsLink: false,
                  roomDescription: {
                    includesAll: '',
                    bedType: '',
                    roomType: '',
                  },
                  checkInDate: '',
                  checkOutDate: '',
                  dayInfo: {
                    checkInDay: '',
                    checkOutDay: '',
                  },
                });
                
                const titleEl = sectionEl.querySelector('h2');
                const title = titleEl?.textContent?.trim() || 'حجز الفنادق';
                
                setHotelsSectionInitialData({
                  title,
                  hotels: allHotels,
                  showTitle: true,
                });
                setEditingHotelsSectionIndex(idx);
                setHotelsModalOpen(true);
              });
            }
            
            sectionEl.addEventListener('mouseleave', function(e) {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (relatedTarget && (relatedTarget === editButton || relatedTarget.closest('.hotels-section-edit-btn'))) {
                return;
              }
              this.style.outline = '';
              if (editButton) {
                editButton.style.opacity = '0';
              }
            });
            
            hotelsSectionIndex++;
          }
        });
      });
    }, 300); // Increased timeout to ensure content is rendered
    
    return () => {
      clearTimeout(timeout);
      // Clean up add buttons and edit buttons on unmount
      const container = previewContainerRef.current;
      if (container) {
        const existingButtons = container.querySelectorAll('.section-add-btn, .section-edit-btn, .section-delete-btn, .table-edit-btn, .airplane-section-edit-btn, .hotels-section-edit-btn');
        existingButtons.forEach(btn => btn.remove());
      }
    };
  }, [mode, code, values]);
  
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;
  }, []);

  const handleAirplaneSectionSubmit = useCallback((data: AirplaneSectionData) => {
    let updatedCode: string;
    if (editingAirplaneSectionId) {
      // Update existing section - update all props (title, noticeMessage, flights, etc.)
      updatedCode = updateAirplaneSection(code, editingAirplaneSectionId, {
        title: data.title,
        flights: data.flights,
        noticeMessage: data.noticeMessage,
        showTitle: data.showTitle,
        showNotice: data.showNotice,
      });
      setEditingAirplaneSectionId(null);
      setAirplaneSectionInitialData(undefined);
    } else {
      // Insert new section
      updatedCode = insertAirplaneSection(code, data);
    }
    handleCodeChange(updatedCode);
    setAirplaneModalOpen(false);
  }, [code, handleCodeChange, editingAirplaneSectionId]);

  const handleHotelsSectionSubmit = useCallback((data: HotelsSectionData) => {
    let updatedCode: string;
    if (editingHotelsSectionId) {
      // Update existing section - update all props (title, hotels, etc.)
      updatedCode = updateHotelsSection(code, editingHotelsSectionId, {
        title: data.title,
        hotels: data.hotels,
        showTitle: data.showTitle,
      });
      setEditingHotelsSectionId(null);
      setHotelsSectionInitialData(undefined);
    } else {
      // Insert new section
      updatedCode = insertHotelsSection(code, data);
    }
    handleCodeChange(updatedCode);
    setHotelsModalOpen(false);
  }, [code, handleCodeChange, editingHotelsSectionId]);

  const handleCreateTable = useCallback((config: {
    title: string;
    columns: string[];
    rowCount: number;
  }) => {
    const newCode = addNewTable(codeRef.current, config);
    setCode(newCode);
    setShowTableCreatedToast(true);
    setTimeout(() => setShowTableCreatedToast(false), 3000);
  }, []);

  const handleExportCode = useCallback(() => {
    // Replace all default values in the code with current values
    let updatedCode = code;
    
    Object.entries(values).forEach(([key, value]) => {
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Find and replace the default value with the new value
      const regex = new RegExp(
        `value={values\\['${escapedKey}'\\]\\s*\\|\\|\\s*['"]([^'"]*?)['"]`,
        'g'
      );
      updatedCode = updatedCode.replace(regex, `value={values['${key}'] || '${value.replace(/'/g, "\\'")}'`);
    });

    // Create blob and download
    const blob = new Blob([updatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${new Date().toISOString().split('T')[0]}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, values]);

  const handleExportPDF = useCallback(async () => {
    // Use html2pdf.js for programmatic download (NO browser print dialog)
    const previewElement = document.querySelector('.preview-content') as HTMLElement;
    
    if (!previewElement) {
      alert('Preview content not found');
      return;
    }

    try {
      // Import the export function
      const { exportToPDF } = await import('@/app/utils/pdfExport');
      
      await exportToPDF(previewElement, 'document', {
        format: 'a4',
        orientation: 'portrait',
        margin: 10,
        image: {
          type: 'png',
          quality: 0.98,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
      });
    } catch (error) {
      console.error('PDF export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export PDF');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated()) {
      alert("Please login to save documents");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Extract table data from the rendered DOM to capture user edits
      let updatedCode = code;
      let updatedExtractedData = null;
      
      try {
        // Extract tables from the preview container
        const extractedTables = extractAllTablesFromDOM(previewContainerRef.current);
        if (extractedTables.length > 0) {
          // Update JSX code with extracted table data using updateTableCell function
          updatedCode = updateCodeWithTableData(code, extractedTables, updateTableCell, updateTableColumnHeader);
          
          // Also update extracted_data structure if it exists
          const extractedDataStr = sessionStorage.getItem("codePreview.extractedData");
          if (extractedDataStr) {
            try {
              updatedExtractedData = JSON.parse(extractedDataStr);
              
              // Update tables in extracted_data
              if (updatedExtractedData.tables && Array.isArray(updatedExtractedData.tables)) {
                extractedTables.forEach((extractedTable, index) => {
                  if (index < updatedExtractedData.tables.length) {
                    // Update headers and rows
                    updatedExtractedData.tables[index].columns = extractedTable.headers;
                    updatedExtractedData.tables[index].rows = extractedTable.rows;
                    if (extractedTable.title) {
                      updatedExtractedData.tables[index].title = extractedTable.title;
                    }
                  }
                });
              }
            } catch (parseError) {
              console.error("Error parsing extracted data:", parseError);
            }
          }
          
          // Update code state if it changed
          if (updatedCode !== code) {
            setCode(updatedCode);
          }
        }
      } catch (extractError) {
        console.error("Error extracting table data:", extractError);
        // Continue with save even if extraction fails
      }
      
      const extractedData = sessionStorage.getItem("codePreview.extractedData");
      const filePath = sessionStorage.getItem("codePreview.filePath");
      const originalFilename = sessionStorage.getItem("codePreview.originalFilename");

      if (documentId) {
        // Update existing document
        await updateDocument(documentId, {
          jsx_code: updatedCode,
          extracted_data: updatedExtractedData || (extractedData ? JSON.parse(extractedData) : {}),
          metadata: {
            ...sourceMetadata,
            lastSaved: new Date().toISOString(),
          },
        });
      } else {
        // Create new document
        const title = sourceMetadata?.filename?.replace(/\.pdf$/i, "") || "Untitled Document";
        const response = await saveDocument({
          title,
          original_filename: originalFilename || "document.pdf",
          file_path: filePath || "",
          extracted_data: updatedExtractedData || (extractedData ? JSON.parse(extractedData) : {}),
          jsx_code: updatedCode,
          metadata: {
            ...sourceMetadata,
            savedAt: new Date().toISOString(),
          },
        });
        
        if (response.document?.id) {
          setDocumentId(response.document.id);
        }
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [code, documentId, sourceMetadata]);

  const header = useMemo(() => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image
              src="/logoHappylife.jpg"
              alt="HappyLife Travel & Tourism"
              width={140}
              height={47}
              className="object-contain"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="text-center px-4">
              <h1 className="text-lg font-bold text-gray-900">Template Editor</h1>
              <p className="text-xs text-gray-600">Design & Export Professional Documents</p>
              {sourceMetadata?.filename && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">{sourceMetadata.filename}</span>
                  {sourceMetadata.uploadedAt && (
                    <span className="text-gray-400">
                      {" • "}
                      {new Date(sourceMetadata.uploadedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAirplaneModalOpen(true)}
              className="px-3 py-2 bg-[#4A5568] text-white rounded-lg font-medium hover:bg-[#2D3748] transition-colors shadow-md text-xs flex items-center gap-2"
              title="إضافة قسم الطيران"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
                />
              </svg>
              <span className="hidden sm:inline">إضافة قسم الطيران</span>
            </button>
            <button
              onClick={() => setHotelsModalOpen(true)}
              className="px-3 py-2 bg-[#3B5998] text-white rounded-lg font-medium hover:bg-[#2E4A7A] transition-colors shadow-md text-xs flex items-center gap-2"
              title="إضافة قسم الفنادق"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z"
                />
                <path
                  fillRule="evenodd"
                  d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">إضافة قسم الفنادق</span>
            </button>
            {isAuthenticated() && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm ${
                  saveStatus === "success"
                    ? "bg-green-500 text-white"
                    : saveStatus === "error"
                    ? "bg-red-500 text-white"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : saveStatus === "success" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : saveStatus === "error" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Failed
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleExportCode}
              className="px-4 py-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Export Code
            </button>
            <button
              onClick={handleExportPDF}
              className="export-pdf-btn px-4 py-2 bg-linear-to-r from-[#A4C639] to-[#8FB02E] text-white rounded-lg font-medium hover:from-[#8FB02E] hover:to-[#7A9124] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <ToggleSwitch mode={mode} onChange={(next: Mode) => setMode(next)} />
          </div>
        </div>
      </div>
    </div>
  ), [mode, handleExportCode, handleExportPDF, handleSave, sourceMetadata, isSaving, saveStatus]);

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-lime-50 text-gray-900">
      {header}
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {externalWarnings.length > 0 && (
          <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <h2 className="text-sm font-semibold text-yellow-900">
              Backend Validation Warnings
            </h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {externalWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        {processedTables.length > 0 && (
          <div className="mb-6 rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            <h2 className="text-sm font-semibold text-green-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Processed Tables ({processedTables.length})
            </h2>
            <p className="mt-2 text-green-700">
              {processedTables.length} table(s) were automatically extracted, repaired, and converted to JSX during processing.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-green-800 font-medium hover:text-green-900">
                View processed table details
              </summary>
              <div className="mt-2 space-y-2">
                {processedTables.map((table, index) => (
                  <div key={index} className="bg-white rounded p-3 border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-900">{table.tableId}</span>
                      <span className="text-xs text-green-600">
                        {table.jsx.length} chars JSX
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        {mode === "code" ? (
          <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
            <div className="bg-linear-to-r from-gray-800 to-gray-900 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4 text-sm text-gray-300 font-mono">template.jsx</span>
              </div>
              <span className="text-xs text-gray-400">React Template</span>
            </div>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        ) : (
          <div className="min-h-[70vh] bg-white rounded-xl shadow-lg p-8 max-w-full overflow-hidden relative">
            {/* Create New Table Button */}
            <button
              onClick={() => setIsCreateTableModalOpen(true)}
              className="absolute top-4 right-4 z-10 px-4 py-2 bg-gradient-to-r from-[#A4C639] to-[#8FB02E] text-white rounded-lg font-medium hover:from-[#8FB02E] hover:to-[#7A9124] transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
              title="Create a new table"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Table
            </button>

            {/* Success Toast */}
            {showTableCreatedToast && (
              <div className="fixed top-24 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Table created successfully!
              </div>
            )}

            <div 
              ref={previewContainerRef}
              className="preview-content max-w-full"
            >
              <PreviewRenderer code={code} values={values} setValue={setValue} />
            </div>
          </div>
        )}
      </div>
      
      {/* Customization Panel */}
      {panelContext && (
        <CustomizationPanel
          code={code}
          onCodeChange={handleCodeChange}
          context={panelContext}
          onClose={() => setPanelContext(null)}
        />
      )}

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateTableModalOpen}
        onClose={() => setIsCreateTableModalOpen(false)}
        onCreateTable={handleCreateTable}
      />

      {/* Airplane Section Modal */}
      <AirplaneSectionModal
        isOpen={airplaneModalOpen}
        onClose={() => {
          setAirplaneModalOpen(false);
          setEditingAirplaneSectionId(null);
          setAirplaneSectionInitialData(undefined);
        }}
        onSubmit={handleAirplaneSectionSubmit}
        initialData={airplaneSectionInitialData}
      />

      {/* Hotels Section Modal */}
      <HotelsSectionModal
        isOpen={hotelsModalOpen}
        onClose={() => {
          setHotelsModalOpen(false);
          setEditingHotelsSectionId(null);
          setHotelsSectionInitialData(undefined);
        }}
        onSubmit={handleHotelsSectionSubmit}
        initialData={hotelsSectionInitialData}
      />

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function CodePage() {
  return (
    <ProtectedRoute>
      <CodePageContent />
    </ProtectedRoute>
  );
}

