"use client";

import React, { useState, useEffect, useRef } from "react";

/**
 * Customizable Section Template Component
 * 
 * A flexible section component for displaying document sections with customizable:
 * - Title styling and hierarchy
 * - Content formatting
 * - Spacing and layout
 * - Decorative elements
 * - Typography
 */
export interface SectionTemplateProps {
  title?: string;
  content: string | React.ReactNode;
  type?: 'section' | 'day' | 'included' | 'excluded' | 'notes';
  
  // Editable Configuration
  editable?: boolean;
  onContentChange?: (newContent: string) => void;
  onTitleChange?: (newTitle: string) => void;
  
  // Title Configuration
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  titleClassName?: string;
  titleSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  titleColor?: string;
  titleWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  showTitle?: boolean;
  
  // Content Configuration
  contentClassName?: string;
  contentSize?: "xs" | "sm" | "base" | "lg" | "xl";
  contentColor?: string;
  contentAlignment?: "left" | "center" | "right" | "justify";
  preserveWhitespace?: boolean;
  parseParagraphs?: boolean;
  
  // Decorative Elements
  showUnderline?: boolean;
  underlineColor?: string;
  underlineWidth?: string;
  underlineGradient?: {
    from: string;
    to: string;
  };
  showDivider?: boolean;
  dividerPosition?: "top" | "bottom";
  
  // Spacing Configuration
  marginBottom?: string;
  padding?: string;
  titleMarginBottom?: string;
  contentMarginTop?: string;
  
  // Layout Configuration
  containerClassName?: string;
  backgroundColor?: string;
  border?: boolean;
  borderColor?: string;
  rounded?: boolean;
  shadow?: boolean;
  
  // Additional customization
  className?: string;
  style?: React.CSSProperties;
  
  // Text Splitting Configuration
  enableTextSplitting?: boolean;
}

