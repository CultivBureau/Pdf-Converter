"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import Image from "next/image";
import Link from "next/link";
import CodeEditor from "../../components/CodeEditor";
import PreviewRenderer from "../../components/PreviewRenderer";
import ToggleSwitch from "../../components/ToggleSwitch";

type Mode = "code" | "preview";

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCode = sessionStorage.getItem("codePreview.initialCode");
    const storedWarnings = sessionStorage.getItem("codePreview.warnings");
    const storedMetadata = sessionStorage.getItem("codePreview.metadata");
    const storedTables = sessionStorage.getItem("codePreview.processedTables");

    if (storedCode) {
      setCode(storedCode);
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

  const handleExportPDF = useCallback(() => {
    // Use browser's native print function which handles modern CSS perfectly
    // Add print styles to hide everything except the preview content
    const style = document.createElement('style');
    style.id = 'pdf-export-styles';
    style.textContent = `
      @page {
        margin: 0;
        size: A4;
      }
      
      @media print {
        /* Remove default print margins and headers/footers */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
        }
        
        /* Hide everything except preview content */
        body * {
          visibility: hidden;
        }
        
        .preview-content,
        .preview-content * {
          visibility: visible;
        }
        
        .preview-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Hide editable text controls and interactive elements */
        .preview-content button,
        .preview-content input[type="file"],
        .preview-content input,
        .preview-content textarea {
          display: none !important;
        }
        
        /* Ensure proper page breaks */
        .preview-content > * {
          page-break-inside: avoid;
        }
      }
    `;
    document.head.appendChild(style);

    // Trigger print dialog
    window.print();

    // Clean up after print dialog closes
    setTimeout(() => {
      const styleEl = document.getElementById('pdf-export-styles');
      if (styleEl) {
        styleEl.remove();
      }
    }, 1000);
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
            <ToggleSwitch mode={mode} onChange={setMode} />
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
          <div className="min-h-[70vh] bg-white rounded-xl shadow-lg p-8 max-w-full overflow-hidden">
            <div className="preview-content max-w-full">
              <PreviewRenderer code={code} values={values} setValue={setValue} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


