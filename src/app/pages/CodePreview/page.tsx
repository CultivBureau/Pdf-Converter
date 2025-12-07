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
import CodeEditor from "../../components/CodeEditor";
import PreviewRenderer from "../../components/PreviewRenderer";
import ToggleSwitch from "../../components/ToggleSwitch";
import CustomizationPanel, { PanelContext } from "../../components/CustomizationPanel";
import { getElementInfo } from "../../utils/jsxParser";
import { addSection } from "../../utils/codeManipulator";

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

export default function CodePage() {
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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<string>(code);
  
  // Keep code ref updated
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCode = sessionStorage.getItem("codePreview.initialCode");
    const storedWarnings = sessionStorage.getItem("codePreview.warnings");
    const storedMetadata = sessionStorage.getItem("codePreview.metadata");
    const storedTables = sessionStorage.getItem("codePreview.processedTables");

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
  }, []);

  const setValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  // Add double-click handlers to preview elements
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
      
      // Double click for sections, tables, columns, rows
      if (elementInfo.type === 'section' && elementInfo.sectionIndex !== undefined) {
        setPanelContext({ type: 'section', index: elementInfo.sectionIndex });
      } else if (elementInfo.type === 'table' && elementInfo.tableIndex !== undefined) {
        setPanelContext({ type: 'table', index: elementInfo.tableIndex });
      } else if (elementInfo.type === 'column' && elementInfo.tableIndex !== undefined && elementInfo.columnIndex !== undefined) {
        setPanelContext({ 
          type: 'column', 
          tableIndex: elementInfo.tableIndex, 
          columnIndex: elementInfo.columnIndex 
        });
      } else if (elementInfo.type === 'row' && elementInfo.tableIndex !== undefined && elementInfo.rowIndex !== undefined) {
        setPanelContext({ 
          type: 'row', 
          tableIndex: elementInfo.tableIndex, 
          rowIndex: elementInfo.rowIndex 
        });
      }
    };
    
    container.addEventListener('dblclick', handleDoubleClick);
    
    return () => {
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [mode, code]);
  
  // Add data attributes to rendered elements
  useEffect(() => {
    if (mode !== "preview" && mode !== "split") return;
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    // Wait for content to render
    const timeout = setTimeout(() => {
      // Parse code to get structure
      import('../../utils/jsxParser').then(({ parseJSXCode }) => {
        const parsed = parseJSXCode(code);
        
        // Clean up existing add buttons and setup flags first
        const existingButtons = container.querySelectorAll('.section-add-btn');
        existingButtons.forEach(btn => btn.remove());
        const existingSections = container.querySelectorAll('[data-section-setup]');
        existingSections.forEach(section => {
          (section as HTMLElement).removeAttribute('data-section-setup');
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
              sectionEl.style.marginBottom = '24px'; // Space for add button
              sectionEl.title = 'Double-click to edit section';
              
              let addButton: HTMLButtonElement | null = null;
              
              // Add hover effect and "+" button
              sectionEl.addEventListener('mouseenter', function() {
                this.style.outline = '2px dashed #A4C639';
                this.style.outlineOffset = '2px';
                this.style.transform = 'translateY(-2px)';
                
                // Create and show add button
                if (!addButton) {
                  addButton = document.createElement('button');
                  addButton.className = 'section-add-btn';
                  addButton.style.cssText = 'position: absolute; left: 50%; bottom: -16px; transform: translate(-50%, 0) scale(0.8); width: 32px; height: 32px; background: #A4C639; color: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: all 0.3s ease; cursor: pointer; border: none;';
                  addButton.innerHTML = '<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>';
                  addButton.title = 'Add new section';
                  
                  addButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const sectionIdx = parseInt(sectionEl.getAttribute('data-section-index') || '0', 10);
                    // Use current code from ref (always latest)
                    const currentCode = codeRef.current;
                    const newCode = addSection(currentCode, {
                      title: "New Section",
                      content: "Section content here",
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
                // Don't hide if mouse is moving to the add button
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (relatedTarget && (relatedTarget === addButton || relatedTarget.closest('.section-add-btn'))) {
                  return;
                }
                
                this.style.outline = '';
                this.style.outlineOffset = '';
                this.style.transform = 'translateY(0)';
                
                // Hide add button
                if (addButton) {
                  addButton.style.opacity = '0';
                  addButton.style.transform = 'translate(-50%, 0) scale(0.8)';
                }
              });
              
              // Keep button visible when hovering over it
              if (addButton) {
                addButton.addEventListener('mouseenter', function() {
                  this.style.opacity = '1';
                  this.style.transform = 'translate(-50%, 0) scale(1.1)';
                });
              }
              
              
              sectionIndex++;
            }
          }
        });
        
        // Find all tables (table elements or divs containing tables)
        const tables = container.querySelectorAll('table, [class*="table"]');
        let tableIndex = 0;
        tables.forEach((table) => {
          // Only process if it's actually a table element or contains one
          const actualTable = table.tagName === 'TABLE' ? table : table.querySelector('table');
          if (actualTable && tableIndex < parsed.tables.length) {
            const tableElement = actualTable.closest('div') || actualTable;
            (tableElement as HTMLElement).setAttribute('data-table-index', tableIndex.toString());
            (tableElement as HTMLElement).style.cursor = 'pointer';
            (tableElement as HTMLElement).style.transition = 'all 0.3s ease';
            (tableElement as HTMLElement).style.opacity = '1';
            (tableElement as HTMLElement).title = 'Double-click to customize table';
            // Add hover effect
            const tableEl = tableElement as HTMLElement;
            tableEl.addEventListener('mouseenter', function() {
              this.style.outline = '2px dashed #A4C639';
              this.style.outlineOffset = '2px';
              this.style.transform = 'translateY(-2px)';
            });
            tableEl.addEventListener('mouseleave', function() {
              this.style.outline = '';
              this.style.outlineOffset = '';
              this.style.transform = 'translateY(0)';
            });
            
            // Find table headers (th elements)
            const headers = actualTable.querySelectorAll('thead th, th');
            headers.forEach((th, colIndex) => {
              (th as HTMLElement).setAttribute('data-table-index', tableIndex.toString());
              (th as HTMLElement).setAttribute('data-column-index', colIndex.toString());
              (th as HTMLElement).style.cursor = 'pointer';
              (th as HTMLElement).style.transition = 'all 0.3s ease';
              (th as HTMLElement).title = 'Double-click to customize column';
              // Add hover effect
              const thEl = th as HTMLElement;
              thEl.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(164, 198, 57, 0.2)';
                this.style.transform = 'scale(1.02)';
              });
              thEl.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                this.style.transform = 'scale(1)';
              });
            });
            
            // Find table rows (tr elements in tbody)
            const rows = actualTable.querySelectorAll('tbody tr');
            rows.forEach((tr, rowIndex) => {
              (tr as HTMLElement).setAttribute('data-table-index', tableIndex.toString());
              (tr as HTMLElement).setAttribute('data-row-index', rowIndex.toString());
              (tr as HTMLElement).style.cursor = 'pointer';
              (tr as HTMLElement).style.transition = 'all 0.3s ease';
              (tr as HTMLElement).title = 'Double-click to customize row';
              // Add hover effect
              const trEl = tr as HTMLElement;
              trEl.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'rgba(164, 198, 57, 0.1)';
                this.style.transform = 'translateX(2px)';
              });
              trEl.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                this.style.transform = 'translateX(0)';
              });
            });
            
            tableIndex++;
          }
        });
      });
    }, 300); // Increased timeout to ensure content is rendered
    
    return () => {
      clearTimeout(timeout);
        // Clean up add buttons on unmount
        const container = previewContainerRef.current;
        if (container) {
          const existingButtons = container.querySelectorAll('.section-add-btn');
          existingButtons.forEach(btn => btn.remove());
        }
    };
  }, [mode, code, values]);
  
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
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
  ), [mode, handleExportCode, handleExportPDF, sourceMetadata]);

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
    </div>
  );
}


