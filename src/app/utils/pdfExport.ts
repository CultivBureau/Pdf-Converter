/**
 * PDF Export Utility using html2pdf.js
 * 
 * Better than html2canvas + jsPDF because:
 * - Automatic page breaks
 * - Better quality
 * - Simpler API
 * - Better multi-page handling
 */

import html2pdf from 'html2pdf.js';

export interface PDFExportOptions {
  /**
   * Page format: 'a4', 'letter', or custom [width, height] in mm
   */
  format?: 'a4' | 'letter' | [number, number];
  
  /**
   * Page orientation
   */
  orientation?: 'portrait' | 'landscape';
  
  /**
   * Margins in mm
   */
  margin?: number | [number, number, number, number];
  
  /**
   * Image quality (0-1)
   */
  image?: {
    type?: 'jpeg' | 'png';
    quality?: number;
  };
  
  /**
   * HTML2Canvas options
   */
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
    width?: number;
    height?: number;
  };
  
  /**
   * jsPDF options
   */
  jsPDF?: {
    unit?: 'mm' | 'pt' | 'px' | 'in';
    format?: string | [number, number];
    orientation?: 'portrait' | 'landscape';
  };
  
  /**
   * Enable page breaks
   */
  enableLinks?: boolean;
  
  /**
   * Page break mode
   */
  pagebreak?: {
    mode?: 'avoid-all' | 'css' | 'legacy';
    before?: string;
    after?: string;
    avoid?: string;
  };
}

const defaultOptions: PDFExportOptions = {
  format: 'a4',
  orientation: 'portrait',
  margin: 10,
  image: {
    type: 'png',
    quality: 0.98,
  },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    // Note: onclone will be added in error handler if needed
    // to avoid issues with unsupported color functions
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  },
  enableLinks: true,
  pagebreak: {
    mode: 'avoid-all',
  },
};

