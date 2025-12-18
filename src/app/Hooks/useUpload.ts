"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadFile, extractStructured } from "@/app/services/PdfApi";
import type { UploadResponse, ExtractResponse } from "@/app/types/ExtractTypes";

export interface UseUploadReturn {
  // State
  isUploading: boolean;
  isExtracting: boolean;
  uploadError: string | null;
  extractError: string | null;
  status: string;
  
  // Upload result
  filePath: string | null;
  filename: string | null;
  
  // Extract result
  extractedData: ExtractResponse | null;
  
  // Actions
  handleUpload: (file: File) => Promise<UploadResponse | null>;
  handleExtract: (filePath: string) => Promise<ExtractResponse | null>;
  reset: () => void;
}

/**
 * Custom hook for PDF upload and extraction
 * Phase 2: Upload & API Integration
 */
export function useUpload(): UseUploadReturn {
  const router = useRouter();
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  
  // Extract state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractResponse | null>(null);
  
  // Status message
  const [status, setStatus] = useState("");

  /**
   * Upload PDF file to backend
   * @param file - PDF file to upload
   * @returns Upload response with file_path or null on error
   */
  const handleUpload = useCallback(async (file: File): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setUploadError(null);
    setStatus("جاري رفع الملف...");

    try {
      const response = await uploadFile(file);
      
      if (!response.file_path) {
        throw new Error("فشل الرفع: لم يتم إرجاع مسار الملف.");
      }

      setFilePath(response.file_path);
      setFilename(response.filename);
      setStatus("تم رفع الملف بنجاح!");
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الرفع.";
      setUploadError(message);
      setStatus("");
      console.error("Upload error:", err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Extract content from uploaded PDF
   * @param filePath - File path returned from upload
   * @returns Extract response with sections and tables or null on error
   */
  const handleExtract = useCallback(async (filePath: string): Promise<ExtractResponse | null> => {
    setIsExtracting(true);
    setExtractError(null);
    setStatus("جاري استخراج المحتوى...");

    try {
      const response = await extractStructured(filePath);
      
      if (!response.sections && !response.tables) {
        throw new Error("لم يتم استخراج أي محتوى من الملف.");
      }

      setExtractedData(response);
      setStatus("تم استخراج المحتوى بنجاح!");
      
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ أثناء الاستخراج.";
      setExtractError(message);
      setStatus("");
      console.error("Extract error:", err);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setIsExtracting(false);
    setUploadError(null);
    setExtractError(null);
    setFilePath(null);
    setFilename(null);
    setExtractedData(null);
    setStatus("");
  }, []);

  return {
    // State
    isUploading,
    isExtracting,
    uploadError,
    extractError,
    status,
    
    // Upload result
    filePath,
    filename,
    
    // Extract result
    extractedData,
    
    // Actions
    handleUpload,
    handleExtract,
    reset,
  };
}

