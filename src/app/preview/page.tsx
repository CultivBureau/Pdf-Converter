"use client";

import React, { useState, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PreviewEditor from "./PreviewEditor";
import PdfViewer from "@/app/components/PdfViewer";
import { codeReducer, initialCodeState } from "@/app/Store/codeSlice";
import { structureToJsx } from "@/app/utils/structureToJsx";
import type { Structure } from "@/app/types/ExtractTypes";

/**
 * Preview Page
 * Phase 4 & 5: JSX Code Generation Preview & Export as PDF
 * 
 * Features:
 * - Display generated JSX code from GPT
 * - Syntax highlighting
 * - User can edit code manually
 * - Live preview of final JSX
 * - Export to PDF
 */
export default function PreviewPage() {
  const router = useRouter();
  const [codeState, dispatch] = useReducer(codeReducer, initialCodeState);
  const [structure, setStructure] = useState<Structure | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "pdf">("editor");
  const [values, setValues] = useState<Record<string, string>>({});

  // Load extracted data from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const extractedDataStr = sessionStorage.getItem("extract.data");
      if (extractedDataStr) {
        try {
          const extractedData = JSON.parse(extractedDataStr);
          setStructure({
            sections: extractedData.sections || [],
            tables: extractedData.tables || [],
            meta: extractedData.meta || {},
          });
        } catch (error) {
          console.error("Error parsing extracted data:", error);
        }
      }
    }
  }, []);

  // Generate JSX from structure (static generation)
  const handleGenerateJSX = () => {
    if (!structure) {
      setGenerationError("لا توجد بيانات للتحويل");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const jsxCode = structureToJsx(structure);
      
      if (jsxCode) {
        dispatch({ type: "SET_ORIGINAL_CODE", payload: jsxCode });
        dispatch({
          type: "SET_GENERATION_METADATA",
          payload: {
            generatedAt: new Date(),
            metadata: {
              method: "static",
              sectionsCount: structure.sections?.length || 0,
              tablesCount: structure.tables?.length || 0,
            },
          },
        });
      } else {
        throw new Error("فشل توليد كود JSX");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "فشل توليد JSX";
      setGenerationError(message);
      console.error("JSX generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate JSX if structure exists and no code yet
  useEffect(() => {
    if (structure && !codeState.jsxCode && !isGenerating) {
      handleGenerateJSX();
    }
  }, [structure]);

  const handleCodeChange = (code: string) => {
    dispatch({ type: "UPDATE_CODE", payload: code });
  };

  const handleSave = (code: string) => {
    // Save to sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("preview.code", code);
    }
    console.log("Code saved:", code);
  };

  const handleSetValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
                src="/logoHappylife.jpg"
                alt="HappyLife Travel & Tourism"
                width={150}
                height={50}
                className="object-contain"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">معاينة الكود</p>
                <p className="text-xs text-gray-500">المرحلة 4 & 5: التوليد والتصدير</p>
              </div>
              <Link
                href="/upload"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors shadow-md text-sm"
              >
                رفع ملف جديد
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Mode Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("editor")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "editor"
                  ? "bg-[#A4C639] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              محرر الكود
            </button>
            <button
              onClick={() => setViewMode("pdf")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "pdf"
                  ? "bg-[#A4C639] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              معاينة PDF
            </button>
          </div>

          {/* Generation Status */}
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-[#A4C639] border-t-transparent rounded-full animate-spin"></div>
              <span>جاري توليد JSX...</span>
            </div>
          )}

          {generationError && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              {generationError}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {viewMode === "editor" ? (
            <PreviewEditor
              initialCode={codeState.jsxCode}
              onCodeChange={handleCodeChange}
              onSave={handleSave}
              showToolbar={true}
            />
          ) : (
            <PdfViewer
              code={codeState.jsxCode || ""}
              values={values}
              setValue={handleSetValue}
              filename="document"
              showExportButton={true}
              exportOptions={{
                format: "a4",
                orientation: "portrait",
                margin: 10,
                quality: 0.98,
                scale: 2,
              }}
            />
          )}
        </div>

        {/* Info Section */}
        {codeState.generationMetadata && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">معلومات التوليد</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-700">
              <div>
                <span className="font-medium">النموذج:</span>{" "}
                {codeState.generationMetadata.model || "غير محدد"}
              </div>
              <div>
                <span className="font-medium">الوقت:</span>{" "}
                {codeState.generatedAt?.toLocaleTimeString("ar") || "غير محدد"}
              </div>
              <div>
                <span className="font-medium">المكونات:</span>{" "}
                {codeState.usedComponents.length}
              </div>
              <div>
                <span className="font-medium">الحالة:</span>{" "}
                {codeState.isValid ? "✓ صحيح" : "✗ أخطاء"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

