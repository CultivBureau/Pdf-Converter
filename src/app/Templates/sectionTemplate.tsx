"use client";

import React, { useState, useEffect, useRef } from "react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import SectionColorPaletteModal, { ColorPalette, PREDEFINED_PALETTES, ColorPaletteType } from "../components/SectionColorPaletteModal";

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
  
  // Color Palette Configuration
  colorPalette?: ColorPalette;
  onColorPaletteChange?: (palette: ColorPalette) => void;
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
  // Color Palette
  colorPalette,
  onColorPaletteChange,
}) => {
  // Text selection and splitting state
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [showSplitButton, setShowSplitButton] = useState(false);
  const [splitButtonPosition, setSplitButtonPosition] = useState({ top: 0, left: 0 });
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Color palette modal state
  const [showColorPaletteModal, setShowColorPaletteModal] = useState(false);
  
  // Current color palette (use provided or default)
  const currentPalette = colorPalette || PREDEFINED_PALETTES.default;
  
  // Track if user is typing (to distinguish from programmatic changes)
  const [userIsTyping, setUserIsTyping] = useState(false);
  const lastContentRef = useRef<string>("");
  
  // Determine heading tag
  const HeadingTag = `h${titleLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  // Build title classes - Enhanced typography with better hierarchy
  const titleClasses = [
    "text-lg font-bold",
    titleColor || "text-gray-900",
    titleMarginBottom || "mb-4",
    "tracking-tight",
    "leading-tight",
    titleClassName,
  ].filter(Boolean).join(" ");

  // Build content classes - Improved readability
  const contentClasses = [
    contentClassName,
    "text-sm",
    contentColor || "text-gray-700",
    `text-${contentAlignment}`,
    "leading-relaxed",
    preserveWhitespace && "whitespace-pre-wrap",
    contentMarginTop,
  ].filter(Boolean).join(" ");

  // Build container classes with type-based styling - Enhanced modern design with better colors
  const getSectionClasses = () => {
    const baseClasses = [
      "section-template",
      "mb-6",
      "last:mb-0",
      "transition-all",
      "duration-300",
      "hover:shadow-xl",
      "relative",
      containerClassName,
      className,
    ];

    // Apply color palette if provided
    if (currentPalette && currentPalette.type !== 'default') {
      // Use custom background from palette
      baseClasses.push(
        "rounded-2xl", "p-8",
        "shadow-lg",
        "border", "border-gray-200/60",
        "overflow-hidden",
        "backdrop-blur-sm"
      );
    } else {
      // Type-specific styling - Modern enhanced sections with better color schemes
      if (type === 'day') {
        baseClasses.push(
          "bg-gradient-to-br", "from-cyan-50", "to-blue-50",
          "border-l-4", "border-cyan-400",
          "rounded-2xl", "p-8",
          "shadow-lg",
          "hover:from-cyan-100", "hover:to-blue-100",
          "hover:border-cyan-500",
          "overflow-hidden",
          "backdrop-blur-sm"
        );
      } else if (type === 'included' || type === 'excluded') {
        const colorScheme = type === 'included' 
          ? ["from-emerald-50", "to-green-50", "border-emerald-400", "hover:from-emerald-100", "hover:to-green-100", "hover:border-emerald-500"]
          : ["from-rose-50", "to-pink-50", "border-rose-400", "hover:from-rose-100", "hover:to-pink-100", "hover:border-rose-500"];
        
        baseClasses.push(
          "bg-gradient-to-br", ...colorScheme,
          "border-l-4",
          "rounded-2xl", "p-8",
          "shadow-lg",
          "overflow-hidden",
          "backdrop-blur-sm"
        );
      } else if (backgroundColor && !backgroundColor.startsWith("bg-")) {
        baseClasses.push(
          "rounded-2xl", "p-8",
          "shadow-lg",
          "border", "border-gray-200",
          "bg-white",
          "backdrop-blur-sm",
          "hover:shadow-xl"
        );
      } else if (backgroundColor) {
        baseClasses.push(
          backgroundColor,
          "rounded-2xl", "p-8",
          "shadow-lg",
          "border", "border-gray-200",
          "backdrop-blur-sm",
          "hover:shadow-xl"
        );
      } else {
        // Default enhanced section with modern styling and better colors
        baseClasses.push(
          "bg-gradient-to-br", "from-white", "via-gray-50/50", "to-blue-50/30",
          "border", "border-gray-200/60",
          "rounded-2xl", "p-8",
          "shadow-lg",
          "hover:shadow-xl",
          "hover:from-blue-50/30", "hover:via-white", "hover:to-purple-50/20",
          "hover:border-blue-200/40",
          "overflow-hidden",
          "backdrop-blur-sm"
        );
      }
    }

    if (border && !baseClasses.some(c => c.includes('border-'))) {
      baseClasses.push(`border ${borderColor}`);
    }
    if (shadow) baseClasses.push("shadow-2xl");

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

  // Handle bold text formatting - Simple and robust approach
  const handleBoldText = () => {
    if (!selectedText || typeof content !== 'string') {
      setShowSplitButton(false);
      return;
    }
    
    const trimmedText = selectedText.trim();
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // Simple approach: Find ALL occurrences of the selected text in content
    // and determine which one to bold based on context
    
    // First, check if text is already bold anywhere (has ** around it)
    const alreadyBoldPattern = new RegExp(`\\*\\*${escapeRegExp(trimmedText)}\\*\\*`, 'g');
    if (alreadyBoldPattern.test(content)) {
      // Remove bold from this text
      const newContent = content.replace(`**${trimmedText}**`, trimmedText);
      lastContentRef.current = newContent;
      if (onContentChange) {
        onContentChange(newContent);
      }
    } else {
      // Need to find the correct occurrence to bold
      // Get selection context from DOM to identify which occurrence
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowSplitButton(false);
        return;
      }
      
      const range = selection.getRangeAt(0);
      
      // Find the closest LI or P or DIV parent to get context
      let contextNode: Node | null = range.startContainer;
      while (contextNode && contextNode.nodeType !== Node.ELEMENT_NODE) {
        contextNode = contextNode.parentNode;
      }
      
      // Get the full text of the context element (the bullet item or paragraph)
      let contextElement = contextNode as HTMLElement;
      // Walk up to find LI, P, or the content container
      while (contextElement && 
             contextElement !== contentContainerRef.current &&
             !['LI', 'P'].includes(contextElement.tagName)) {
        contextElement = contextElement.parentElement as HTMLElement;
      }
      
      if (contextElement && contextElement !== contentContainerRef.current) {
        // We're inside a specific LI or P element
        const elementText = contextElement.textContent || '';
        
        // Find which bullet/paragraph this corresponds to in the original content
        // Split content by newlines and find matching line
        const lines = content.split('\n');
        let targetLineIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Remove bullet markers for comparison
          const cleanLine = line.replace(/^[\s]*[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
          // Also remove any existing ** markers for comparison
          const cleanLineNoBold = cleanLine.replace(/\*\*/g, '');
          
          if (cleanLineNoBold === elementText.trim() || cleanLine === elementText.trim()) {
            targetLineIndex = i;
            break;
          }
        }
        
        if (targetLineIndex >= 0) {
          // Found the line, now bold the selected text within this line only
          const originalLine = lines[targetLineIndex];
          
          // Check if this specific occurrence is already bold
          if (originalLine.includes(`**${trimmedText}**`)) {
            // Remove bold
            lines[targetLineIndex] = originalLine.replace(`**${trimmedText}**`, trimmedText);
          } else if (originalLine.includes(trimmedText)) {
            // Add bold - replace only in this line
            lines[targetLineIndex] = originalLine.replace(trimmedText, `**${trimmedText}**`);
          }
          
          const newContent = lines.join('\n');
          lastContentRef.current = newContent;
          if (onContentChange) {
            onContentChange(newContent);
          }
        } else {
          // Fallback: just replace first occurrence in full content
          const newContent = content.replace(trimmedText, `**${trimmedText}**`);
          lastContentRef.current = newContent;
          if (onContentChange) {
            onContentChange(newContent);
          }
        }
      } else {
        // Not in a specific element, use simple replacement
        const newContent = content.replace(trimmedText, `**${trimmedText}**`);
        lastContentRef.current = newContent;
        if (onContentChange) {
          onContentChange(newContent);
        }
      }
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setShowSplitButton(false);
    setSelectedText("");
    setSelectionRange(null);
  };
  
  // Helper to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle underline text formatting - Simple and robust approach
  const handleUnderlineText = () => {
    if (!selectedText || typeof content !== 'string') {
      setShowSplitButton(false);
      return;
    }
    
    const trimmedText = selectedText.trim();
    if (trimmedText.length === 0) {
      setShowSplitButton(false);
      return;
    }
    
    // First, check if text is already underlined anywhere (has __ around it)
    const alreadyUnderlinePattern = new RegExp(`__${escapeRegExp(trimmedText)}__`, 'g');
    if (alreadyUnderlinePattern.test(content)) {
      // Remove underline from this text
      const newContent = content.replace(`__${trimmedText}__`, trimmedText);
      lastContentRef.current = newContent;
      if (onContentChange) {
        onContentChange(newContent);
      }
    } else {
      // Need to find the correct occurrence to underline
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowSplitButton(false);
        return;
      }
      
      const range = selection.getRangeAt(0);
      
      // Find the closest LI or P parent to get context
      let contextNode: Node | null = range.startContainer;
      while (contextNode && contextNode.nodeType !== Node.ELEMENT_NODE) {
        contextNode = contextNode.parentNode;
      }
      
      let contextElement = contextNode as HTMLElement;
      while (contextElement && 
             contextElement !== contentContainerRef.current &&
             !['LI', 'P'].includes(contextElement.tagName)) {
        contextElement = contextElement.parentElement as HTMLElement;
      }
      
      if (contextElement && contextElement !== contentContainerRef.current) {
        // We're inside a specific LI or P element
        const elementText = contextElement.textContent || '';
        
        // Find which bullet/paragraph this corresponds to in the original content
        const lines = content.split('\n');
        let targetLineIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Remove bullet markers for comparison
          const cleanLine = line.replace(/^[\s]*[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
          // Also remove any existing ** or __ markers for comparison
          const cleanLineNoFormatting = cleanLine.replace(/\*\*/g, '').replace(/__/g, '');
          
          if (cleanLineNoFormatting === elementText.trim() || cleanLine === elementText.trim()) {
            targetLineIndex = i;
            break;
          }
        }
        
        if (targetLineIndex >= 0) {
          // Found the line, now underline the selected text within this line only
          const originalLine = lines[targetLineIndex];
          
          // Check if this specific occurrence is already underlined
          if (originalLine.includes(`__${trimmedText}__`)) {
            // Remove underline
            lines[targetLineIndex] = originalLine.replace(`__${trimmedText}__`, trimmedText);
          } else if (originalLine.includes(trimmedText)) {
            // Add underline - replace only in this line
            lines[targetLineIndex] = originalLine.replace(trimmedText, `__${trimmedText}__`);
          }
          
          const newContent = lines.join('\n');
          lastContentRef.current = newContent;
          if (onContentChange) {
            onContentChange(newContent);
          }
        } else {
          // Fallback: just replace first occurrence in full content
          const newContent = content.replace(trimmedText, `__${trimmedText}__`);
          lastContentRef.current = newContent;
          if (onContentChange) {
            onContentChange(newContent);
          }
        }
      } else {
        // Not in a specific element, use simple replacement
        const newContent = content.replace(trimmedText, `__${trimmedText}__`);
        lastContentRef.current = newContent;
        if (onContentChange) {
          onContentChange(newContent);
        }
      }
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
  
  // Helper function to find and preserve formatting markers when rebuilding content from DOM
  // This maps displayed text back to original formatted text
  const preserveFormattingMarkers = (displayedText: string, originalContent: string): string => {
    if (!hasBoldMarkers(originalContent)) {
      return displayedText;
    }
    
    // Build a map of plain text positions to formatted text
    // This helps us preserve ** and __ markers
    let result = displayedText;
    
    // Find all bold sections in original
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    while ((match = boldRegex.exec(originalContent)) !== null) {
      const boldText = match[1];
      // If this bold text exists in the displayed text, wrap it with markers
      if (result.includes(boldText) && !result.includes(`**${boldText}**`)) {
        result = result.replace(boldText, `**${boldText}**`);
      }
    }
    
    // Find all underline sections in original
    const underlineRegex = /__([^_]+)__/g;
    while ((match = underlineRegex.exec(originalContent)) !== null) {
      const underlineText = match[1];
      if (result.includes(underlineText) && !result.includes(`__${underlineText}__`)) {
        result = result.replace(underlineText, `__${underlineText}__`);
      }
    }
    
    return result;
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
              <ul className="space-y-2 text-gray-700">
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
                      className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-white/80 hover:to-cyan-50/30 transition-all duration-300 group border border-transparent hover:border-cyan-200/50 hover:shadow-sm" 
                      style={{ fontSize: '15px', lineHeight: '1.7' }}
                    >
                      {/* Enhanced bullet point with better colors - Use palette colors if available */}
                      <div className="flex-shrink-0 mt-1.5">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shadow-md ring-2"
                          style={{
                            background: getPaletteColor('primary') && getPaletteColor('secondary')
                              ? `linear-gradient(to bottom right, ${getPaletteColor('primary')}, ${getPaletteColor('secondary')})`
                              : 'linear-gradient(to bottom right, #06B6D4, #3B82F6)',
                            boxShadow: getPaletteColor('primary')
                              ? `0 0 0 2px ${getPaletteColor('primary')}40`
                              : '0 0 0 2px #06B6D440',
                          }}
                        ></div>
                      </div>
                      <div
                        className={`flex-1 ${editable ? 'cursor-text hover:bg-blue-50/50 rounded-lg px-2 py-1.5 transition-all duration-200 min-h-[2em] border border-transparent hover:border-blue-200/30' : ''} text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300/30 focus:border-blue-300`}
                        contentEditable={editable}
                        suppressContentEditableWarning={true}
                        {...(shouldUseHTML ? { dangerouslySetInnerHTML: { __html: displayItem } } : { children: cleanItem })}
                        onKeyDown={(e) => {
                          if (editable) {
                            // Enhanced merge functionality
                            if (e.key === 'Backspace' && isCursorAtStart() && index > 0) {
                              e.preventDefault();
                              const currentText = e.currentTarget.textContent || '';
                              const previousItem = items[index - 1];
                              const mergedItems = [...items];
                              
                              // Smart merge - combine with previous item
                              const prevContent = previousItem.replace(/^[\s]*[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                              const currContent = currentText.trim();
                              mergedItems[index - 1] = `• ${prevContent} ${currContent}`.trim();
                              mergedItems.splice(index, 1);
                              
                              if (onContentChange) {
                                onContentChange(mergedItems.join('\n'));
                              }
                              return;
                            }
                            
                            // Enter key creates new bullet point
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const currentText = e.currentTarget.textContent || '';
                              const newItems = [...items];
                              newItems[index] = `• ${currentText}`;
                              newItems.splice(index + 1, 0, '• ');
                              
                              if (onContentChange) {
                                onContentChange(newItems.join('\n'));
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (editable && onContentChange && userIsTyping) {
                            // Get all list items and reconstruct content with preserved formatting
                            const ul = e.currentTarget.closest('ul');
                            if (ul) {
                              const newItems = Array.from(ul.children).map((li, idx) => {
                                const text = (li as HTMLElement).textContent || (li as HTMLElement).innerText || '';
                                // Try to preserve formatting from original item
                                const originalItem = items[idx] || '';
                                const preservedText = preserveFormattingMarkers(text, originalItem);
                                return `• ${preservedText}`;
                              }).join('\n');
                              onContentChange(newItems);
                            }
                            setUserIsTyping(false);
                          }
                        }}
                        onInput={() => setUserIsTyping(true)}
                      />
                    </li>
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
                    <div key={pIndex} className="mb-1 last:mb-0">
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
                            className={`mb-3 last:mb-0 text-gray-700 leading-relaxed transition-all duration-200 ${editable ? 'cursor-text hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300/30 focus:border-blue-300 border border-transparent hover:border-blue-200/30 min-h-[2.5em]' : ''}`}
                            style={{ fontSize: '15px', lineHeight: '1.7' }}
                            contentEditable={editable}
                            suppressContentEditableWarning={true}
                            {...(shouldUsePHTML ? { dangerouslySetInnerHTML: { __html: displayPText } } : { children: pText })}
                            onKeyDown={(e) => {
                              if (editable) {
                                // Enhanced merge functionality for paragraphs
                                if (e.key === 'Backspace' && isCursorAtStart() && idx > 0) {
                                  e.preventDefault();
                                  const currentText = e.currentTarget.textContent || '';
                                  const mergedLines = [...allLines];
                                  mergedLines[idx - 1] = mergedLines[idx - 1] + ' ' + currentText;
                                  mergedLines.splice(idx, 1);
                                  
                                  if (onContentChange) {
                                    onContentChange(mergedLines.join('\n'));
                                  }
                                }
                              }
                            }}
                            onInput={() => setUserIsTyping(true)}
                            onBlur={(e) => {
                              if (editable && onContentChange && userIsTyping) {
                                // Reconstruct all paragraphs from the parent container with preserved formatting
                                const container = e.currentTarget.parentElement;
                                if (container) {
                                  const newParagraphs = Array.from(container.children).map((p, idx) => {
                                    const text = (p as HTMLElement).textContent || (p as HTMLElement).innerText || '';
                                    const originalLine = allLines[idx] || '';
                                    return preserveFormattingMarkers(text, originalLine);
                                  }).join('\n');
                                  onContentChange(newParagraphs);
                                }
                                setUserIsTyping(false);
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
                    className="mb-1 last:mb-0 text-sm leading-snug text-gray-700"
                    style={{ fontSize: '11px', lineHeight: '1.4' }}
                    contentEditable={editable}
                    suppressContentEditableWarning={true}
                    {...(shouldUseParagraphHTML ? { dangerouslySetInnerHTML: { __html: displayParagraph } } : { children: trimmed })}
                    onKeyDown={(e) => {
                      if (editable) {
                        handleKeyDownForMerge(e, pIndex, paragraphs, false);
                      }
                    }}
                    onInput={() => setUserIsTyping(true)}
                    onBlur={(e) => {
                      if (editable && onContentChange && userIsTyping) {
                        // Reconstruct all paragraphs with preserved formatting
                        const container = e.currentTarget.parentElement;
                        if (container) {
                          const allParagraphs = Array.from(container.children).map((p, idx) => {
                            const text = (p as HTMLElement).textContent || (p as HTMLElement).innerText || '';
                            const originalParagraph = paragraphs[idx] || '';
                            return preserveFormattingMarkers(text, originalParagraph);
                          }).join('\n\n');
                          onContentChange(allParagraphs);
                        }
                        setUserIsTyping(false);
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
          className={`${preserveWhitespace ? "whitespace-pre-wrap leading-relaxed" : ""} ${editable ? 'cursor-text hover:bg-blue-50/30 rounded-lg px-2 py-1.5 transition-all duration-200 min-h-[1.8em]' : ''}`}
          style={{ fontSize: '14px', lineHeight: '1.6' }}
          contentEditable={editable}
          suppressContentEditableWarning={true}
          {...(shouldUseHTML ? { dangerouslySetInnerHTML: { __html: finalDisplayContent } } : { children: displayContent })}
          onInput={() => {
            // Mark that user is typing
            setUserIsTyping(true);
          }}
          onBlur={(e) => {
            if (editable && onContentChange) {
              // Only update if user was actually typing, not if bold/underline was applied
              if (userIsTyping) {
                // Extract text content, but preserve any existing formatting markers from the original
                const newText = e.currentTarget.textContent || e.currentTarget.innerText || '';
                
                // If the original content had bold markers, we need to be smart about preserving them
                // For now, only update if the text actually changed from user input
                if (typeof content === 'string') {
                  // Strip markers from original to compare
                  const originalWithoutMarkers = content.replace(/\*\*/g, '').replace(/__/g, '');
                  if (newText !== originalWithoutMarkers) {
                    // User made actual changes, update with new text
                    onContentChange(newText);
                  }
                  // If same, don't update - preserves the formatting markers
                }
                setUserIsTyping(false);
              }
              // If not typing (e.g., just clicked bold then blurred), don't overwrite
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
    // Apply color palette background if provided and applyBackground is true
    ...(currentPalette && currentPalette.type !== 'default' && currentPalette.applyBackground !== false && {
      background: currentPalette.colors.background,
    }),
    ...style,
  };
  
  // Get colors from palette for decorative elements
  const getPaletteColor = (colorType: 'primary' | 'secondary' | 'accent' | 'text') => {
    if (currentPalette && currentPalette.type !== 'default') {
      return currentPalette.colors[colorType];
    }
    return undefined;
  };

  return (
    <section className={containerClasses} style={containerStyle}>
      {/* Edit Color Palette Button - Top Left */}
      {editable && onColorPaletteChange && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowColorPaletteModal(true);
          }}
          className="absolute top-3 left-3 p-2 rounded-full transition-all duration-200 hover:bg-blue-500 group no-pdf-export bg-white shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 z-10"
          title="Edit color palette"
          aria-label="Edit color palette"
        >
          <svg
            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        </button>
      )}

      {/* Delete Button - Top Right - Enhanced styling */}
      {editable && onDelete && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="absolute top-3 right-3 p-2 rounded-full transition-all duration-200 hover:bg-red-500 group no-pdf-export bg-white shadow-md border border-gray-200 hover:shadow-lg hover:scale-105 z-10"
            title="Delete section"
            aria-label="Delete this section"
          >
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
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

      {/* Section Title - Enhanced with centered layout and modern styling */}
      {showTitle && title && (
        <div className="mb-6 text-center relative">
          <h2 
            className={`${titleClasses} ${editable ? 'cursor-text hover:bg-blue-50 rounded-lg px-4 py-3 transition-all duration-200 inline-block' : ''} relative z-10 mx-auto`}
            style={{ fontSize: '20px', lineHeight: '1.3', letterSpacing: '0.5px' }}
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
          {/* Enhanced decorative elements with better colors - Use palette colors if available */}
          <div className="flex items-center justify-center space-x-3 mt-4">
            <div 
              className="h-0.5 w-12 bg-gradient-to-r from-transparent rounded-full"
              style={{
                background: getPaletteColor('primary') 
                  ? `linear-gradient(to right, transparent, ${getPaletteColor('primary')})`
                  : 'linear-gradient(to right, transparent, #06B6D4)'
              }}
            ></div>
            <div 
              className="h-1.5 w-20 rounded-full shadow-lg"
              style={{
                background: getPaletteColor('primary') && getPaletteColor('secondary') && getPaletteColor('accent')
                  ? `linear-gradient(to right, ${getPaletteColor('primary')}, ${getPaletteColor('secondary')}, ${getPaletteColor('accent')})`
                  : 'linear-gradient(to right, #06B6D4, #3B82F6, #8B5CF6)'
              }}
            ></div>
            <div 
              className="h-0.5 w-12 bg-gradient-to-r rounded-full"
              style={{
                background: getPaletteColor('accent')
                  ? `linear-gradient(to right, ${getPaletteColor('accent')}, transparent)`
                  : 'linear-gradient(to right, #8B5CF6, transparent)'
              }}
            ></div>
          </div>
          {/* Subtle background accent with better positioning */}
          <div 
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-12 h-12 rounded-full opacity-40 blur-sm"
            style={{
              background: getPaletteColor('primary') && getPaletteColor('secondary') && getPaletteColor('accent')
                ? `linear-gradient(to bottom right, ${getPaletteColor('primary')}40, ${getPaletteColor('secondary')}40, ${getPaletteColor('accent')}40)`
                : 'linear-gradient(to bottom right, #06B6D440, #3B82F640, #8B5CF640)'
            }}
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
            {/* Split Button - Enhanced design with better colors */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSplitText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="group relative px-4 py-3 rounded-xl shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm font-semibold cursor-pointer backdrop-blur-sm border border-white/20"
              style={{
                background: getPaletteColor('primary')
                  ? `linear-gradient(135deg, ${getPaletteColor('primary')}, ${getPaletteColor('secondary') || getPaletteColor('primary')})`
                  : 'linear-gradient(135deg, #06B6D4, #0891B2)',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0891B2, #0E7490)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #06B6D4, #0891B2)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              }}
              title="Split into bullet points"
              aria-label="Split selected text into bullet points"
            >
              <svg 
                className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Split</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            {/* Bold Button - Enhanced design with better colors */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBoldText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="group relative px-4 py-3 rounded-xl shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm font-semibold cursor-pointer backdrop-blur-sm border border-white/20"
              style={{
                background: getPaletteColor('accent')
                  ? `linear-gradient(135deg, ${getPaletteColor('accent')}, ${getPaletteColor('secondary') || getPaletteColor('accent')})`
                  : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7C3AED, #6D28D9)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              }}
              title="Make text bold (font-weight: 900)"
              aria-label="Make selected text bold"
            >
              <svg 
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
              <span className="font-black">Bold</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            {/* Underline Button - Enhanced design with better colors */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnderlineText();
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
              className="group relative px-4 py-3 rounded-xl shadow-xl active:scale-95 transition-all duration-200 flex items-center gap-2 text-sm font-semibold cursor-pointer backdrop-blur-sm border border-white/20"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #D97706, #B45309)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              }}
              title="Underline text"
              aria-label="Underline selected text"
            >
              <svg 
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
              </svg>
              <span className="underline">Underline</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Divider */}
      {showDivider && dividerPosition === "bottom" && (
        <div className={`border-t ${borderColor} mt-6`} />
      )}
      
            {/* Color Palette Modal */}
      {editable && onColorPaletteChange && (
        <SectionColorPaletteModal
          isOpen={showColorPaletteModal}
          onClose={() => setShowColorPaletteModal(false)}
          onSave={(palette) => {
            onColorPaletteChange(palette);
            setShowColorPaletteModal(false);
          }}
          currentPalette={currentPalette}
        />
      )}

      {/* Add Section Button - Enhanced modern design with better positioning */}
      {editable && onAddAfter && (
        <div className="flex justify-center mt-6 mb-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddAfter();
            }}
            className="group relative px-6 py-3 rounded-2xl border-4 border-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 no-pdf-export shadow-xl hover:shadow-2xl overflow-hidden"
            style={{
              background: getPaletteColor('primary') && getPaletteColor('secondary') && getPaletteColor('accent')
                ? `linear-gradient(to right, ${getPaletteColor('primary')}, ${getPaletteColor('secondary')}, ${getPaletteColor('accent')})`
                : 'linear-gradient(to right, #06B6D4, #3B82F6, #8B5CF6)',
            }}
            title="Add section below"
            aria-label="Add new section after this one"
          >
            {/* Background shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            {/* Icon with enhanced animation */}
            <svg
              className="w-5 h-5 text-white transition-all duration-300 group-hover:scale-125 group-hover:rotate-90 mr-2"
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
            
            {/* Text with better typography */}
            <span className="text-white font-semibold text-sm tracking-wide relative z-10">
              Add Section Below
            </span>
            
            {/* Pulse rings for attention */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-400 animate-ping opacity-20"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-300 to-purple-300 animate-pulse opacity-10"></div>
          </button>
        </div>
      )}
    </section>
  );
};

export default SectionTemplate;

