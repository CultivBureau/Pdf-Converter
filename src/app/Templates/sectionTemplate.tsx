"use client";

import React, { useState, useEffect, useRef } from "react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

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
  onDelete?: () => void;
  onAddAfter?: () => void;
  
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
  onDelete,
  onAddAfter,
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
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
    if (type === 'day') {
      baseClasses.push("border-2 border-[#A4C639] rounded-lg p-4 bg-white");
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

  // Detect text selection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim() && enableTextSplitting) {
          const selectedText = selection.toString().trim();
          
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
    if (!selectedText) {
      return;
    }
    
    if (typeof content !== 'string') {
      return;
    }
    
    const trimmedText = selectedText.trim();
    
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // Simple splitting: entire selected text becomes a new line with bullet
    // Add newline before bullet so it appears on a new line
    const replacementText = `\n• ${trimmedText}`;
    
    // Get the current selection and range
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const contentElement = contentContainerRef.current;
    if (!contentElement) return;
    
    // Helper function to extract text from range while preserving newlines properly
    const extractTextFromRange = (range: Range): string => {
      const clone = range.cloneContents();
      let text = '';
      
      // Walk through cloned nodes and extract text, converting block elements to \n
      const walkNodes = (node: Node, parentTag?: string) => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toUpperCase();
          
          // Skip elements with no-pdf-export class (like Split/Bold buttons)
          if (element.classList && element.classList.contains('no-pdf-export')) {
            return;
          }
          
          // Handle block-level elements that create line breaks
          if (tagName === 'BR') {
            text += '\n';
          } else if (tagName === 'LI') {
            // For list items, add newline BEFORE if not first item
            if (text.length > 0 && !text.endsWith('\n')) {
              text += '\n';
            }
            
            // Process children to get the content
            for (let i = 0; i < element.childNodes.length; i++) {
              walkNodes(element.childNodes[i], tagName);
            }
            
            // DON'T add newline after - it will be added by the next LI
          } else if (['DIV', 'P'].includes(tagName)) {
            // For DIV and P, add newline before content if not first element
            if (text.length > 0 && !text.endsWith('\n')) {
              text += '\n';
            }
            
            // Process children
            for (let i = 0; i < element.childNodes.length; i++) {
              walkNodes(element.childNodes[i], tagName);
            }
          } else {
            // For other elements (UL, OL, SPAN, STRONG, etc.), just process children
            for (let i = 0; i < element.childNodes.length; i++) {
              walkNodes(element.childNodes[i], tagName);
            }
          }
        } else {
          // Walk through child nodes for other node types
          for (let i = 0; i < node.childNodes.length; i++) {
            walkNodes(node.childNodes[i], parentTag);
          }
        }
      };
      
      walkNodes(clone);
      return text;
    };
    
    // Create a range from start of content to start of selection
    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(contentElement);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const textBefore = extractTextFromRange(beforeRange);
    
    // Create a range from end of selection to end of content
    const afterRange = document.createRange();
    afterRange.selectNodeContents(contentElement);
    afterRange.setStart(range.endContainer, range.endOffset);
    const textAfter = extractTextFromRange(afterRange);
    
    // Combine: text before + replacement (with newline and bullet) + text after
    // replacementText already contains "\n• " prefix
    const newContent = textBefore + replacementText + textAfter;
    
    // Update content - only plain text with bullet, no HTML
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowSplitButton(false);
    setSelectedText("");
    setSelectionRange(null);
  };

  // Handle bold text formatting
  const handleBoldText = () => {
    if (!selectedText) {
      return;
    }
    
    if (typeof content !== 'string') {
      return;
    }
    
    const trimmedText = selectedText.trim();
    
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // Check if text is already bold (wrapped in **)
    const isBold = trimmedText.startsWith('**') && trimmedText.endsWith('**');
    
    let replacementText: string;
    let searchText: string;
    
    if (isBold) {
      // Remove bold markers
      replacementText = trimmedText.slice(2, -2);
      searchText = trimmedText;
    } else {
      // Add bold markers using markdown-style ** **
      replacementText = `**${trimmedText}**`;
      searchText = trimmedText;
    }
    
    // Simple string replacement in the content
    const newContent = content.replace(searchText, replacementText);
    
    // Update content
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowSplitButton(false);
    setSelectedText("");
    setSelectionRange(null);
  };

  // Handle underline text formatting
  const handleUnderlineText = () => {
    if (!selectedText) {
      return;
    }
    
    if (typeof content !== 'string') {
      return;
    }
    
    const trimmedText = selectedText.trim();
    
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // Check if text is already underlined (wrapped in __)
    const isUnderlined = trimmedText.startsWith('__') && trimmedText.endsWith('__');
    
    let replacementText: string;
    let searchText: string;
    
    if (isUnderlined) {
      // Remove underline markers
      replacementText = trimmedText.slice(2, -2);
      searchText = trimmedText;
    } else {
      // Add underline markers using __ __
      replacementText = `__${trimmedText}__`;
      searchText = trimmedText;
    }
    
    // Simple string replacement in the content
    const newContent = content.replace(searchText, replacementText);
    
    // Update content
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowSplitButton(false);
    setSelectedText("");
    setSelectionRange(null);
  };

  // Build underline classes
  const underlineClasses = [
    "h-1",
    underlineWidth,
    "rounded-full",
    underlineGradient
      ? `bg-gradient-to-r from-[${underlineGradient.from}] to-[${underlineGradient.to}]`
      : underlineColor
      ? `bg-[${underlineColor}]`
      : "bg-gradient-to-r from-[#A4C639] to-[#8FB02E]",
  ].filter(Boolean).join(" ");

  // Helper function to check if content contains HTML
  const hasHTML = (text: string): boolean => {
    return /<[^>]+>/.test(text);
  };

  // Helper function to extract text from HTML for bullet reconstruction
  const extractTextFromHTML = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  // Helper function to convert markdown-style bold (**text**) and underline (__text__) to HTML
  const convertBoldMarkersToHTML = (text: string): string => {
    // Replace **text** with <strong> tags and __text__ with <u> tags
    let result = text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 900">$1</strong>');
    result = result.replace(/__(.*?)__/g, '<u style="text-decoration: underline">$1</u>');
    return result;
  };
  
  // Helper function to check if text contains bold or underline markers
  const hasBoldMarkers = (text: string): boolean => {
    return /\*\*.*?\*\*/.test(text) || /__.*?__/.test(text);
  };

  // Helper function to check if cursor is at the start of an element
  const isCursorAtStart = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    // Check if cursor is at position 0 and selection is collapsed (no text selected)
    return range.collapsed && range.startOffset === 0;
  };

  // Handle backspace at start of line to merge with previous line
  const handleKeyDownForMerge = (
    e: React.KeyboardEvent<HTMLElement>,
    currentIndex: number,
    items: string[],
    isBulletList: boolean
  ) => {
    if (e.key === 'Backspace' && isCursorAtStart() && currentIndex > 0) {
      e.preventDefault();
      
      // Get current item's text
      const currentText = e.currentTarget.textContent || '';
      const previousItem = items[currentIndex - 1];
      
      // Merge: previous item + current item (without bullet if it's a bullet list)
      const mergedItems = [...items];
      
      if (isBulletList) {
        // For bullet lists, merge the content
        const prevContent = previousItem.replace(/^[\s]*[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        const currContent = currentText.trim();
        mergedItems[currentIndex - 1] = `• ${prevContent}${currContent}`;
      } else {
        // For regular paragraphs, just concatenate
        mergedItems[currentIndex - 1] = previousItem + currentText;
      }
      
      // Remove current item
      mergedItems.splice(currentIndex, 1);
      
      // Update content
      if (onContentChange) {
        const newContent = mergedItems.join('\n');
        onContentChange(newContent);
      }
    }
  };

  // Format content with bullet points and line breaks - Enhanced for our JSON structure
  const renderContent = () => {
    if (typeof content === "string") {
      const containsHTML = hasHTML(content);
      
      // Pre-process content: if it contains "•" but not on separate lines, split them
      let processedContent = content;
      // Check if bullets are already on separate lines (bullet follows newline)
      const bulletsOnNewLines = /\n\s*•/.test(content);
      if (content.includes('•') && !bulletsOnNewLines) {
        // Split by bullet point and put each on a new line
        const parts = content.split('•');
        const formatted: string[] = [];
        
        // Handle first part (might not have a bullet if content doesn't start with •)
        if (parts[0] && parts[0].trim()) {
          formatted.push(parts[0].trim());
        }
        
        // Add remaining parts with bullet prefix
        for (let i = 1; i < parts.length; i++) {
          const trimmed = parts[i].trim();
          if (trimmed) {
            formatted.push(`• ${trimmed}`);
          }
        }
        
        processedContent = formatted.join('\n');
      }
      
      if (parseParagraphs) {
        // First, check if content has bullet points (•, -, *, or numbered lists)
        const hasBullets = processedContent.includes('•') || /^[\s]*[\-\*]|^\d+\./m.test(processedContent);
        
        if (hasBullets) {
          // For bullet content, split by single newlines to get individual items
          const lines = processedContent.split(/\n/).filter(line => line.trim());
          
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
                  
                  // Check for bold markers or HTML
                  const itemHasBoldMarkers = hasBoldMarkers(cleanItem);
                  const itemHasHTML = hasHTML(cleanItem);
                  
                  // Convert bold markers to HTML if present
                  const displayItem = itemHasBoldMarkers ? convertBoldMarkersToHTML(cleanItem) : cleanItem;
                  const shouldUseHTML = itemHasHTML || itemHasBoldMarkers;
                  
                  return (
                    <li 
                      key={index} 
                      className="text-sm leading-snug" 
                      style={{ fontSize: '11px', lineHeight: '1.4' }}
                      contentEditable={editable}
                      suppressContentEditableWarning={true}
                      {...(shouldUseHTML ? { dangerouslySetInnerHTML: { __html: displayItem } } : { children: cleanItem })}
                      onKeyDown={(e) => {
                        if (editable) {
                          handleKeyDownForMerge(e, index, items, true);
                        }
                      }}
                      onBlur={(e) => {
                        if (editable && onContentChange) {
                          // Get all list items and reconstruct content
                          const ul = e.currentTarget.parentElement;
                          if (ul) {
                            const items = Array.from(ul.children).map((li) => {
                              const text = (li as HTMLElement).textContent || (li as HTMLElement).innerText || '';
                              return `• ${text}`;
                            }).join('\n');
                            onContentChange(items);
                          }
                        }
                      }}
                    />
                  );
                })}
              </ul>
            </div>
          );
        } else {
          // For non-bullet content, split by double newlines for paragraphs
          const paragraphs = processedContent.split(/\n\n+/).filter(p => p.trim());
          
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
                      {trimmed.split(/\n/).filter(p => p.trim()).map((p, idx) => {
                        const pText = p.trim();
                        const pHasBoldMarkers = hasBoldMarkers(pText);
                        const pHasHTML = hasHTML(pText);
                        const displayPText = pHasBoldMarkers ? convertBoldMarkersToHTML(pText) : pText;
                        const shouldUsePHTML = pHasHTML || pHasBoldMarkers;
                        
                        // Get all lines for merge functionality
                        const allLines = trimmed.split(/\n/).filter(p => p.trim());
                        
                        return (
                          <p 
                            key={idx} 
                            className="mb-1 last:mb-0 text-sm leading-snug text-gray-700" 
                            style={{ fontSize: '11px', lineHeight: '1.4' }}
                            contentEditable={editable}
                            suppressContentEditableWarning={true}
                            {...(shouldUsePHTML ? { dangerouslySetInnerHTML: { __html: displayPText } } : { children: pText })}
                            onKeyDown={(e) => {
                              if (editable) {
                                handleKeyDownForMerge(e, idx, allLines, false);
                              }
                            }}
                            onBlur={(e) => {
                              if (editable && onContentChange) {
                                // Reconstruct all paragraphs from the parent container
                                const container = e.currentTarget.parentElement;
                                if (container) {
                                  const paragraphs = Array.from(container.children).map((p) => {
                                    return (p as HTMLElement).textContent || (p as HTMLElement).innerText || '';
                                  }).join('\n');
                                  onContentChange(paragraphs);
                                }
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                }
                
                // Regular paragraph
                const paragraphHasBoldMarkers = hasBoldMarkers(trimmed);
                const paragraphHasHTML = hasHTML(trimmed);
                const displayParagraph = paragraphHasBoldMarkers ? convertBoldMarkersToHTML(trimmed) : trimmed;
                const shouldUseParagraphHTML = paragraphHasHTML || paragraphHasBoldMarkers;
                
                return (
                  <p
                    key={pIndex}
                    className="mb-2 last:mb-0 text-sm leading-snug text-gray-700"
                    style={{ fontSize: '11px', lineHeight: '1.4' }}
                    contentEditable={editable}
                    suppressContentEditableWarning={true}
                    {...(shouldUseParagraphHTML ? { dangerouslySetInnerHTML: { __html: displayParagraph } } : { children: trimmed })}
                    onKeyDown={(e) => {
                      if (editable) {
                        handleKeyDownForMerge(e, pIndex, paragraphs, false);
                      }
                    }}
                    onBlur={(e) => {
                      if (editable && onContentChange) {
                        // Reconstruct all paragraphs from the parent container
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const allParagraphs = Array.from(container.children).map((p) => {
                            return (p as HTMLElement).textContent || (p as HTMLElement).innerText || '';
                          }).join('\n\n');
                          onContentChange(allParagraphs);
                        }
                      }
                    }}
                  />
                );
              })}
            </div>
          );
        }
      }
      // If parseParagraphs is false, preserve whitespace
      // Pre-process content for bullet points if needed
      let displayContent = content;
      // Check if bullets are already on separate lines (bullet follows newline)
      const bulletsOnNewLinesForDisplay = /\n\s*•/.test(content);
      if (typeof content === "string" && content.includes('•') && !bulletsOnNewLinesForDisplay) {
        // Split by bullet point and put each on a new line
        const parts = content.split('•');
        const formatted: string[] = [];
        
        // Handle first part (might not have a bullet if content doesn't start with •)
        if (parts[0] && parts[0].trim()) {
          formatted.push(parts[0].trim());
        }
        
        // Add remaining parts with bullet prefix
        for (let i = 1; i < parts.length; i++) {
          const trimmed = parts[i].trim();
          if (trimmed) {
            formatted.push(`• ${trimmed}`);
          }
        }
        
        displayContent = formatted.join('\n');
      }
      
      // Convert bold markers to HTML for display
      const contentHasBoldMarkers = hasBoldMarkers(displayContent);
      const finalDisplayContent = contentHasBoldMarkers ? convertBoldMarkersToHTML(displayContent) : displayContent;
      const shouldUseHTML = containsHTML || contentHasBoldMarkers;
      
      return (
        <div 
          className={`${preserveWhitespace ? "whitespace-pre-wrap leading-snug" : ""} ${editable ? 'cursor-text hover:bg-gray-50 rounded px-1 py-0.5 transition-colors min-h-[1.5em]' : ''}`}
          style={{ fontSize: '11px', lineHeight: '1.4' }}
          contentEditable={editable}
          suppressContentEditableWarning={true}
          {...(shouldUseHTML ? { dangerouslySetInnerHTML: { __html: finalDisplayContent } } : { children: displayContent })}
          onBlur={(e) => {
            if (editable && onContentChange) {
              // Extract plain text content, preserving line breaks and bullets
              // This ensures JSON only contains plain text with bullets, not HTML
              const textContent = e.currentTarget.textContent || e.currentTarget.innerText || '';
              onContentChange(textContent);
            }
          }}
          onClick={(e) => {
            if (editable && e.currentTarget !== document.activeElement) {
              e.currentTarget.focus();
            }
          }}
        />
      );
    }
    return (
      <div 
        className="content"
        contentEditable={editable}
        suppressContentEditableWarning={true}
        onBlur={(e) => {
          if (editable && onContentChange) {
            onContentChange(e.currentTarget.innerHTML || '');
          }
        }}
      >
        {content}
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    ...(backgroundColor && !backgroundColor.startsWith("bg-") && { backgroundColor }),
    ...style,
  };

  return (
    <section className={containerClasses} style={containerStyle}>
      {/* Delete Button - Top Right */}
      {editable && onDelete && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50 group no-pdf-export"
            title="Delete section"
            aria-label="Delete this section"
          >
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={onDelete}
            title="Delete Section"
            message="Are you sure you want to delete this section? This action cannot be undone."
          />
        </>
      )}
      
      {/* Top Divider */}
      {showDivider && dividerPosition === "top" && (
        <div className={`border-t ${borderColor} mb-6`} />
      )}

      {/* Section Title */}
      {showTitle && title && (
        <div className="mb-3">
          <h2 
            className={`${titleClasses} ${editable ? 'cursor-text hover:bg-gray-50 rounded px-1 py-0.5 transition-colors' : ''}`}
            style={{ fontSize: '13px', lineHeight: '1.3' }}
            contentEditable={editable}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              if (editable && onTitleChange) {
                onTitleChange(e.currentTarget.textContent || '');
              }
            }}
            onClick={(e) => {
              if (editable && e.currentTarget !== document.activeElement) {
                e.currentTarget.focus();
              }
            }}
          >
            {title}
          </h2>
          {/* Thin decorative line matching the design */}
          <div className="h-0.5 w-12 bg-[#A4C639] mt-1"></div>
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
        
        {/* Split and Bold Buttons - Appear when text is selected */}
        {/* Hide during PDF export to avoid color parsing issues */}
        {enableTextSplitting && showSplitButton && selectedText && !document.querySelector('.pdf-exporting') && (
          <div
            className="absolute z-50 flex items-center gap-2 no-pdf-export"
            style={{
              top: `${Math.max(0, splitButtonPosition.top)}px`,
              left: `${splitButtonPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Split Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSplitText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              style={{
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
            
            {/* Bold Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBoldText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: '#A4C639',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8FB02E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#A4C639';
              }}
              title="Make text bold (font-weight: 900)"
              aria-label="Make selected text bold"
            >
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
              <span>Bold</span>
            </button>
            
            {/* Underline Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnderlineText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              style={{
                backgroundColor: '#A4C639',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8FB02E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#A4C639';
              }}
              title="Underline text"
              aria-label="Underline selected text"
            >
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
              </svg>
              <span>Underline</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Divider */}
      {showDivider && dividerPosition === "bottom" && (
        <div className={`border-t ${borderColor} mt-6`} />
      )}
      
      {/* Add Section Button - Bottom Center */}
      {editable && onAddAfter && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddAfter();
          }}
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2  w-6 h-6 rounded-full bg-white border-2 border-[#A4C639] flex items-center justify-center transition-all duration-200 hover:bg-[#A4C639] hover:scale-110 group no-pdf-export shadow-md"
          title="Add section below"
          aria-label="Add new section after this one"
        >
          <svg
            className="w-3.5 h-3.5 text-[#A4C639] group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}
    </section>
  );
};

export default SectionTemplate;

