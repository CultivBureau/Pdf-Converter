"use client";

import React from "react";

export interface ImageElement {
  id: string;
  type: "image";
  page: number;
  src: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface ImageBlockProps {
  image: ImageElement;
  className?: string;
  showStats?: boolean;
  editable?: boolean;
  onEdit?: (image: ImageElement) => void;
}

/**
 * Image Block Component
 * Displays images extracted from PDF with optional captions
 */
export default function ImageBlock({
  image,
  className = "",
  showStats = false,
  editable = false,
  onEdit,
}: ImageBlockProps) {
  // Handle base64 images
  const imageSrc = image.src.startsWith("data:") 
    ? image.src 
    : image.src.startsWith("http") 
    ? image.src 
    : `data:image/png;base64,${image.src}`;

  return (
    <div
      className={`image-block mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200 ${className}`}
      data-image-id={image.id}
      data-image-page={image.page}
    >
      {/* Image */}
      <div className="relative w-full flex justify-center items-center">
        <img
          src={imageSrc}
          alt={image.caption || `Image from page ${image.page}`}
          className="max-w-full h-auto rounded-lg"
          style={{
            maxHeight: "600px",
            objectFit: "contain",
          }}
        />
        
        {/* Edit Button */}
        {editable && onEdit && (
          <button
            onClick={() => onEdit(image)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-[#A4C639] hover:bg-gray-100 transition-colors"
            title="تعديل الصورة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Caption */}
      {image.caption && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600 italic">{image.caption}</p>
        </div>
      )}

      {/* Statistics (optional) */}
      {showStats && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 flex gap-4 justify-center">
          <span>الصفحة: {image.page}</span>
          {image.width && image.height && (
            <>
              <span>العرض: {image.width}px</span>
              <span>الارتفاع: {image.height}px</span>
            </>
          )}
        </div>
      )}

      {/* Image Metadata (debug) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-gray-400 font-mono text-center">
          ID: {image.id} | Page: {image.page}
        </div>
      )}
    </div>
  );
}

/**
 * Render multiple images
 */
export function renderImages(
  images: ImageElement[],
  props?: Omit<ImageBlockProps, "image">
) {
  return images.map((image) => (
    <ImageBlock key={image.id} image={image} {...props} />
  ));
}