/**
 * Export HTML element to PDF using html2pdf.js
 * 
 * @param element - HTML element to export
 * @param filename - Output filename (without .pdf extension)
 * @param options - Export options
 * @returns Promise that resolves when PDF is generated
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string = 'document',
  options: PDFExportOptions = {}
): Promise<void> {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    image: {
      ...defaultOptions.image,
      ...options.image,
    },
    html2canvas: {
      ...defaultOptions.html2canvas,
      ...options.html2canvas,
    },
    jsPDF: {
      ...defaultOptions.jsPDF,
      ...options.jsPDF,
      format: options.format || defaultOptions.format,
      orientation: options.orientation || defaultOptions.orientation,
    },
    pagebreak: {
      ...defaultOptions.pagebreak,
      ...options.pagebreak,
    },
  };

  try {
    // CRITICAL: Remove all lab() colors from the document BEFORE html2pdf processes it
    // html2pdf parses CSS during html2canvas phase, which happens before onclone
    // So we must clean the source element first
    const sourceElement = element.cloneNode(true) as HTMLElement;
    
    // Remove all style tags with lab() colors from source
    const sourceStyleTags = sourceElement.querySelectorAll('style');
    sourceStyleTags.forEach((style: HTMLStyleElement) => {
      if (style.textContent && (
        style.textContent.includes('lab(') ||
        style.textContent.includes('lch(') ||
        style.textContent.includes('oklab(') ||
        style.textContent.includes('oklch(')
      )) {
        style.remove();
      }
    });
    
    // Remove lab() colors from all inline styles in source
    const sourceAllElements = sourceElement.querySelectorAll('*');
    sourceAllElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('lab(') || inlineStyle.includes('lch(') || inlineStyle.includes('oklab(') || inlineStyle.includes('oklch('))) {
          const cleaned = inlineStyle
            .replace(/[^:]*lab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*lch\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklch\([^)]*\)[^;]*;?/gi, '');
          if (cleaned.trim()) {
            el.setAttribute('style', cleaned);
          } else {
            el.removeAttribute('style');
          }
        }
      }
    });
    
    // Configure html2pdf - NO browser dialogs, direct download
    const opt = {
      margin: mergedOptions.margin,
      filename: `${filename}.pdf`,
      image: mergedOptions.image,
      html2canvas: mergedOptions.html2canvas,
      jsPDF: mergedOptions.jsPDF,
      enableLinks: mergedOptions.enableLinks,
      pagebreak: mergedOptions.pagebreak,
    };

    // Convert colors to RGB and remove unsupported color functions
    // Helper function to convert any color format to RGB hex
    const convertColorToRGB = (color: string): string => {
      if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
        return color;
      }
      
      // If it contains unsupported color functions, return fallback
      if (color.includes('lab(') || color.includes('lch(') || color.includes('oklab(')) {
        return '#000000'; // Default fallback
      }
      
      // If already RGB/RGBA/hex, return as is
      if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('rgba')) {
        return color;
      }
      
      // Try to convert named colors or other formats
      // Create a temporary element to get computed color
      const tempEl = document.createElement('div');
      tempEl.style.color = color;
      document.body.appendChild(tempEl);
      const computed = window.getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      
      // Check if computed color is valid
      if (computed && !computed.includes('lab(') && !computed.includes('lch(') && !computed.includes('oklab(')) {
        return computed;
      }
      
      return '#000000'; // Fallback
    };
    
    const convertColorsToRGB = (el: HTMLElement) => {
      try {
        const computed = window.getComputedStyle(el);
        
        // Convert background colors to static RGB
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && computed.backgroundColor !== 'transparent') {
          const bgColor = convertColorToRGB(computed.backgroundColor);
          el.style.backgroundColor = bgColor;
        }
        
        // Convert text colors to static RGB
        if (computed.color) {
          const textColor = convertColorToRGB(computed.color);
          el.style.color = textColor;
        }
        
        // Convert border colors to static RGB
        if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
          const borderColor = convertColorToRGB(computed.borderColor);
          el.style.borderColor = borderColor;
        }
        
        // Also check border-top, border-right, border-bottom, border-left
        ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
          const borderColor = (computed as any)[prop];
          if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
            const converted = convertColorToRGB(borderColor);
            (el.style as any)[prop] = converted;
          }
        });
        
        // Recursively process all children
        Array.from(el.children).forEach(child => {
          if (child instanceof HTMLElement) {
            convertColorsToRGB(child);
          }
        });
      } catch (err) {
        // Ignore errors for individual elements
        console.warn('Error converting colors for element:', err);
      }
    };

    // Clone the pre-cleaned element (already has lab() colors removed)
    const clonedElement = sourceElement.cloneNode(true) as HTMLElement;
    
    // Hide interactive elements that might cause issues (like split buttons)
    const interactiveElements = clonedElement.querySelectorAll('.no-pdf-export, [class*="split"], button[title*="Split"]');
    interactiveElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none';
      }
    });
    
    // Convert all colors to RGB BEFORE html2pdf processes
    convertColorsToRGB(clonedElement);

    // Remove ALL style tags that might contain lab() colors BEFORE export
    // This is critical - html2pdf parses CSS before onclone runs
    const styleTags = clonedElement.querySelectorAll('style');
    styleTags.forEach((style: HTMLStyleElement) => {
      if (style.textContent && (
        style.textContent.includes('lab(') ||
        style.textContent.includes('lch(') ||
        style.textContent.includes('oklab(') ||
        style.textContent.includes('oklch(')
      )) {
        style.remove();
      }
    });
    
    // Also remove any inline styles with lab() colors
    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        // Check inline style attribute
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('lab(') || inlineStyle.includes('lch(') || inlineStyle.includes('oklab('))) {
          // Remove lab() colors from inline style
          const cleanedStyle = inlineStyle
            .replace(/[^:]*lab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*lch\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklch\([^)]*\)[^;]*;?/gi, '');
          el.setAttribute('style', cleanedStyle);
        }
      }
    });

    // Generate PDF blob with onclone to fix computed styles
    const pdfBlob: Blob = await html2pdf()
      .set({
        ...opt,
        html2canvas: {
          ...opt.html2canvas,
          onclone: (clonedDoc: Document) => {
            // Helper to safely convert any color to RGB
            const safeColorToRGB = (color: string, fallback: string = '#000000'): string => {
              if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
                return color || fallback;
              }
              // Check for unsupported color functions
              if (color.includes('lab(') || color.includes('lch(') || color.includes('oklab(') || color.includes('oklch(')) {
                return fallback;
              }
              // If already RGB/RGBA/hex, return as is
              if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('rgba')) {
                return color;
              }
              // Try to get computed color
              try {
                const temp = clonedDoc.createElement('div');
                temp.style.color = color;
                clonedDoc.body.appendChild(temp);
                const computed = clonedDoc.defaultView?.getComputedStyle(temp);
                clonedDoc.body.removeChild(temp);
                if (computed && computed.color && !computed.color.includes('lab(') && !computed.color.includes('lch(')) {
                  return computed.color;
                }
              } catch (e) {
                // Ignore
              }
              return fallback;
            };
            
            // Hide interactive elements first (like split buttons)
            const interactiveElements = clonedDoc.querySelectorAll('.no-pdf-export, [class*="split"], button[title*="Split"]');
            interactiveElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
              }
            });
            
            // Fix all elements' computed styles - convert ALL colors to RGB
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                try {
                  const computed = clonedDoc.defaultView?.getComputedStyle(el);
                  if (computed) {
                    // Background color
                    const bgColor = computed.backgroundColor;
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                      el.style.backgroundColor = safeColorToRGB(bgColor, '#ffffff');
                    }
                    
                    // Text color
                    const textColor = computed.color;
                    if (textColor) {
                      el.style.color = safeColorToRGB(textColor, '#000000');
                    }
                    
                    // Border colors
                    const borderColor = computed.borderColor;
                    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                      el.style.borderColor = safeColorToRGB(borderColor, '#e5e7eb');
                    }
                    
                    // Individual border colors
                    ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
                      const color = (computed as any)[prop];
                      if (color && color !== 'rgba(0, 0, 0, 0)') {
                        (el.style as any)[prop] = safeColorToRGB(color, '#e5e7eb');
                      }
                    });
                  }
                } catch (e) {
                  // Safe fallback - set default colors to prevent errors
                  try {
                    if (!el.style.backgroundColor) el.style.backgroundColor = '#ffffff';
                    if (!el.style.color) el.style.color = '#000000';
                    if (!el.style.borderColor) el.style.borderColor = '#e5e7eb';
                  } catch (err) {
                    // Ignore
                  }
                }
              }
            });
          },
        },
      })
      .from(clonedElement)
      .outputPdf('blob');

    // Create download link and trigger download programmatically
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to export PDF. Please try again.'
    );
  }
}

/**
 * Generate PDF blob for preview (without downloading)
 * 
 * @param element - HTML element to export
 * @param options - Export options
 * @returns Promise that resolves with blob URL
 */
