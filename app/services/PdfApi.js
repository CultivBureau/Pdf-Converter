const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:5001";

if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "[PdfApi] NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:5001. " +
      "Set this in .env.local to avoid CORS mistakes when the backend runs on a different host.",
  );
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      isJson && payload?.detail
        ? JSON.stringify(payload.detail)
        : payload || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload;
}

async function request(path, init = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      mode: init.mode ?? "cors",
    });
    return await handleResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[PdfApi] Network request failed for ${path}: ${message}`);
  }
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export async function generateNextJs(extractedText) {
  return request("/api/generate-nextjs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ extracted_text: extractedText }),
  });
}

export async function generateJsx(payload) {
  return request("/api/ai/generate-jsx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
}

export async function fixJsx(jsx) {
  return request("/api/ai/fix-jsx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jsx }),
  });
}

/**
 * Repair Table (Prompt A)
 * Takes raw extracted table data and returns cleaned, consistent table JSON.
 * 
 * @param {Object} tableData - Raw table data
 * @param {string} tableData.table_id - Unique identifier for the table
 * @param {number} [tableData.page] - Page number where table was found
 * @param {Array<number>} [tableData.bbox] - Bounding box [x0, y0, x1, y1]
 * @param {number} tableData.detected_columns - Expected number of columns
 * @param {Array<Object>} tableData.raw_cells - Array of cell objects with row, col, text, x0, x1, confidence
 * @param {Array<Object>} [tableData.user_edits] - Optional user edits to apply
 * @param {string} [tableData.notes] - Optional notes about the table
 * @param {number} [tableData.max_retries] - Maximum retry attempts (default: 2)
 * @returns {Promise<Object>} Repaired table structure
 */
export async function repairTable(tableData) {
  return request("/api/ai/repair-table", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tableData),
  });
}

/**
 * Update Table (Prompt B)
 * Applies user edits to a previously repaired table while preserving structural integrity.
 * 
 * @param {Object} updateData - Table update data
 * @param {Object} updateData.base_table - The previous repaired table JSON
 * @param {Array<Object>} updateData.user_edits - Array of edit operations
 * @param {string} [updateData.notes] - Optional notes about the update
 * @returns {Promise<Object>} Updated table structure
 */
export async function updateTable(updateData) {
  return request("/api/ai/update-table", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });
}

/**
 * Table to JSX (Prompt C)
 * Converts repaired table JSON to clean JSX Tailwind code.
 * 
 * @param {Object} table - The repaired table JSON
 * @returns {Promise<Object>} JSX code and warnings
 */
export async function tableToJsx(table) {
  return request("/api/ai/table-to-jsx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ table }),
  });
}

/**
 * Validate JSX syntax using basic checks
 * This is a lightweight validation - for full validation, use Babel in the browser
 * 
 * @param {string} jsxCode - JSX code to validate
 * @returns {Object} Validation result with isValid and errors
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
        if (fixResponse.jsx) {
          currentCode = fixResponse.jsx;
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