const SectionTemplate: React.FC<SectionTemplateProps> = ({
  title,
  content,
  type = 'section',
  // Editable
  editable = true,
  onContentChange,
  onTitleChange,
  // Title
  titleLevel = 2,
  titleClassName = "",
  titleSize = "3xl",
  titleColor = "text-gray-900",
  titleWeight = "bold",
  showTitle = true,
  // Content
  contentClassName = "",
  contentSize = "base",
  contentColor = "text-gray-700",
  contentAlignment = "justify",
  preserveWhitespace = true,
  parseParagraphs = true,
  // Decorative
  showUnderline = true,
  underlineColor,
  underlineWidth = "w-20",
  underlineGradient,
  showDivider = false,
  dividerPosition = "bottom",
  // Spacing
  marginBottom = "mb-10",
  padding = "",
  titleMarginBottom = "mb-6",
  contentMarginTop = "",
  // Layout
  containerClassName = "",
  backgroundColor,
  border = false,
  borderColor = "border-gray-200",
  rounded = false,
  shadow = false,
  // Additional
  className = "",
  style,
  // Text Splitting
  enableTextSplitting = true,
}) => {
  // Text selection and splitting state
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [showSplitButton, setShowSplitButton] = useState(false);
  const [splitButtonPosition, setSplitButtonPosition] = useState({ top: 0, left: 0 });
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  // Detect text selection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && enableTextSplitting) {
          const selectedText = selection.toString().trim();
          console.log('Text selected:', selectedText);
          
          if (selectedText.length > 0) {
            setSelectedText(selectedText);
            
            try {
              const range = selection.getRangeAt(0);
              setSelectionRange(range.cloneRange());
              
              // Get position for split button (near selection)
              const rect = range.getBoundingClientRect();
              const containerRect = contentContainerRef.current?.getBoundingClientRect();
              
              if (containerRect) {
                setSplitButtonPosition({
                  top: rect.top - containerRect.top - 40,
                  left: rect.left - containerRect.left + rect.width / 2,
                });
                setShowSplitButton(true);
                console.log('Split button shown at:', { top: rect.top - containerRect.top - 40, left: rect.left - containerRect.left + rect.width / 2 });
              }
            } catch (err) {
              console.error('Error getting selection range:', err);
              setShowSplitButton(false);
            }
          } else {
            setShowSplitButton(false);
          }
        } else {
          setShowSplitButton(false);
        }
      }, 10);
    };
    
    // Also listen for selection changes
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        setShowSplitButton(false);
      }
    };
    
    if (enableTextSplitting && contentContainerRef.current) {
      const container = contentContainerRef.current;
      container.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectionchange', handleSelectionChange);
      
      return () => {
        container.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [enableTextSplitting]);
  
  // Handle text splitting
  const handleSplitText = () => {
    console.log('handleSplitText called', { selectedText, hasOnContentChange: !!onContentChange, isString: typeof content === 'string' });
    
    if (!selectedText) {
      console.log('No selected text');
      return;
    }
    
    if (typeof content !== 'string') {
      console.log('Content is not a string');
      return;
    }
    
    // Keep selected text as a single bullet item (don't split into words)
    // User selected a sentence/phrase, keep it together as one bullet point
    const trimmedText = selectedText.trim();
    
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // Convert selected text to a single bullet item on a new line
    const bulletItems = `\n• ${trimmedText}`;
    
    // If onContentChange is not provided, try fallback DOM update
    if (!onContentChange) {
      console.warn('onContentChange not provided - trying direct DOM update');
      // Try to update content directly if editable is true
      if (editable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          try {
            // Create a text node with the bullet items
            const textNode = document.createTextNode(bulletItems);
            range.deleteContents();
            range.insertNode(textNode);
            // Clear selection
            window.getSelection()?.removeAllRanges();
            setShowSplitButton(false);
            setSelectedText("");
            setSelectionRange(null);
            return;
          } catch (err) {
            console.error('Error updating DOM directly:', err);
          }
        }
      }
      // If we can't update, show warning but don't block
      console.warn('Cannot update content - onContentChange not provided and direct DOM update failed');
      setShowSplitButton(false);
      return;
    }
    
    // Get the current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    // Get text content from the container to find position
    const contentElement = contentContainerRef.current;
    if (!contentElement) return;
    
    // Create a range that covers all content before selection
    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(contentElement);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const textBefore = beforeRange.toString();
    
    // Find the position in the original content string
    // Use the text before selection to find exact position
    let position = -1;
    
    // Try to find position by matching text before selection
    // Match last portion of text before to avoid duplicates
    const beforeText = textBefore.trim();
    if (beforeText.length > 0) {
      // Find the last occurrence of the last part of beforeText in content
      const searchText = beforeText.slice(-Math.min(100, beforeText.length));
      const lastIndex = content.lastIndexOf(searchText);
      if (lastIndex !== -1) {
        position = lastIndex + searchText.length;
      }
    }
    
    // Fallback: find by selected text if position not found
    if (position === -1) {
      position = content.indexOf(selectedText);
    }
    
    let newContent = content;
    
    if (position !== -1) {
      // Replace selected text with bullet items
      newContent = 
        content.substring(0, position) + 
        bulletItems + 
        content.substring(position + selectedText.length);
    } else {
      // If we can't find exact position, try simple replace (first occurrence)
      newContent = content.replace(selectedText, bulletItems);
    }
    
    console.log('Updating content:', { oldLength: content.length, newLength: newContent.length, selectedText, bulletItems });
    
    // Update content
    onContentChange(newContent);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowSplitButton(false);
    setSelectedText("");
    setSelectionRange(null);
  };
  
  // Determine heading tag
  const HeadingTag = `h${titleLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  // Build title classes - Compact for perfect UI
  const titleClasses = [
    "text-sm",
    `font-${titleWeight}`,
    titleColor,
    titleMarginBottom || "mb-3",
    "tracking-tight",
    titleClassName,
  ].filter(Boolean).join(" ");

  // Build content classes - Compact text
  const contentClasses = [
    contentClassName,
    "text-sm",
    contentColor,
    `text-${contentAlignment}`,
    "leading-snug",
    preserveWhitespace && "whitespace-pre-wrap",
    contentMarginTop,
  ].filter(Boolean).join(" ");

  // Build container classes with type-based styling - Clean borders like design
  const getSectionClasses = () => {
    const baseClasses = [
      "section-template",
      "mb-5",
      "last:mb-0",
      containerClassName,
      className,
    ];

    // Type-specific styling - Clean bordered sections
    // Use inline styles for colors to avoid lab() conversion issues in PDF export
    if (type === 'day') {
      baseClasses.push("border-2 rounded-lg p-4 bg-white");
      // Border color will be set via inline style
    } else if (type === 'included' || type === 'excluded') {
      baseClasses.push("border-2 border-blue-400 rounded-lg p-4 bg-white");
    } else if (backgroundColor && !backgroundColor.startsWith("bg-")) {
      baseClasses.push("border border-gray-200 rounded-lg p-4");
    } else if (backgroundColor) {
      baseClasses.push(backgroundColor, "border border-gray-200 rounded-lg p-4");
    } else {
      // Default clean section with subtle border
      baseClasses.push("border border-gray-200 rounded-lg p-4 bg-white");
    }

    if (border && !baseClasses.some(c => c.includes('border-'))) {
      baseClasses.push(`border ${borderColor}`);
    }
    if (shadow) baseClasses.push("shadow-md");

    return baseClasses.filter(Boolean).join(" ");
  };

  const containerClasses = getSectionClasses();

  // Build underline classes - use inline style for gradient to avoid lab() colors
  const underlineClasses = [
    "h-1",
    underlineWidth,
    "rounded-full",
  ].filter(Boolean).join(" ");
  
  // Get underline style (use inline style to avoid lab() colors in PDF export)
  const getUnderlineStyle = (): React.CSSProperties => {
    if (underlineGradient) {
      return {
        background: `linear-gradient(to right, ${underlineGradient.from}, ${underlineGradient.to})`
      };
    } else if (underlineColor) {
      return { backgroundColor: underlineColor };
    } else {
      // Default gradient using RGB colors
      return {
        background: 'linear-gradient(to right, #A4C639, #8FB02E)'
      };
    }
  };

  // Format content with bullet points and line breaks - Enhanced for our JSON structure
  const renderContent = () => {
    if (typeof content === "string") {
      if (parseParagraphs) {
        // First, check if content has bullet points (•, -, *, or numbered lists)
        const hasBullets = content.includes('•') || /^[\s]*[\-\*]|^\d+\./m.test(content);
        
        if (hasBullets) {
          // For bullet content, split by single newlines to get individual items
          const lines = content.split(/\n/).filter(line => line.trim());
          
          if (lines.length === 0) return null;
          
          // Group consecutive bullet items together
          const items: string[] = [];
          let currentItem = '';
          
          for (const line of lines) {
            const trimmed = line.trim();
            // Check if this line starts a new bullet item
            if (/^[\s]*[•\-\*]|^\d+\./.test(trimmed)) {
              // Save previous item if exists
              if (currentItem) {
                items.push(currentItem);
              }
              // Start new item
              currentItem = trimmed;
            } else if (trimmed && currentItem) {
              // Continue current item (wrapped text)
              currentItem += ' ' + trimmed;
            } else if (trimmed) {
              // Standalone line without bullet
              items.push(trimmed);
            }
          }
          
          // Add last item
          if (currentItem) {
            items.push(currentItem);
          }
          
          return (
            <div className="content">
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {items.map((item, index) => {
                  // Remove bullet markers and clean
                  const cleanItem = item
                    .replace(/^[\s]*[•\-\*]\s*/, "")
                    .replace(/^\d+\.\s*/, "")
                    .trim();
                  
                  if (!cleanItem) return null;
                  
                  return (
                    <li 
                      key={index} 
                      className="text-sm leading-snug" 
                      style={{ fontSize: '11px', lineHeight: '1.4' }}
                      contentEditable={editable}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        if (editable && onContentChange) {
                          // Get all list items and reconstruct content
                          const ul = e.currentTarget.parentElement;
                          if (ul) {
                            const items = Array.from(ul.children).map((li) => `• ${li.textContent}`).join('\n');
                            onContentChange(items);
                          }
                        }
                      }}
                    >
                      {cleanItem}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        } else {
          // For non-bullet content, split by double newlines for paragraphs
          const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
          
          if (paragraphs.length === 0) return null;
          
          return (
            <div className="content">
              {paragraphs.map((paragraph, pIndex) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                
                // If paragraph has single newlines, split into multiple paragraphs
                if (trimmed.includes('\n') && !hasBullets) {
                  return (
                    <div key={pIndex} className="mb-2 last:mb-0">
                      {trimmed.split(/\n/).filter(p => p.trim()).map((p, idx) => (
                        <p 
                          key={idx} 
                          className="mb-1 last:mb-0 text-sm leading-snug text-gray-700" 
                          style={{ fontSize: '11px', lineHeight: '1.4' }}
                          contentEditable={editable}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            if (editable && onContentChange) {
                              onContentChange(e.currentTarget.textContent || '');
                            }
                          }}
                        >
                          {p.trim()}
                        </p>
                      ))}
                    </div>
                  );
                }
                
                // Regular paragraph
                return (
                  <p
                    key={pIndex}
                    className="mb-2 last:mb-0 text-sm leading-snug text-gray-700"
                    style={{ fontSize: '11px', lineHeight: '1.4' }}
                    contentEditable={editable}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      if (editable && onContentChange) {
                        onContentChange(e.currentTarget.textContent || '');
                      }
                    }}
                  >
                    {trimmed}
                  </p>
                );
              })}
            </div>
          );
        }
      }
      // If parseParagraphs is false, preserve whitespace
      return (
        <div 
          className={preserveWhitespace ? "whitespace-pre-wrap leading-snug" : ""} 
          style={{ fontSize: '11px', lineHeight: '1.4' }}
          contentEditable={editable}
          suppressContentEditableWarning={true}
          onBlur={(e) => {
            if (editable && onContentChange) {
              onContentChange(e.currentTarget.textContent || '');
            }
          }}
        >
          {content}
        </div>
      );
    }
    return (
      <div 
        className="content"
        contentEditable={editable}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          if (editable && onContentChange) {
            onContentChange(e.currentTarget.textContent || '');
          }
        }}
      >
        {content}
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    ...(backgroundColor && !backgroundColor.startsWith("bg-") && { backgroundColor }),
    ...style,
    // Add border color for day type sections using inline style to avoid lab() colors
    ...(type === 'day' && { borderColor: '#A4C639' }),
  };

  return (
    <section className={containerClasses} style={containerStyle}>
      {/* Top Divider */}
      {showDivider && dividerPosition === "top" && (
        <div className={`border-t ${borderColor} mb-6`} />
      )}

      {/* Section Title */}
      {showTitle && title && (
        <div className="mb-3">
          <h2 
            className={titleClasses} 
            style={{ fontSize: '13px', lineHeight: '1.3' }}
            contentEditable={editable}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              if (editable && onTitleChange) {
                onTitleChange(e.currentTarget.textContent || '');
              }
            }}
          >
            {title}
          </h2>
          {/* Thin decorative line matching the design */}
          <div 
            className="h-0.5 w-12 mt-1" 
            style={{ backgroundColor: '#A4C639' }}
          ></div>
        </div>
      )}

      {/* Section Content */}
      <div 
        ref={contentContainerRef}
        className={`${contentClasses} relative`}
        onMouseLeave={() => {
          // Hide split button when mouse leaves content area
          setTimeout(() => {
            if (!window.getSelection()?.toString().trim()) {
              setShowSplitButton(false);
            }
          }, 100);
        }}
      >
        {renderContent()}
        
        {/* Split Text Button - Appears when text is selected */}
        {/* Hide during PDF export to avoid color parsing issues */}
        {enableTextSplitting && showSplitButton && selectedText && !document.querySelector('.pdf-exporting') && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSplitText();
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
            className="absolute z-50 p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer no-pdf-export"
            style={{
              top: `${Math.max(0, splitButtonPosition.top)}px`,
              left: `${splitButtonPosition.left}px`,
              transform: 'translateX(-50%)',
              backgroundColor: '#A4C639', // Use inline style instead of Tailwind class to avoid lab() colors
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8FB02E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#A4C639';
            }}
            title="Split into bullet points"
            aria-label="Split selected text into bullet points"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Split</span>
          </button>
        )}
      </div>

      {/* Bottom Divider */}
      {showDivider && dividerPosition === "bottom" && (
        <div className={`border-t ${borderColor} mt-6`} />
      )}
    </section>
  );
};

export default SectionTemplate;

