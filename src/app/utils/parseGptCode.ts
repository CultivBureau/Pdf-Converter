/**
 * Parse GPT Code Utility
 * Phase 4: JSX Code Generation Preview
 * 
 * Functions to parse and extract information from GPT-generated JSX code
 */

/**
 * Extract component name from JSX code
 * @param code - JSX code string
 * @returns Component name or null
 */
export function extractComponentName(code: string): string | null {
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /const\s+(\w+)\s*=\s*\(\)\s*=>/,
    /function\s+(\w+)\s*\(/,
    /export\s+default\s+(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract imports from JSX code
 * @param code - JSX code string
 * @returns Array of import statements
 */
export function extractImports(code: string): string[] {
  const importRegex = /^import\s+.*?from\s+['"].*?['"];?/gm;
  const matches = code.match(importRegex);
  return matches || [];
}

/**
 * Extract React import
 * @param code - JSX code string
 * @returns React import statement or null
 */
export function extractReactImport(code: string): string | null {
  const reactImportRegex = /^import\s+.*?\bReact\b.*?from\s+['"]react['"];?/m;
  const match = code.match(reactImportRegex);
  return match ? match[0] : null;
}

/**
 * Check if code has React import
 * @param code - JSX code string
 * @returns boolean
 */
export function hasReactImport(code: string): boolean {
  return extractReactImport(code) !== null;
}

/**
 * Extract component code (without imports and exports)
 * @param code - JSX code string
 * @returns Component code only
 */
export function extractComponentCode(code: string): string {
  // Remove imports
  let componentCode = code.replace(/^import\s+.*?from\s+['"].*?['"];?\n?/gm, "");
  
  // Remove export default if exists
  componentCode = componentCode.replace(/export\s+default\s+/g, "");
  
  return componentCode.trim();
}

/**
 * Extract JSX return statement
 * @param code - JSX code string
 * @returns JSX return content or null
 */
export function extractJSXReturn(code: string): string | null {
  const returnRegex = /return\s*\(([\s\S]*?)\)\s*;?\s*}/;
  const match = code.match(returnRegex);
  return match ? match[1].trim() : null;
}

/**
 * Extract all component names used in code
 * @param code - JSX code string
 * @returns Array of component names
 */
export function extractUsedComponents(code: string): string[] {
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)\b/g;
  const matches = code.matchAll(componentRegex);
  const components = new Set<string>();
  
  for (const match of matches) {
    const componentName = match[1];
    // Skip HTML tags
    if (!['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th'].includes(componentName.toLowerCase())) {
      components.add(componentName);
    }
  }
  
  return Array.from(components);
}

/**
 * Extract props from component
 * @param code - JSX code string
 * @returns Array of prop names
 */
export function extractProps(code: string): string[] {
  const propsRegex = /(?:function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|\(\)\s*=>)\s*\{?\s*([^)]*)\}?/;
  const match = code.match(propsRegex);
  
  if (!match || !match[1]) {
    return [];
  }
  
  // Extract prop names
  const props = match[1]
    .split(',')
    .map((prop) => prop.trim().split(':')[0].trim())
    .filter((prop) => prop.length > 0 && prop !== 'props');
  
  return props;
}

/**
 * Validate JSX structure
 * @param code - JSX code string
 * @returns Validation result
 */
export function validateJSXStructure(code: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for React import
  if (!hasReactImport(code)) {
    warnings.push("React import may be missing");
  }

  // Check for component definition
  const componentName = extractComponentName(code);
  if (!componentName) {
    errors.push("No component definition found");
  }

  // Check for return statement
  const jsxReturn = extractJSXReturn(code);
  if (!jsxReturn) {
    errors.push("No JSX return statement found");
  }

  // Check for export default
  if (!code.includes("export default")) {
    warnings.push("Component may not be exported");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format code with proper indentation
 * @param code - JSX code string
 * @returns Formatted code
 */
export function formatCode(code: string): string {
  // Basic formatting - in production, use prettier or similar
  let formatted = code;
  
  // Add newline after imports
  formatted = formatted.replace(/(import\s+.*?from\s+['"].*?['"];?)\n(?!\n)/g, '$1\n');
  
  // Add newline before export
  formatted = formatted.replace(/\n(export\s+default)/g, '\n\n$1');
  
  return formatted;
}

/**
 * Parse GPT response to extract JSX code
 * @param gptResponse - GPT API response
 * @returns Extracted JSX code or null
 */
export function parseGPTResponse(gptResponse: any): string | null {
  // Handle different response formats
  if (typeof gptResponse === 'string') {
    return gptResponse;
  }
  
  if (gptResponse?.jsxCode) {
    return gptResponse.jsxCode;
  }
  
  if (gptResponse?.code) {
    return gptResponse.code;
  }
  
  if (gptResponse?.content) {
    // Try to extract from content (if it's a message object)
    if (typeof gptResponse.content === 'string') {
      return gptResponse.content;
    }
  }
  
  return null;
}

/**
 * Fix import paths to match frontend structure
 * @param code - JSX code with potentially incorrect imports
 * @returns Code with corrected import paths
 */
export function fixImportPaths(code: string): string {
  let fixed = code;
  
  // Fix template imports - multiple patterns
  const importPatterns = [
    // Pattern 1: './templates/base_template' -> '@/app/Templates/baseTemplate'
    {
      from: /from\s+['"]\.\/templates\/(base_template|section_template|dynamic_table_template)['"]/g,
      to: (match: string, template: string) => {
        const templateMap: Record<string, string> = {
          'base_template': 'baseTemplate',
          'section_template': 'sectionTemplate',
          'dynamic_table_template': 'dynamicTableTemplate',
        };
        return `from '@/app/Templates/${templateMap[template] || template}'`;
      }
    },
    // Pattern 2: './templates/baseTemplate' -> '@/app/Templates/baseTemplate'
    {
      from: /from\s+['"]\.\/templates\/(baseTemplate|sectionTemplate|dynamicTableTemplate)['"]/g,
      to: (match: string, template: string) => `from '@/app/Templates/${template}'`
    },
    // Pattern 3: '../templates/...' -> '@/app/Templates/...'
    {
      from: /from\s+['"]\.\.\/templates\/(baseTemplate|sectionTemplate|dynamicTableTemplate|base_template|section_template|dynamic_table_template)['"]/g,
      to: (match: string, template: string) => {
        const templateMap: Record<string, string> = {
          'base_template': 'baseTemplate',
          'section_template': 'sectionTemplate',
          'dynamic_table_template': 'dynamicTableTemplate',
        };
        const mapped = templateMap[template] || template;
        return `from '@/app/Templates/${mapped}'`;
      }
    },
    // Pattern 4: '@/templates/...' -> '@/app/Templates/...'
    {
      from: /from\s+['"]@\/templates\/(baseTemplate|sectionTemplate|dynamicTableTemplate|base_template|section_template|dynamic_table_template)['"]/g,
      to: (match: string, template: string) => {
        const templateMap: Record<string, string> = {
          'base_template': 'baseTemplate',
          'section_template': 'sectionTemplate',
          'dynamic_table_template': 'dynamicTableTemplate',
        };
        const mapped = templateMap[template] || template;
        return `from '@/app/Templates/${mapped}'`;
      }
    },
  ];
  
  // Apply all import fixes
  for (const pattern of importPatterns) {
    fixed = fixed.replace(pattern.from, pattern.to);
  }
  
  // Ensure "use client" directive for Next.js client components
  // BUT: Don't add it for generated templates (they don't need it, PreviewRenderer removes it anyway)
  // Generated templates have "export default function Template()" pattern
  const isGeneratedTemplate = fixed.includes('export default function Template()') || 
                               fixed.includes('export default function Template(');
  
  if (!isGeneratedTemplate && !fixed.includes('"use client"') && !fixed.includes("'use client'")) {
    // Add after any existing comments but before imports
    const importIndex = fixed.indexOf('import');
    if (importIndex !== -1) {
      fixed = '"use client";\n\n' + fixed;
    }
  }
  
  return fixed;
}

/**
 * Clean and prepare JSX code for rendering
 * @param code - Raw JSX code
 * @returns Cleaned JSX code
 */
export function cleanJSXCode(code: string): string {
  let cleaned = code.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```(?:jsx|javascript|tsx|typescript)?\n/gm, '');
  cleaned = cleaned.replace(/```$/gm, '');
  
  // Fix import paths first
  cleaned = fixImportPaths(cleaned);
  
  // Ensure React import exists
  if (!hasReactImport(cleaned)) {
    // Add React import after "use client" if present
    if (cleaned.startsWith('"use client"') || cleaned.startsWith("'use client'")) {
      cleaned = cleaned.replace(/("use client"|'use client');?\n?/, '$1;\n\nimport React from \'react\';\n');
    } else {
      cleaned = "import React from 'react';\n\n" + cleaned;
    }
  }
  
  // Ensure export default exists
  if (!cleaned.includes('export default')) {
    const componentName = extractComponentName(cleaned);
    if (componentName) {
      cleaned = cleaned.replace(
        new RegExp(`(function|const)\\s+${componentName}`, 'g'),
        `export default $1 ${componentName}`
      );
    }
  }
  
  return cleaned;
}

