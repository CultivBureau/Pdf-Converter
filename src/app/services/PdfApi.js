const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[PdfApi] NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:8000. " +
      "Set this in .env.local to avoid CORS mistakes when the backend runs on a different host.",
  );
}

// Get auth token
function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Handle backend error format
    const errorMessage =
      isJson && payload?.message
        ? payload.message
        : isJson && payload?.detail
        ? (typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail))
        : payload || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload;
}

async function request(path, init = {}) {
  try {
    const url = `${API_BASE_URL}${path}`;
    
    // Get auth token
    const token = getAuthToken();
    
    // Prepare headers
    let headers = init.headers || {};
    
    // Add auth token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Only set Content-Type if not FormData
    if (!(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    
    const response = await fetch(url, {
      ...init,
      mode: init.mode ?? "cors",
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[PdfApi] Network request failed for ${path}: ${message}`);
  }
}

/**
 * Upload PDF file to backend
 * @param {File} file - PDF file to upload
 * @returns {Promise<{file_path: string, filename: string, original_filename: string, message: string}>}
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/upload/", {
    method: "POST",
    body: formData,
    // Don't set Content-Type header for FormData - browser will set it with boundary
    headers: {},
  });
}

/**
 * Extract text and tables from uploaded PDF
 * @param {string} filePath - Path returned from uploadFile
 * @returns {Promise<{sections: Array, tables: Array, meta: Object}>}
 */
export async function extractContent(filePath) {
  return request("/extract/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_path: filePath }),
  });
}

/**
 * Clean and enhance document structure using Claude AI
 * @param {Object} structure - Structure with sections and tables
 * @param {Object} options - Optional parameters (model, max_retries, timeout, temperature)
 * @returns {Promise<{sections: Array, tables: Array, meta: Object}>}
 */
export async function cleanStructure(structure, options = {}) {
  return request("/ai/clean-structure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structure,
      ...options,
    }),
  });
}

/**
 * Generate JSX code from document structure
 * 
 * @deprecated JSX generation has been moved to frontend.
 * Backend now only returns JSON. Use generateTemplateFromJson utility instead.
 * 
 * @param {Object} structure - Structure with sections and tables
 * @param {Object} options - Optional parameters (ignored)
 * @returns {Promise<{jsxCode: string, componentsUsed: Array, warnings: Array, metadata: Object}>}
 */
export async function generateJsx(structure, options = {}) {
  console.warn("[PdfApi] generateJsx is deprecated. JSX generation is now handled in frontend using React components.");
  
  // Import the utility function
  const { generateTemplateFromJson } = await import("../utils/generateTemplateFromJson");
  
  // Generate template from JSON structure
  const jsxCode = generateTemplateFromJson(structure);
  
  // Return in expected format
  return {
    jsxCode,
    componentsUsed: ["SectionTemplate", "DynamicTable", "BaseTemplate", "ImageBlock"],
    warnings: ["JSX generated in frontend - backend JSX generation is deprecated"],
    metadata: {
      generated_in: "frontend",
      structure_elements: structure.elements?.length || 0,
      structure_sections: structure.sections?.length || 0,
      structure_tables: structure.tables?.length || 0,
    }
  };
}

/**
 * Fix JSX syntax errors (frontend-side only)
 * 
 * @deprecated Backend fix-jsx endpoint has been removed.
 * This function now performs basic frontend-side fixes only.
 * 
 * @param {string} jsxCode - JSX code that may contain syntax errors
 * @param {string} errorMessage - Optional error message from compiler
 * @param {Object} options - Optional parameters (ignored)
 * @returns {Promise<{fixedCode: string, explanation: string, errors: Array, warnings: Array, changes: Array}>}
 */
export async function fixJsx(jsxCode, errorMessage = null, options = {}) {
  console.warn("[PdfApi] fixJsx is deprecated. Backend endpoint removed. Using frontend-side fixes only.");
  
  // Frontend-side basic fixes
  let fixedCode = jsxCode;
  const errors = [];
  const warnings = ["Backend fix-jsx endpoint removed. Using frontend-side fixes only."];
  const changes = [];
  
  // Fix missing closing parentheses
  const openParens = (fixedCode.match(/\(/g) || []).length;
  const closeParens = (fixedCode.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    fixedCode += ')'.repeat(openParens - closeParens);
    changes.push({ type: "fix", description: `Added ${openParens - closeParens} missing closing parentheses`, line: -1 });
  }
  
  // Fix missing closing braces
  const openBraces = (fixedCode.match(/\{/g) || []).length;
  const closeBraces = (fixedCode.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    fixedCode += '}'.repeat(openBraces - closeBraces);
    changes.push({ type: "fix", description: `Added ${openBraces - closeBraces} missing closing braces`, line: -1 });
  }
  
  return {
    fixedCode,
    explanation: "Applied frontend-side syntax fixes (backend endpoint removed)",
    errors,
    warnings,
    changes,
    metadata: { fixed_in: "frontend" }
  };
}

/**
 * Legacy functions - kept for backward compatibility
 * These may not match backend endpoints exactly
 */
export async function generateNextJs(extractedText) {
  console.warn("[PdfApi] generateNextJs is deprecated. Use generateJsx instead.");
  // This endpoint doesn't exist in backend - return error
  throw new Error("generateNextJs endpoint not available. Use generateJsx with structure instead.");
}

export async function repairTable(tableData) {
  console.warn("[PdfApi] repairTable endpoint not available in backend API.");
  throw new Error("repairTable endpoint not available in backend API.");
}

export async function updateTable(updateData) {
  console.warn("[PdfApi] updateTable endpoint not available in backend API.");
  throw new Error("updateTable endpoint not available in backend API.");
}

export async function tableToJsx(table) {
  console.warn("[PdfApi] tableToJsx endpoint not available in backend API.");
  throw new Error("tableToJsx endpoint not available in backend API.");
}

// Note: generateNextJs, repairTable, updateTable, tableToJsx are not part of the backend API
// These functions are kept for backward compatibility but may not work
// Use generateJsx and fixJsx instead which match the backend endpoints

/**
 * Validate JSX syntax using basic checks
 * This is a lightweight validation - for full validation, use Babel in the browser
 * 
 * @param {string} jsxCode - JSX code to validate
 * @returns {{isValid: boolean, errors: string[]}} Validation result with isValid and errors
 */
export function validateJsxSyntax(jsxCode) {
  const errors = [];
  
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
 * @param {string} jsxCode - JSX code to validate and fix
 * @param {number} maxRetries - Maximum number of fix attempts (default: 2)
 * @returns {Promise<Object>} Fixed JSX code and warnings
 */
export async function validateAndFixJsx(jsxCode, maxRetries = 2) {
  let currentCode = jsxCode;
  let attempts = 0;
  const allWarnings = [];
  let lastValidation = null;
  
  while (attempts < maxRetries) {
    const validation = validateJsxSyntax(currentCode);
    lastValidation = validation; // Store for final return
    
    if (validation.isValid) {
      return {
        jsx: currentCode,
        warnings: allWarnings,
        fixed: attempts > 0,
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
        allWarnings.push(`Fix attempt ${attempts + 1} failed: ${error.message}`);
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
    errors: lastValidation ? lastValidation.errors : [],
  };
}
