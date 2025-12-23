"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Zap, 
  Eye, 
  Download, 
  FileText,
  Sparkles
} from "lucide-react";
import { 
  uploadFile, 
  extractStructured
} from "../../services/PdfApi";
import type { SeparatedStructure } from "../../types/ExtractTypes";
import { isAuthenticated } from "../../services/AuthApi";
import { saveDocument } from "../../services/HistoryApi";
import { useAuth } from "../../contexts/AuthContext";
import { getCompany } from "../../services/CompanyApi";
import ProtectedRoute from "../../components/ProtectedRoute";
import ErrorDialog from "../../components/ErrorDialog";
import type { ErrorSeverity } from "../../components/ErrorDialog";

const PdfConverterContent: React.FC = () => {
  const router = useRouter();
  const { user, isSuperAdmin } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  
  // Error Dialog State
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    severity: ErrorSeverity;
  }>({
    isOpen: false,
    title: "",
    message: "",
    severity: "error",
  });

  // Load company name if user has a company
  useEffect(() => {
    if (user?.company_id) {
      const loadCompany = async () => {
        try {
          const company = await getCompany(user.company_id!);
          setCompanyName(company.name);
        } catch (err) {
          console.error("Failed to load company:", err);
        }
      };
      loadCompany();
    }
  }, [user?.company_id]);

  const showErrorDialog = (title: string, message: string, severity: ErrorSeverity = "error") => {
    setErrorDialog({
      isOpen: true,
      title,
      message,
      severity,
    });
  };

  const closeErrorDialog = () => {
    setErrorDialog({
      ...errorDialog,
      isOpen: false,
    });
  };

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

      // Step 2: Extract structured data (v2 format: { generated, user, layout, meta })
      setStatus("Extracting content from PDF…");
      const extractResponse: SeparatedStructure = await extractStructured(uploadResponse.file_path);
      
      if (!extractResponse.generated || (!extractResponse.generated.sections?.length && !extractResponse.generated.tables?.length)) {
        throw new Error("Extraction returned no content.");
      }

      // Store in sessionStorage for CodePreview page (v2 format)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "codePreview.extractedData",
          JSON.stringify(extractResponse),
        );
        sessionStorage.setItem("codePreview.filePath", uploadResponse.file_path);
        sessionStorage.setItem("codePreview.originalFilename", uploadResponse.original_filename || selectedFile.name);
        sessionStorage.setItem(
          "codePreview.metadata",
          JSON.stringify({
            filename: uploadResponse.filename || selectedFile.name,
            uploadedAt: new Date().toISOString(),
            sectionsCount: extractResponse.generated.sections?.length || 0,
            tablesCount: extractResponse.generated.tables?.length || 0,
          }),
        );
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
            extracted_data: extractResponse, // Full v2 structure
            metadata: {
              filename: uploadResponse.filename || selectedFile.name,
              uploadedAt: new Date().toISOString(),
              sectionsCount: extractResponse.generated.sections?.length || 0,
              tablesCount: extractResponse.generated.tables?.length || 0,
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
      
      // Check if it's a limit error
      if (message.toLowerCase().includes("limit") || 
          message.toLowerCase().includes("quota") || 
          message.toLowerCase().includes("maximum") ||
          message.toLowerCase().includes("exceeded")) {
        
        // Clean up the error message - remove technical prefixes
        let cleanMessage = message;
        cleanMessage = cleanMessage.replace(/^\[\w+\]\s*/i, ''); // Remove [PdfApi] prefix
        cleanMessage = cleanMessage.replace(/Network request failed for [^:]+:\s*/i, ''); // Remove network request info
        
        showErrorDialog(
          "Upload Limit Reached - Please Contact Support to upgrade your plan ",
          cleanMessage,
          "warning"
        );
      } else {
        // Show regular error in the form
        setError(message);
      }
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-lime-50">
      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        onClose={closeErrorDialog}
        title={errorDialog.title}
        message={errorDialog.message}
        severity={errorDialog.severity}
      />

      {/* Header with Logo and Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <Image
               src="/logo.png"
              alt="Buearau logo"
                width={140}
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
                className="px-4 py-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md text-sm"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-full shadow-md border border-[#C4B454]/20 mb-4">
            <Sparkles className="w-4 h-4 text-[#B8A040]" />
            <span className="text-sm font-medium text-[#B8A040]">AI-Powered OCR Extraction</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Transform Your </span>
            <span className="bg-gradient-to-r from-[#C4B454] to-[#B8A040] bg-clip-text text-transparent">Documents</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your PDF documents and let our intelligent OCR technology extract and transform them into editable templates
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-gray-200 border-t-4 border-[#C4B454]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl text-white shadow-md">
              <Upload className="w-7 h-7" />
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
                    file:bg-gradient-to-r file:from-[#C4B454] file:to-[#B8A040] file:text-white
                    hover:file:from-[#B8A040] hover:file:to-[#A69035]
                    file:cursor-pointer file:transition-all
                    cursor-pointer
                    border-2 border-dashed border-gray-300 rounded-xl
                    p-4 bg-gray-50
                    hover:border-[#C4B454] hover:bg-[#C4B454]/5
                    focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-transparent
                    transition-all"
                />
                {selectedFile && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/5 p-3 rounded-lg border border-[#C4B454]/30">
                    <CheckCircle className="w-5 h-5 text-[#B8A040]" />
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
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {status && (
              <div className="rounded-lg bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/5 border border-[#C4B454]/30 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#B8A040] animate-spin" />
                  <p className="text-sm font-medium text-gray-900">{status}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#C4B454] to-[#B8A040] px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-[#B8A040] hover:to-[#A69035] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload & Generate Template</span>
                </>
              )}
            </button>
          </div>

          {/* Company Info (if user has company) */}
          {user && (user.company_id || isSuperAdmin) && (
            <div className="mt-6 p-4 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/5 rounded-xl border border-[#C4B454]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">
                    {isSuperAdmin 
                      ? "Super Admin: Uploads can be assigned to any company or no company"
                      : companyName 
                      ? `Company: ${companyName}`
                      : "Company: Loading..."}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isSuperAdmin 
                      ? "You have full system access"
                      : "This document will be assigned to your company"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#B8A040]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">AI OCR Extraction</p>
                  <p className="text-xs text-gray-600">Intelligent content analysis</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#B8A040]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Live Preview</p>
                  <p className="text-xs text-gray-600">Real-time editing</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-[#B8A040]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Easy Export</p>
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
