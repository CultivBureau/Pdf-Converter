/**
 * PDF API client - Migrated to use SDK
 * 
 * Provides functions for PDF upload, extraction, and AI processing
 * All functions now use the SDK under the hood for consistent error handling and type safety
 */

import { apiClient } from '@/app/lib/api';
import type {
  UploadResponse,
  ExtractionResult,
  CleanStructureResponse,
  GenerateJSXResponse,
  FixJSXResponse,
} from '@/app/lib/api';

/**
 * Upload PDF file to backend
 * @param file - PDF file to upload
 * @returns Promise with file_path, filename, original_filename, and message
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  return await apiClient.uploadFile(file);
}

/**
 * Extract text and tables from uploaded PDF
 * @param filePath - Path returned from uploadFile
 * @returns Promise with sections, tables, images, and meta
 */
export async function extractContent(filePath: string): Promise<ExtractionResult> {
  return await apiClient.extractPDF(filePath);
}

/**
 * Clean and enhance document structure using Claude AI
 * @param structure - Structure with sections and tables
 * @param options - Optional parameters (model, max_retries, timeout, temperature)
 * @returns Promise with cleaned sections, tables, and meta
 */
export async function cleanStructure(
  structure: { sections: any[]; tables: any[] },
  options: {
    model?: string;
    max_retries?: number;
    timeout?: number;
    temperature?: number;
  } = {}
): Promise<CleanStructureResponse> {
  return await apiClient.cleanStructure(structure, options);
}

/**
 * Generate JSX code from document structure using GPT
 * @param structure - Structure with sections and tables
 * @param options - Optional parameters (model, max_retries, timeout, temperature)
 * @returns Promise with jsxCode, componentsUsed, warnings, and metadata
 */
export async function generateJsx(
  structure: { sections: any[]; tables: any[] },
  options: {
    model?: string;
    max_retries?: number;
    timeout?: number;
    temperature?: number;
  } = {}
): Promise<GenerateJSXResponse> {
  return await apiClient.generateJSX(structure, options);
}

/**
 * Fix JSX syntax errors using GPT
 * @param jsxCode - JSX code that may contain syntax errors
 * @param errorMessage - Optional error message from compiler
 * @param options - Optional parameters (model, max_retries, timeout, temperature)
 * @returns Promise with fixedCode, explanation, errors, warnings, and changes
 */
export async function fixJsx(
  jsxCode: string,
  errorMessage: string | null = null,
  options: {
    model?: string;
    max_retries?: number;
    timeout?: number;
    temperature?: number;
  } = {}
): Promise<FixJSXResponse> {
  return await apiClient.fixJSX(jsxCode, errorMessage || undefined, options);
}

/**
 * Legacy functions - kept for backward compatibility
 * These may not match backend endpoints exactly
 */
export async function generateNextJs(extractedText: any) {
  console.warn("[PdfApi] generateNextJs is deprecated. Use generateJsx instead.");
  throw new Error("generateNextJs endpoint not available. Use generateJsx with structure instead.");
}

export async function repairTable(tableData: any) {
  console.warn("[PdfApi] repairTable endpoint not available in backend API.");
  throw new Error("repairTable endpoint not available in backend API.");
}

export async function updateTable(updateData: any) {
  console.warn("[PdfApi] updateTable endpoint not available in backend API.");
  throw new Error("updateTable endpoint not available in backend API.");
}

export async function tableToJsx(table: any) {
  console.warn("[PdfApi] tableToJsx endpoint not available in backend API.");
  throw new Error("tableToJsx endpoint not available in backend API.");
}

/**
 * Validate JSX syntax using basic checks
 * This is a lightweight validation - for full validation, use Babel in the browser
 * 
 * @param jsxCode - JSX code to validate
 * @returns Validation result with isValid and errors
 */
export function validateJsxSyntax(jsxCode: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!jsxCode || typeof jsxCode !== 'string') {
    return { isValid: false, errors: ['JSX code is empty or invalid'] };
  }
  
  // Check for balanced braces
  const openBraces = (jsxCode.match(/\{/g) || []).length;
  const closeBraces = (jsxCode.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  // Check for balanced parentheses
  const openParens = (jsxCode.match(/\(/g) || []).length;
  const closeParens = (jsxCode.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  // Check for unclosed tags (basic check)
  const openTags = (jsxCode.match(/<[A-Za-z][A-Za-z0-9]*[^>]*>/g) || []).length;
  const closeTags = (jsxCode.match(/<\/[A-Za-z][A-Za-z0-9]*>/g) || []).length;
  const selfClosingTags = (jsxCode.match(/<[A-Za-z][A-Za-z0-9]*[^>]*\/>/g) || []).length;
  
  // Rough estimate: if we have significantly more opening tags than closing + self-closing, might be incomplete
  if (openTags > closeTags + selfClosingTags + 5) {
    errors.push(`Possible unclosed tags: ${openTags} opening tags vs ${closeTags} closing + ${selfClosingTags} self-closing`);
  }
  
  // Check for common syntax errors
  if (jsxCode.includes('className\n=') || jsxCode.includes('className\\n=')) {
    errors.push('Newline found between attribute name and equals sign (e.g., className\\n=)');
  }
  
  // Check for unclosed EditableText tags (should be self-closing)
  const editableTextMatches = jsxCode.match(/<EditableText[^>]*>/g) || [];
  editableTextMatches.forEach((tag, index) => {
    if (!tag.includes('/>') && !tag.endsWith('>')) {
      errors.push(`EditableText tag at position ${index} may not be properly closed`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Auto-fix JSX by calling the fix endpoint if validation fails
 * 
 * @param jsxCode - JSX code to validate and fix
 * @param maxRetries - Maximum number of fix attempts (default: 2)
 * @returns Fixed JSX code and warnings
 */
export async function validateAndFixJsx(
  jsxCode: string,
  maxRetries: number = 2
): Promise<{
  jsx: string;
  warnings: string[];
  fixed: boolean;
  isValid?: boolean;
  errors?: string[];
}> {
  let currentCode = jsxCode;
  let attempts = 0;
  const allWarnings: string[] = [];
  let lastValidation: { isValid: boolean; errors: string[] } | null = null;
  
  while (attempts < maxRetries) {
    const validation = validateJsxSyntax(currentCode);
    lastValidation = validation; // Store for final return
    
    if (validation.isValid) {
      return {
        jsx: currentCode,
        warnings: allWarnings,
        fixed: attempts > 0,
        isValid: true,
      };
    }
    
    // If validation failed and we haven't exceeded retries, try to fix
    if (attempts < maxRetries - 1) {
      try {
        const fixResponse = await fixJsx(currentCode);
        // Backend returns fixedCode, not jsx
        if (fixResponse.fixedCode) {
          currentCode = fixResponse.fixedCode;
          allWarnings.push(...(fixResponse.warnings || []));
          allWarnings.push(`Fix attempt ${attempts + 1}: ${validation.errors.join(', ')}`);
          attempts++;
          continue;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        allWarnings.push(`Fix attempt ${attempts + 1} failed: ${errorMessage}`);
        break;
      }
    } else {
      // Last attempt failed
      allWarnings.push(`Validation failed after ${maxRetries} attempts: ${validation.errors.join(', ')}`);
      break;
    }
  }
  
  return {
    jsx: currentCode,
    warnings: allWarnings,
    fixed: attempts > 0,
    isValid: lastValidation ? lastValidation.isValid : false,
    errors: lastValidation ? lastValidation.errors : [],
  };
}

