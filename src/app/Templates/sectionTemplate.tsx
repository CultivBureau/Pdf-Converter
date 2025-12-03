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

  // Build title classes
  const titleClasses = [
    `text-${titleSize}`,
    `font-${titleWeight}`,
    titleColor,
    titleMarginBottom,
    "tracking-tight",
    titleClassName,
  ].filter(Boolean).join(" ");

  // Build content classes
  const contentClasses = [
    contentClassName,
    `text-${contentSize}`,
    contentColor,
    `text-${contentAlignment}`,
    "leading-relaxed",
    preserveWhitespace && "whitespace-pre-wrap",
    contentMarginTop,
  ].filter(Boolean).join(" ");

  // Build container classes with type-based styling
  const getSectionClasses = () => {
    const baseClasses = [
      "section-template",
      marginBottom,
      "last:mb-0",
      padding,
      containerClassName,
      className,
    ];

    // Type-specific styling
    if (type === 'day') {
      baseClasses.push("bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-[#A4C639]");
    } else if (type === 'included' || type === 'excluded') {
      baseClasses.push("bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500");
    } else if (backgroundColor && !backgroundColor.startsWith("bg-")) {
      // Custom background color
    } else if (backgroundColor) {
      baseClasses.push(backgroundColor);
    }

    if (border) baseClasses.push(`border ${borderColor}`);
    if (rounded) baseClasses.push("rounded-lg");
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
            <div className="prose prose-lg max-w-none">
              <ul className="mb-4 last:mb-0 list-disc list-inside space-y-2 text-gray-700">
                {items.map((item, index) => {
                  // Remove bullet markers and clean
                  const cleanItem = item
                    .replace(/^[\s]*[•\-\*]\s*/, "")
                    .replace(/^\d+\.\s*/, "")
                    .trim();
                  
                  if (!cleanItem) return null;
                  
                  return (
                    <li key={index} className="text-justify leading-relaxed">
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
            <div className="prose prose-lg max-w-none">
              {paragraphs.map((paragraph, pIndex) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                
                // If paragraph has single newlines, split into multiple paragraphs
                if (trimmed.includes('\n') && !hasBullets) {
                  return (
                    <div key={pIndex} className="mb-4 last:mb-0">
                      {trimmed.split(/\n/).filter(p => p.trim()).map((p, idx) => (
                        <p key={idx} className="mb-2 last:mb-0 text-justify leading-relaxed text-gray-700">
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
                    className="mb-4 last:mb-0 text-justify leading-relaxed text-gray-700"
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
      return <div className={preserveWhitespace ? "whitespace-pre-wrap" : ""}>{content}</div>;
    }
    return <div className="content">{content}</div>;
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
        <div className={titleMarginBottom}>
          {titleLevel === 1 && <h1 className={titleClasses}>{title}</h1>}
          {titleLevel === 2 && <h2 className={titleClasses}>{title}</h2>}
          {titleLevel === 3 && <h3 className={titleClasses}>{title}</h3>}
          {titleLevel === 4 && <h4 className={titleClasses}>{title}</h4>}
          {titleLevel === 5 && <h5 className={titleClasses}>{title}</h5>}
          {titleLevel === 6 && <h6 className={titleClasses}>{title}</h6>}
          {/* Decorative underline */}
          {showUnderline && (
            <div className={`mt-2 ${underlineClasses}`} />
          )}
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

