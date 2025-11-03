"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { LiveProvider, LivePreview, LiveError } from "react-live";
import EditableText from "./EditableText";

type PreviewRendererProps = {
  code: string;
  values: Record<string, string>;
  setValue: (id: string, v: string) => void;
};

export default function PreviewRenderer({ code, values, setValue }: PreviewRendererProps) {
  // Keep a stable reference for `values` to avoid remounting preview on each keystroke
  const stableValuesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const target = stableValuesRef.current;
    // copy/merge keys
    for (const k of Object.keys(values)) {
      target[k] = values[k];
    }
    // remove keys not present anymore
    for (const k of Object.keys(target)) {
      if (!(k in values)) delete target[k];
    }
  }, [values]);

  const scope = useMemo(() => ({
    React,
    EditableText,
    values: stableValuesRef.current,
    setValue,
    Fragment: React.Fragment,
  }), [setValue]);

  // Transform user code for noInline mode:
  // 1) Strip `export default` from `export default function Template`.
  // 2) Append explicit render call.
  // 3) Clean up any syntax issues
  const transformed = useMemo(() => {
    let src = code.trim();
    let componentName = "Template";

    // Remove any leading/trailing whitespace
    src = src.trim();

    // CRITICAL: Unescape JSON-encoded quotes
    // When code comes from JSON API response, quotes may be escaped as \"
    // Example: className=\"min-h-screen\" should become className="min-h-screen"
    // Note: We only unescape quotes, not escape sequences like \n inside strings
    
    // Handle double-escaped sequences first (if JSON was double-encoded)
    src = src.replace(/\\\\"/g, '"');
    src = src.replace(/\\\\'/g, "'");
    
    // Unescape quotes from JSON encoding
    // This is the main fix for the syntax error: \" becomes "
    src = src.replace(/\\"/g, '"');
    src = src.replace(/\\'/g, "'");
    
    // CRITICAL: Fix double curly braces in JSX expressions
    // Problem: AI/JSON encoding creates ={{ instead of ={ 
    // Example: value={{values['key'] || 'text'}} should be value={values['key'] || 'text'}
    // Strategy: Find ={{, match balanced braces, replace with ={
    
    const fixDoubleBraces = (code: string): string => {
      let result = '';
      let i = 0;
      
      while (i < code.length) {
        // Look for ={{ pattern (JSX attribute with double opening brace)
        if (code[i] === '=' && code[i + 1] === '{' && code[i + 2] === '{') {
          // Check if this is a JSX attribute (has attribute name before =)
          const beforeStart = Math.max(0, i - 30);
          const before = code.substring(beforeStart, i);
          
          if (before.match(/[a-zA-Z0-9_-]+\s*$/)) {
            // This is a JSX attribute - replace ={{ with ={
            result += '={';
            i += 3; // Skip ={{
            
            // Now find the matching closing braces
            // We need to match nested braces and find }}}
            let braceDepth = 1; // We already have one { from our replacement
            while (i < code.length && braceDepth > 0) {
              if (code[i] === '{' && code[i - 1] !== '\\') {
                braceDepth++;
                result += code[i];
              } else if (code[i] === '}' && code[i - 1] !== '\\') {
                braceDepth--;
                if (braceDepth === 0) {
                  // Check if next is also } (closing the double brace)
                  if (code[i + 1] === '}') {
                    // Found }}} - output single }
                    result += '}';
                    i += 2; // Skip }}
                  } else {
                    // Single } - keep it
                    result += code[i];
                    i++;
                  }
                } else {
                  result += code[i];
                }
              } else {
                result += code[i];
              }
              i++;
            }
          } else {
            // Not a JSX attribute, keep as-is
            result += code[i];
            i++;
          }
        } else {
          result += code[i];
          i++;
        }
      }
      
      return result;
    };
    
    src = fixDoubleBraces(src);
    
    // CRITICAL: Protect JSX expressions BEFORE any attribute quote conversion
    // AI-generated code has patterns like:
    // - value={values['key'] || 'text'}
    // - onChange={(v)=>setValue('key', v)}
    // These expressions MUST be preserved exactly as-is
    const expressionPlaceholders: Array<{ placeholder: string; original: string }> = [];
    let placeholderIndex = 0;
    
    // Protect JSX expressions that may contain single quotes
    // AI-generated code patterns: value={values['key'] || 'text'}, onChange={(v)=>setValue('key', v)}
    // Strategy: Find all ={...} patterns (JSX attribute expressions) and protect them
    
    // Match balanced braces for JSX expressions in attributes
    // Pattern: attributeName={...expression...}
    let i = 0;
    while (i < src.length) {
      // Look for ={ pattern (JSX attribute expression)
      const attrStart = src.indexOf('={', i);
      if (attrStart === -1) break;
      
      // Check if this is a JSX attribute (should be after whitespace, comma, or tag start)
      const before = src.substring(Math.max(0, attrStart - 10), attrStart);
      const isJsxAttr = /[\s,<]/.test(before[before.length - 1]) || 
                        before.trim() === '' ||
                        before.match(/[a-zA-Z0-9_-]+$/);
      
      if (isJsxAttr) {
        // Find the matching closing brace
        let braceDepth = 1;
        let j = attrStart + 2; // Skip ={
        let found = false;
        
        while (j < src.length && braceDepth > 0) {
          if (src[j] === '{' && src[j - 1] !== '\\') {
            braceDepth++;
          } else if (src[j] === '}' && src[j - 1] !== '\\') {
            braceDepth--;
            if (braceDepth === 0) {
              // Found complete expression
              const exprStart = attrStart;
              const exprEnd = j + 1;
              const expression = src.substring(exprStart, exprEnd);
              
              // Only protect if it contains quotes or EditableText patterns
              if (expression.includes("'") || expression.includes('values[') || expression.includes('setValue')) {
                const placeholder = `___JSX_EXPR_${placeholderIndex++}___`;
                expressionPlaceholders.push({ placeholder, original: expression });
                src = src.substring(0, exprStart) + placeholder + src.substring(exprEnd);
                i = exprStart + placeholder.length;
                found = true;
                break;
              }
            }
          }
          j++;
        }
        
        if (!found) {
          i = attrStart + 2;
        }
      } else {
        i = attrStart + 2;
      }
    }
    
    // CRITICAL: Convert single-quoted JSX ATTRIBUTES to double-quoted
    // BUT: Do NOT touch JSX expressions (already protected above)
    // Problem: JSX attributes with single quotes can break when text contains apostrophes
    // Solution: Convert ONLY attribute values (not expressions) from single to double quotes
    
    // Step 2: Convert all single-quoted JSX attributes to double quotes
    // IMPORTANT: JSX expressions are already protected as placeholders
    // Only convert literal attribute values like className='text' to className="text"
    // Do NOT convert JSX expressions (they're placeholders now)
    
    // Pattern to match JSX opening tags with attributes
    src = src.replace(/<([A-Za-z][A-Za-z0-9]*)([^>]*)>/g, (fullMatch, tagName, attrs) => {
      if (!attrs.trim()) {
        return fullMatch; // No attributes, return as-is
      }
      
      // Skip if this contains a placeholder (already a JSX expression)
      if (attrs.includes('___JSX_EXPR_')) {
        return fullMatch; // Already protected, skip conversion
      }
      
      // Process attributes: find attribute=value patterns
      // We need to handle:
      // - Single quotes: attr='value'
      // - Double quotes: attr="value" (already correct)
      // - JSX expressions: attr={expr} (should be protected by placeholder)
      
      let processedAttrs = '';
      let i = 0;
      let inQuote = false;
      let quoteChar = '';
      let attrName = '';
      
      while (i < attrs.length) {
        const char = attrs[i];
        const nextChar = attrs[i + 1] || '';
        const prevChar = i > 0 ? attrs[i - 1] : '';
        
        if (!inQuote) {
          // Look for attribute name followed by =
          if (char === '=' && nextChar === "'") {
            // Found attribute='value - convert to attribute="value
            processedAttrs += '="';
            i += 2; // Skip ='
            inQuote = true;
            quoteChar = "'";
            continue;
          } else if (char === '=' && nextChar === '"') {
            // Already double-quoted, keep as is
            processedAttrs += '="';
            i += 2;
            inQuote = true;
            quoteChar = '"';
            continue;
          } else if (char === '=' && nextChar === '{') {
            // JSX expression - keep as is (should be placeholder)
            processedAttrs += char;
            i++;
            continue;
          }
        } else {
          // We're inside a quoted value
          if (char === quoteChar) {
            // Check if this is the closing quote (followed by space, >, /, or end)
            const afterQuote = attrs[i + 1] || '';
            if (afterQuote === '' || afterQuote === ' ' || afterQuote === '>' || afterQuote === '/' || /\s/.test(afterQuote)) {
              // Closing quote - if it was single, convert to double
              // But first, escape any double quotes that might be in the value
              let value = processedAttrs.substring(processedAttrs.lastIndexOf('="') + 2);
              if (quoteChar === "'") {
                // Escape any double quotes in the value
                value = value.replace(/"/g, '\\"');
              }
              processedAttrs = processedAttrs.substring(0, processedAttrs.lastIndexOf('="') + 2) + value + '"';
              i++; // Skip the closing quote
              inQuote = false;
              quoteChar = '';
              continue;
            }
          }
        }
        
        processedAttrs += char;
        i++;
      }
      
      // If we ended while still in a quote, close it
      if (inQuote) {
        let value = processedAttrs.substring(processedAttrs.lastIndexOf('="') + 2);
        if (quoteChar === "'") {
          value = value.replace(/"/g, '\\"');
        }
        processedAttrs = processedAttrs.substring(0, processedAttrs.lastIndexOf('="') + 2) + value + '"';
      }
      
      return `<${tagName}${processedAttrs}>`;
    });
    
    // Step 3: Restore the protected JSX expressions
    expressionPlaceholders.forEach(({ placeholder, original }) => {
      src = src.replace(placeholder, original);
    });

    // Remove any import statements if present (AI-generated code shouldn't have these)
    src = src.replace(/^import\s+.*?from\s+.*?;\s*/gm, '');
    src = src.replace(/^"use client";\s*/gm, '');
    src = src.replace(/^'use client';\s*/gm, '');
    
    // Validate that code matches expected AI format
    // Should have: export default function Name({ values, setValue })
    const formatCheck = src.match(/export\s+default\s+function\s+\w+\s*\(\s*\{\s*values\s*,\s*setValue\s*\}\s*\)/);
    if (!formatCheck && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Code format check: Expected pattern "export default function Name({ values, setValue })"');
    }

    // Case 1: export default function Name
    const fnMatch = src.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
    if (fnMatch) {
      componentName = fnMatch[1];
      src = src.replace(/export\s+default\s+function\s+/m, "function ");
    } else {
      // Case 2: export default class Name
      const classMatch = src.match(/export\s+default\s+class\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        componentName = classMatch[1];
        src = src.replace(/export\s+default\s+class\s+/m, "class ");
      } else {
        // Case 3: export default Identifier;
        const idMatch = src.match(/export\s+default\s+([A-Za-z0-9_]+)\s*;?/);
        if (idMatch) {
          componentName = idMatch[1];
          src = src.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;?/m, "");
        }
      }
    }

    // Clean up the code - ensure proper syntax
    // Remove any trailing semicolons after closing brace
    src = src.replace(/^(\s*\}\s*);\s*$/m, '$1');
    
    // CRITICAL: Remove ALL whitespace text nodes from tables to prevent hydration errors
    // React doesn't allow whitespace (spaces, newlines, or JSX expressions like {" "}) 
    // between table elements: <table>, <thead>, <tbody>, <tr>, <th>, <td>
    
    // First, remove all JSX whitespace expressions like {" "}, {"\n"}, {' '}, etc.
    // This pattern matches: { followed by any whitespace/quotes, followed by }
    src = src.replace(/\{\s*["']\s*["']\s*\}/g, ''); // Remove {" "}, {' '}, etc.
    src = src.replace(/\{\s*"\\s*"\s*\}/g, ''); // Remove {"\s"}
    src = src.replace(/\{\s*"\\n*"\s*\}/g, ''); // Remove {"\n"}
    src = src.replace(/\{\s*["']\\n["']\s*\}/g, ''); // Remove {'\n'}
    
    // Remove whitespace expressions between specific table tag patterns
    // Pattern: tag>...whitespace...<nextTag -> tag><nextTag
    const aggressiveTableCleanup = [
      // Between opening tags
      /<table[^>]*>\s*<thead/g,
      /<table[^>]*>\s*<tbody/g,
      /<\/thead>\s*<tbody/g,
      /<thead[^>]*>\s*<tr/g,
      /<tbody[^>]*>\s*<tr/g,
      /<tr[^>]*>\s*<th/g,
      /<tr[^>]*>\s*<td/g,
      // Between closing/opening
      /<\/thead>\s*<\/thead/g,
      /<\/tbody>\s*<\/tbody/g,
      /<\/tr>\s*<tr/g,
      /<\/th>\s*<th/g,
      /<\/td>\s*<td/g,
      /<\/th>\s*<\/tr/g,
      /<\/td>\s*<\/tr/g,
      /<\/tr>\s*<\/tr/g,
      // Inside tags (whitespace between > and <)
      /<thead[^>]*>\s+</g,
      /<tbody[^>]*>\s+</g,
      /<\/thead>\s+</g,
      /<\/tbody>\s+</g,
      /<tr[^>]*>\s+<th/g,
      /<tr[^>]*>\s+<td/g,
      /<\/tr>\s+</g,
      /<\/th>\s+</g,
      /<\/td>\s+</g,
    ];
    
    // Apply aggressive cleanup multiple times
    for (let i = 0; i < 5; i++) {
      aggressiveTableCleanup.forEach((pattern) => {
        src = src.replace(pattern, (match) => {
          // Replace with tags directly adjacent
          if (pattern.source.includes('<table')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('</thead')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('<thead')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('<tbody')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('<tr')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('</tr')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('</th')) return match.replace(/\s+/g, '');
          if (pattern.source.includes('</td')) return match.replace(/\s+/g, '');
          return match.replace(/\s+/g, '');
        });
      });
      
      // Direct replacements for common patterns
      src = src.replace(/<table[^>]*>\s*<thead/g, '<table><thead');
      src = src.replace(/<\/thead>\s*<tbody/g, '</thead><tbody');
      src = src.replace(/<thead[^>]*>\s*<tr/g, '<thead><tr');
      src = src.replace(/<tbody[^>]*>\s*<tr/g, '<tbody><tr');
      src = src.replace(/<tr[^>]*>\s*<th/g, '<tr><th');
      src = src.replace(/<tr[^>]*>\s*<td/g, '<tr><td');
      src = src.replace(/<\/th>\s*<\/tr/g, '</th></tr');
      src = src.replace(/<\/td>\s*<\/tr/g, '</td></tr');
      src = src.replace(/<\/tr>\s*<\/tr/g, '</tr></tr');
    }
    
    // Final pass: Remove any remaining whitespace JSX expressions near table tags
    // Match: >...{" "}...< or >...{' '}...<
    src = src.replace(/>\s*\{\s*["']\s*["']\s*\}\s*</g, '><');
    src = src.replace(/>\s*\{\s*["']\s*\\n\s*["']\s*\}\s*</g, '><');
    src = src.replace(/>\s*\{\s*["']\s*\\s\s*["']\s*\}\s*</g, '><');
    
    // CRITICAL: Remove whitespace expressions that are direct children of table elements
    // Pattern: <thead>{...whitespace...}</thead> or <thead>...{" "}...</thead>
    src = src.replace(/<thead[^>]*>\s*\{\s*["']\s*["']\s*\}\s*<\/thead>/g, '<thead></thead>');
    src = src.replace(/<tbody[^>]*>\s*\{\s*["']\s*["']\s*\}\s*<\/tbody>/g, '<tbody></tbody>');
    src = src.replace(/<thead[^>]*>\s*\{\s*["']\s*\\n\s*["']\s*\}\s*<\/thead>/g, '<thead></thead>');
    src = src.replace(/<tbody[^>]*>\s*\{\s*["']\s*\\n\s*["']\s*\}\s*<\/tbody>/g, '<tbody></tbody>');
    
    // Also remove whitespace expressions between tags within thead/tbody
    // Pattern: <thead>...{" "}...<tr or <tbody>...{" "}...<tr
    src = src.replace(/<thead[^>]*>[^<]*\{\s*["']\s*["']\s*\}[^<]*<tr/g, '<thead><tr');
    src = src.replace(/<tbody[^>]*>[^<]*\{\s*["']\s*["']\s*\}[^<]*<tr/g, '<tbody><tr');
    
    // One more aggressive pass: find and remove any {" "} that appears between any table-related tags
    src = src.replace(/(<[\/]?(?:table|thead|tbody|tr|th|td)[^>]*>)\s*\{\s*["']\s*["']\s*\}\s*(<[\/]?(?:table|thead|tbody|tr|th|td)[^>]*>)/g, '$1$2');
    
    // Ensure code ends with closing brace (react-live needs complete function)
    if (!src.trim().endsWith('}')) {
      // Try to balance braces if needed
      const openBraces = (src.match(/\{/g) || []).length;
      const closeBraces = (src.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        console.warn(`⚠️ Unbalanced braces detected! Adding ${openBraces - closeBraces} closing brace(s)`);
        src += '\n' + ('}'.repeat(openBraces - closeBraces));
      }
    }

    // Check for incomplete JSX elements (unclosed tags)
    const openTags = (src.match(/<[A-Za-z][A-Za-z0-9]*[^>]*>/g) || []).length;
    const closeTags = (src.match(/<\/[A-Za-z][A-Za-z0-9]*>/g) || []).length;
    const selfClosingTags = (src.match(/<[A-Za-z][A-Za-z0-9]*[^>]*\/>/g) || []).length;
    
    // Check for orphan closing braces (smarter check)
    // The final closing brace of a function component on its own line is valid and expected
    // Only flag if there's an orphan brace mid-function that causes imbalance
    const lines = src.split('\n');
    
    // Find the last non-empty line (likely the function closing brace)
    let lastNonEmptyIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') {
        lastNonEmptyIndex = i;
        break;
      }
    }
    
    // Check all lines except the last one for orphan braces
    if (lastNonEmptyIndex >= 0) {
      const linesToCheck = lines.slice(0, lastNonEmptyIndex);
      for (const line of linesToCheck) {
        if (/^\s*\}\s*$/.test(line.trim())) {
          // Found an orphan brace before the last line - check if it causes imbalance
          const lineIndex = lines.indexOf(line);
          const upToThisLine = lines.slice(0, lineIndex + 1).join('\n');
          const openCount = (upToThisLine.match(/\{/g) || []).length;
          const closeCount = (upToThisLine.match(/\}/g) || []).length;
          
          // Only warn if this creates an imbalance (more closing than opening)
          if (closeCount > openCount) {
            console.warn('⚠️ Potential syntax issue: Found orphan closing brace that may cause imbalance. Check code completeness.');
            break; // Only warn once
          }
        }
      }
    }

    return `${src}\n\nrender(<${componentName} values={values} setValue={setValue} />);`;
  }, [code]);

  // Debug: Log transformed code and check for syntax errors
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Transformed code length:', transformed.length);
      console.log('Transformed code preview:', transformed.substring(0, 500));
      console.log('Transformed code end:', transformed.substring(transformed.length - 200));
      
      // Check for unmatched braces
      const openBraces = (transformed.match(/\{/g) || []).length;
      const closeBraces = (transformed.match(/\}/g) || []).length;
      console.log('Braces check - open:', openBraces, 'close:', closeBraces);
      
      // Check for unmatched parentheses
      const openParens = (transformed.match(/\(/g) || []).length;
      const closeParens = (transformed.match(/\)/g) || []).length;
      console.log('Parentheses check - open:', openParens, 'close:', closeParens);
    }
  }, [transformed]);

  // Check for incomplete code
  const hasOrphanClosingBrace = /^\s*\}\s*$/m.test(code);
  const hasIncompleteJSX = code.includes('onChange={(v)=>setValue(') && 
                           !code.includes('</li>') && 
                           code.trim().endsWith('}');

  return (
    <div className="w-full">
      {(hasOrphanClosingBrace || hasIncompleteJSX) && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ Incomplete Code Detected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The pasted code appears to be incomplete or truncated. This usually happens when:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Code was copied/pasted and got cut off</li>
                  <li>AI-generated code was not fully generated</li>
                  <li>JSX elements are not properly closed</li>
                </ul>
                <p className="mt-2 font-semibold">
                  Please ensure your code:
                </p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Is a complete React component</li>
                  <li>Has all opening tags closed (e.g., &lt;div&gt;...&lt;/div&gt;)</li>
                  <li>Ends with the component's closing brace</li>
                  <li>Doesn't have orphan closing braces on separate lines</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <LiveProvider code={transformed} scope={scope} noInline>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <LivePreview />
        </div>
        <div className="mt-3 min-h-[60px]">
          <LiveError className="text-sm text-red-600 font-mono bg-red-50 p-3 rounded border border-red-200 whitespace-pre-wrap" />
        </div>
      </LiveProvider>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
            🔍 Debug: View transformed code ({transformed.length} chars)
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-96 border border-gray-700">
            {transformed}
          </pre>
          <div className="mt-2 p-3 bg-blue-50 rounded text-xs text-blue-900">
            <strong>Original code length:</strong> {code.length} chars<br/>
            <strong>Transformed code length:</strong> {transformed.length} chars<br/>
            <strong>Open braces:</strong> {(transformed.match(/\{/g) || []).length}<br/>
            <strong>Close braces:</strong> {(transformed.match(/\}/g) || []).length}
          </div>
        </details>
      )}
    </div>
  );
}