export async function generatePDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<string> {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    image: {
      ...defaultOptions.image,
      ...options.image,
    },
    html2canvas: {
      ...defaultOptions.html2canvas,
      ...options.html2canvas,
    },
    jsPDF: {
      ...defaultOptions.jsPDF,
      ...options.jsPDF,
      format: options.format || defaultOptions.format,
      orientation: options.orientation || defaultOptions.orientation,
    },
    pagebreak: {
      ...defaultOptions.pagebreak,
      ...options.pagebreak,
    },
  };

  try {
    const opt = {
      margin: mergedOptions.margin,
      image: mergedOptions.image,
      html2canvas: mergedOptions.html2canvas,
      jsPDF: mergedOptions.jsPDF,
      enableLinks: mergedOptions.enableLinks,
      pagebreak: mergedOptions.pagebreak,
    };

    // Convert colors to RGB and remove unsupported color functions
    const convertColorsToRGB = (el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const bgColor = computed.backgroundColor;
        if (!bgColor.includes('lab(') && !bgColor.includes('lch(') && !bgColor.includes('oklab(')) {
          el.style.backgroundColor = bgColor;
        } else {
          el.style.backgroundColor = '#ffffff';
        }
      }
      
      if (computed.color) {
        const textColor = computed.color;
        if (!textColor.includes('lab(') && !textColor.includes('lch(') && !textColor.includes('oklab(')) {
          el.style.color = textColor;
        } else {
          el.style.color = '#000000';
        }
      }
      
      if (computed.borderColor) {
        const borderColor = computed.borderColor;
        if (!borderColor.includes('lab(') && !borderColor.includes('lch(') && !borderColor.includes('oklab(')) {
          el.style.borderColor = borderColor;
        } else {
          el.style.borderColor = '#e5e7eb';
        }
      }
      
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          convertColorsToRGB(child);
        }
      });
    };

    const clonedElement = element.cloneNode(true) as HTMLElement;
    convertColorsToRGB(clonedElement);

    // Remove ALL style tags that might contain lab() colors BEFORE export
    // This is critical - html2pdf parses CSS before onclone runs
    const styleTags = clonedElement.querySelectorAll('style');
    styleTags.forEach((style: HTMLStyleElement) => {
      if (style.textContent && (
        style.textContent.includes('lab(') ||
        style.textContent.includes('lch(') ||
        style.textContent.includes('oklab(') ||
        style.textContent.includes('oklch(')
      )) {
        style.remove();
      }
    });
    
    // Also remove any inline styles with lab() colors
    const allElementsPre = clonedElement.querySelectorAll('*');
    allElementsPre.forEach((el) => {
      if (el instanceof HTMLElement) {
        // Check inline style attribute
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('lab(') || inlineStyle.includes('lch(') || inlineStyle.includes('oklab(') || inlineStyle.includes('oklch('))) {
          // Remove lab() colors from inline style
          const cleanedStyle = inlineStyle
            .replace(/[^:]*lab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*lch\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklab\([^)]*\)[^;]*;?/gi, '')
            .replace(/[^:]*oklch\([^)]*\)[^;]*;?/gi, '');
          if (cleanedStyle.trim()) {
            el.setAttribute('style', cleanedStyle);
          } else {
            el.removeAttribute('style');
          }
        }
      }
    });

    // Generate PDF as blob with onclone to fix computed styles
    const pdfBlob: Blob = await html2pdf()
      .set({
        ...opt,
        html2canvas: {
          ...opt.html2canvas,
          onclone: (clonedDoc: Document) => {
            // Fix all elements' computed styles
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                try {
                  const computed = clonedDoc.defaultView?.getComputedStyle(el);
                  if (computed) {
                    const bgColor = computed.backgroundColor;
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                      if (bgColor.includes('lab(') || bgColor.includes('lch(') || bgColor.includes('oklab(')) {
                        el.style.backgroundColor = '#ffffff';
                      } else {
                        el.style.backgroundColor = bgColor;
                      }
                    }
                    
                    const textColor = computed.color;
                    if (textColor) {
                      if (textColor.includes('lab(') || textColor.includes('lch(') || textColor.includes('oklab(')) {
                        el.style.color = '#000000';
                      } else {
                        el.style.color = textColor;
                      }
                    }
                    
                    const borderColor = computed.borderColor;
                    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                      if (borderColor.includes('lab(') || borderColor.includes('lch(') || borderColor.includes('oklab(')) {
                        el.style.borderColor = '#e5e7eb';
                      } else {
                        el.style.borderColor = borderColor;
                      }
                    }
                  }
                } catch (e) {
                  // Safe fallback
                }
              }
            });
          },
        },
      })
      .from(clonedElement)
      .outputPdf('blob');

    // Create blob URL
    const url = URL.createObjectURL(pdfBlob);
    return url;
  } catch (error) {
    console.error('PDF blob generation error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to generate PDF preview. Please try again.'
    );
  }
}

