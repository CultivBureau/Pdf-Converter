"use client";

import React from "react";

/**
 * Customizable Base Template Component
 * 
 * A flexible wrapper template for PDF documents with customizable:
 * - Header/Footer images
 * - Background colors and gradients
 * - Layout dimensions (A4, custom)
 * - Margins and padding
 * - Container styling
 */
export interface BaseTemplateProps {
  children: React.ReactNode;
  
  // Header Configuration
  headerImage?: string;
  headerImageAlt?: string;
  showHeader?: boolean;
  headerClassName?: string;
  
  // Footer Configuration
  footerImage?: string;
  footerImageAlt?: string;
  showFooter?: boolean;
  footerClassName?: string;
  
  // Background Configuration
  backgroundColor?: string;
  backgroundGradient?: {
    from: string;
    to: string;
    direction?: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  };
  backgroundImage?: string;
  
  // Layout Configuration
  pageSize?: "A4" | "letter" | "custom";
  customWidth?: string;
  customHeight?: string;
  maxWidth?: string;
  minHeight?: string;
  
  // Spacing Configuration
  contentPadding?: {
    horizontal?: string;
    vertical?: string;
  };
  containerMargin?: string;
  
  // Styling
  containerClassName?: string;
  contentClassName?: string;
  shadow?: boolean;
  rounded?: boolean;
  border?: boolean;
  borderColor?: string;
  
  // Additional customization
  className?: string;
  style?: React.CSSProperties;
}

const BaseTemplate: React.FC<BaseTemplateProps> = ({
  children,
  // Header
  headerImage = "/happylifeHeader.jpeg",
  headerImageAlt = "Header",
  showHeader = true,
  headerClassName = "",
  // Footer
  footerImage = "/happylifeFooter.jpg",
  footerImageAlt = "Footer",
  showFooter = true,
  footerClassName = "",
  // Background
  backgroundColor,
  backgroundGradient,
  backgroundImage,
  // Layout
  pageSize = "A4",
  customWidth,
  customHeight,
  maxWidth,
  minHeight = "min-h-screen",
  // Spacing
  contentPadding = {
    horizontal: "15mm",
    vertical: "20mm",
  },
  containerMargin = "mx-auto",
  // Styling
  containerClassName = "",
  contentClassName = "",
  shadow = true,
  rounded = false,
  border = false,
  borderColor = "border-gray-200",
  // Additional
  className = "",
  style,
}) => {
  // Determine page dimensions - Default to 100% width
  const getPageDimensions = () => {
    if (pageSize === "A4") {
      return {
        width: "100%",
        maxWidth: maxWidth || "100%",
      };
    } else if (pageSize === "letter") {
      return {
        width: "100%",
        maxWidth: maxWidth || "100%",
      };
    } else {
      return {
        width: customWidth || "100%",
        maxWidth: maxWidth || customWidth || "100%",
      };
    }
  };

  const dimensions = getPageDimensions();

  // Build background classes
  const getBackgroundClasses = () => {
    if (backgroundImage) {
      return `bg-cover bg-center bg-no-repeat`;
    }
    if (backgroundGradient) {
      const direction = backgroundGradient.direction || "to-r";
      return `bg-gradient-${direction} from-[${backgroundGradient.from}] to-[${backgroundGradient.to}]`;
    }
    if (backgroundColor) {
      return `bg-[${backgroundColor}]`;
    }
    // Default gradient
    return "bg-gradient-to-r from-[#A4C639] to-[#8FB02E]";
  };

  // Build container classes - 100% width with responsive padding
  const containerClasses = [
    "base-template",
    "w-full",
    "min-h-screen",
    "py-8",
    "px-4",
    getBackgroundClasses(),
    className,
  ].filter(Boolean).join(" ");

  // Build inner container classes
  const innerContainerClasses = [
    "w-full",
    "max-w-full",
    "mx-auto",
    "bg-white",
    shadow && "shadow-2xl",
    rounded && "rounded-lg",
    border && `border ${borderColor}`,
    "overflow-hidden",
    containerClassName,
  ].filter(Boolean).join(" ");

  // Build content area classes - Responsive padding
  const contentAreaClasses = [
    "w-full",
    "px-4",
    "sm:px-6",
    "md:px-8",
    "lg:px-12",
    "xl:px-16",
    "py-8",
    "md:py-12",
    contentClassName,
  ].filter(Boolean).join(" ");

  // Inline styles for dimensions and padding
  const containerStyle: React.CSSProperties = {
    ...(customHeight && { minHeight: customHeight }),
    ...style,
  };

  const contentStyle: React.CSSProperties = {};

  const backgroundImageStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
      }
    : {};

  return (
    <div className={containerClasses} style={{ ...containerStyle, ...backgroundImageStyle }}>
      <div className={`${innerContainerClasses} ${containerMargin}`} style={containerStyle}>
        {/* Header Image */}
        {showHeader && headerImage && (
          <div className={`w-full ${headerClassName}`}>
            <img
              src={headerImage}
              alt={headerImageAlt}
              className="w-full h-auto object-cover block"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className={contentAreaClasses} style={contentStyle}>
          {children}
        </div>

        {/* Footer Image */}
        {showFooter && footerImage && (
          <div className={`w-full mt-auto ${footerClassName}`}>
            <img
              src={footerImage}
              alt={footerImageAlt}
              className="w-full h-auto object-cover block"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseTemplate;

