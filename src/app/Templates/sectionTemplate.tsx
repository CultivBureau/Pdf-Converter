"use client";

import React from "react";

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
}) => {
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
          <div className="h-0.5 w-12 bg-[#A4C639] mt-1"></div>
        </div>
      )}

      {/* Section Content */}
      <div className={contentClasses}>
        {renderContent()}
      </div>

      {/* Bottom Divider */}
      {showDivider && dividerPosition === "bottom" && (
        <div className={`border-t ${borderColor} mt-6`} />
      )}
    </section>
  );
};

export default SectionTemplate;