/**
 * Export with progress callback
 * 
 * @param element - HTML element to export
 * @param filename - Output filename
 * @param options - Export options
 * @param onProgress - Progress callback (0-100)
 * @returns Promise that resolves when PDF is generated
 */
export async function exportToPDFWithProgress(
  element: HTMLElement,
  filename: string = 'document',
  options: PDFExportOptions = {},
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    onProgress?.(10);

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      image: {
        ...defaultOptions.image,
        ...options.image,
      },
      html2canvas: {
        ...defaultOptions.html2canvas,
        ...options.html2canvas,
      },
      jsPDF: {
        ...defaultOptions.jsPDF,
        ...options.jsPDF,
        format: options.format || defaultOptions.format,
        orientation: options.orientation || defaultOptions.orientation,
      },
      pagebreak: {
        ...defaultOptions.pagebreak,
        ...options.pagebreak,
      },
    };

    onProgress?.(30);

    const opt = {
      margin: mergedOptions.margin,
      filename: `${filename}.pdf`,
      image: mergedOptions.image,
      html2canvas: mergedOptions.html2canvas,
      jsPDF: mergedOptions.jsPDF,
      enableLinks: mergedOptions.enableLinks,
      pagebreak: mergedOptions.pagebreak,
    };

    onProgress?.(50);

    // Convert colors to RGB and remove unsupported color functions
    const convertColorsToRGB = (el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const bgColor = computed.backgroundColor;
        if (!bgColor.includes('lab(') && !bgColor.includes('lch(') && !bgColor.includes('oklab(')) {
          el.style.backgroundColor = bgColor;
        } else {
          el.style.backgroundColor = '#ffffff';
        }
      }
      
      if (computed.color) {
        const textColor = computed.color;
        if (!textColor.includes('lab(') && !textColor.includes('lch(') && !textColor.includes('oklab(')) {
          el.style.color = textColor;
        } else {
          el.style.color = '#000000';
        }
      }
      
      if (computed.borderColor) {
        const borderColor = computed.borderColor;
        if (!borderColor.includes('lab(') && !borderColor.includes('lch(') && !borderColor.includes('oklab(')) {
          el.style.borderColor = borderColor;
        } else {
          el.style.borderColor = '#e5e7eb';
        }
      }
      
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          convertColorsToRGB(child);
        }
      });
    };

    const clonedElement = element.cloneNode(true) as HTMLElement;
    convertColorsToRGB(clonedElement);

    onProgress?.(60);

    // Generate PDF blob with aggressive onclone to fix all color issues
    const pdfBlob: Blob = await html2pdf()
      .set({
        ...opt,
        html2canvas: {
          ...opt.html2canvas,
          onclone: (clonedDoc: Document, element: HTMLElement) => {
            // Remove stylesheets with lab() colors - iterate backwards
            try {
              const stylesheets = Array.from(clonedDoc.styleSheets);
              stylesheets.forEach((sheet) => {
                try {
                  if (sheet.cssRules) {
                    const rules = Array.from(sheet.cssRules);
                    for (let i = rules.length - 1; i >= 0; i--) {
                      const rule = rules[i];
                      if (rule instanceof CSSStyleRule) {
                        const styleText = rule.style.cssText;
                        if (styleText && (
                          styleText.includes('lab(') ||
                          styleText.includes('lch(') ||
                          styleText.includes('oklab(')
                        )) {
                          try {
                            sheet.deleteRule(i);
                          } catch (e) {}
                        }
                      }
                    }
                  }
                } catch (e) {}
              });
            } catch (e) {}

            // Add global style override
            const globalStyle = clonedDoc.createElement('style');
            globalStyle.textContent = `* { color: inherit !important; background-color: inherit !important; border-color: inherit !important; }`;
            clonedDoc.head.appendChild(globalStyle);

            // Fix all elements
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                try {
                  const computed = clonedDoc.defaultView?.getComputedStyle(el);
                  if (computed) {
                    const bgColor = computed.backgroundColor;
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                      if (bgColor.includes('lab(') || bgColor.includes('lch(') || bgColor.includes('oklab(')) {
                        el.style.backgroundColor = '#ffffff';
                      } else {
                        el.style.backgroundColor = bgColor;
                      }
                    }
                    
                    const textColor = computed.color;
                    if (textColor) {
                      if (textColor.includes('lab(') || textColor.includes('lch(') || textColor.includes('oklab(')) {
                        el.style.color = '#000000';
                      } else {
                        el.style.color = textColor;
                      }
                    }
                    
                    const borderColor = computed.borderColor;
                    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
                      if (borderColor.includes('lab(') || borderColor.includes('lch(') || borderColor.includes('oklab(')) {
                        el.style.borderColor = '#e5e7eb';
                      } else {
                        el.style.borderColor = borderColor;
                      }
                    }
                  }
                } catch (e) {
                  // Safe fallback
                }
              }
            });
          },
        },
      })
      .from(clonedElement)
      .outputPdf('blob');

    onProgress?.(80);

    // Create download link and trigger download programmatically
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);

    onProgress?.(100);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to export PDF. Please try again.'
    );
  }
}

