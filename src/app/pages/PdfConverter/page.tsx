"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  uploadFile, 
  extractContent,
  cleanStructure,
  validateAndFixJsx 
} from "../../services/PdfApi";
import { cleanJSXCode } from "../../utils/parseGptCode";
import type { ExtractResponse } from "../../types/ExtractTypes";
import { isAuthenticated } from "../../services/AuthApi";
import { saveDocument } from "../../services/HistoryApi";
import ProtectedRoute from "../../components/ProtectedRoute";

const PdfConverterContent: React.FC = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose a PDF before submitting.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Uploading file…");

      // Step 1: Upload PDF
      const uploadResponse = await uploadFile(selectedFile);
      if (!uploadResponse.file_path) {
        throw new Error("Upload failed: No file path returned.");
      }

      // Step 2: Extract content (sections, tables, and images)
      setStatus("Extracting content from PDF…");
      const extractResponse: ExtractResponse = await extractContent(uploadResponse.file_path);
      
      // Check if we have content (either new format with elements or legacy format)
      const hasContent = 
        (extractResponse.elements && extractResponse.elements.length > 0) ||
        (extractResponse.sections && extractResponse.sections.length > 0) ||
        (extractResponse.tables && extractResponse.tables.length > 0);
      
      if (!hasContent) {
        throw new Error("Extraction returned no content.");
      }

      // Step 3: Clean structure (optional but recommended)
      setStatus("Cleaning document structure…");
      let cleanedStructure: ExtractResponse = extractResponse;
      try {
        cleanedStructure = await cleanStructure(extractResponse);
        // Check if cleaning actually failed (backend returns original with warning)
        if (cleanedStructure.meta?.cleaning_failed) {
          console.warn("Claude cleaning unavailable, using original structure:", cleanedStructure.meta.cleaning_error);
          // Continue with original structure - this is expected when Claude API has issues
        }
      } catch (cleanError: any) {
        // Network or other errors - continue with original structure
        console.warn("Structure cleaning failed, using original:", cleanError?.message || cleanError);
        // Continue with original structure - this is fine, cleaning is optional
      }

      // Step 4: Generate JSX template from JSON (frontend-side generation)
      setStatus("Generating template from extracted data…");
      
      // Import template generator utility
      const { generateTemplateFromJson } = await import("../../utils/generateTemplateFromJson");
      
      // Generate JSX template from extracted JSON
      let generatedCode = generateTemplateFromJson(cleanedStructure);
      const allWarnings: string[] = ["Template generated in frontend using React components"];
      
      // Step 5: Clean and fix import paths
      setStatus("Cleaning template code…");
      generatedCode = cleanJSXCode(generatedCode);
      
      // Step 6: Basic validation (no backend fix needed - frontend generation is reliable)
      setStatus("Validating template…");
      const validation = await validateAndFixJsx(generatedCode);
      
      if (!validation.isValid) {
        allWarnings.push(...(validation.errors || []));
        allWarnings.push("Template has some validation warnings but should still work.");
      }

      // Store in sessionStorage for CodePreview page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("codePreview.initialCode", generatedCode);
        sessionStorage.setItem(
          "codePreview.warnings",
          JSON.stringify(allWarnings),
        );
        sessionStorage.setItem(
          "codePreview.metadata",
          JSON.stringify({
            filename: uploadResponse.filename || selectedFile.name,
            uploadedAt: new Date().toISOString(),
            elementsCount: cleanedStructure.elements?.length || 0,
            sectionsCount: cleanedStructure.sections?.length || cleanedStructure.meta?.sections_count || 0,
            tablesCount: cleanedStructure.tables?.length || cleanedStructure.meta?.tables_count || 0,
            imagesCount: cleanedStructure.images?.length || cleanedStructure.meta?.images_count || 0,
          }),
        );
        
        // Store extracted data for auto-save
        sessionStorage.setItem(
          "codePreview.extractedData",
          JSON.stringify(cleanedStructure),
        );
        sessionStorage.setItem("codePreview.filePath", uploadResponse.file_path);
        sessionStorage.setItem("codePreview.originalFilename", uploadResponse.original_filename || selectedFile.name);
      }

      // Auto-save to history if user is authenticated
      if (isAuthenticated()) {
        try {
          setStatus("Saving to history…");
          const docTitle = uploadResponse.original_filename?.replace(/\.pdf$/i, "") || selectedFile.name.replace(/\.pdf$/i, "");
          
          const savedDoc = await saveDocument({
            title: docTitle,
            original_filename: uploadResponse.original_filename || selectedFile.name,
            file_path: uploadResponse.file_path,
            extracted_data: cleanedStructure,
            jsx_code: generatedCode,
            metadata: {
              filename: uploadResponse.filename || selectedFile.name,
              uploadedAt: new Date().toISOString(),
              sectionsCount: cleanedStructure.sections?.length || 0,
              tablesCount: cleanedStructure.tables?.length || 0,
              warnings: allWarnings,
            },
          });
          
          // Store document ID for later updates
          if (typeof window !== "undefined" && savedDoc.document?.id) {
            sessionStorage.setItem("codePreview.documentId", savedDoc.document.id);
          }
        } catch (saveErr) {
          console.warn("Failed to auto-save to history:", saveErr);
          // Continue anyway - this is not critical
        }
      }

      setStatus("Opening editor…");
      router.push("/pages/CodePreview");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-lime-50">
      {/* Header with Logo and Navigation */}
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
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">PDF to Template Converter</p>
                <p className="text-xs text-gray-500">Upload & Transform</p>
              </div>
              <Link 
                href="/pages/CodePreview"
                className="px-4 py-2 bg-[#A4C639] text-white rounded-lg font-medium hover:bg-[#8FB02E] transition-colors shadow-md text-sm"
              >
                Open Editor
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-4">
            <div className="w-2 h-2 bg-[#A4C639] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">AI-Powered Template Generation</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Transform Your Documents
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your PDF, Word, or text files and watch them transform into editable, professional templates
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-gray-200 border-t-4 border-[#A4C639]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl text-white shadow-md">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Upload Your Document
              </h2>
              <p className="text-sm text-gray-600">
                Supported formats: PDF, DOCX, TXT
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#A4C639] file:text-white
                    hover:file:bg-[#8FB02E]
                    file:cursor-pointer file:transition-colors
                    cursor-pointer
                    border-2 border-dashed border-gray-300 rounded-xl
                    p-4 bg-gray-50
                    hover:border-[#A4C639] hover:bg-lime-50
                    focus:outline-none focus:ring-2 focus:ring-[#A4C639] focus:border-transparent
                    transition-all"
                />
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-lime-50 p-3 rounded-lg border border-lime-200">
                    <svg className="w-5 h-5 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {status && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-blue-900">{status}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-linear-to-r from-[#A4C639] to-[#8FB02E] px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload & Generate Template</span>
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">AI Extraction</p>
                  <p className="text-xs text-gray-600">Smart content analysis</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Live Editing</p>
                  <p className="text-xs text-gray-600">Real-time preview</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Export Ready</p>
                  <p className="text-xs text-gray-600">Code or PDF format</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Note */}
        <p className="mt-8 text-center text-xs text-gray-500 max-w-md">
          Your documents are processed securely. Generated templates can be further customized in the live editor after processing.
        </p>
      </div>
    </div>
  );
};

const PdfConverter: React.FC = () => {
  return (
    <ProtectedRoute>
      <PdfConverterContent />
    </ProtectedRoute>
  );
};

export default PdfConverter;
