"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type ColorPaletteType = 'default' | 'warm' | 'cool' | 'nature' | 'professional' | 'vibrant' | 'custom';

export interface ColorPalette {
  type: ColorPaletteType;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  applyBackground?: boolean; // Toggle for background color application
}

export const PREDEFINED_PALETTES: Record<ColorPaletteType, ColorPalette> = {
  default: {
    type: 'default',
    name: 'Default',
    colors: {
      primary: '#06B6D4', // Cyan
      secondary: '#3B82F6', // Blue
      accent: '#8B5CF6', // Purple
      background: 'linear-gradient(to bottom right, #ffffff, #f0f9ff, #e0f2fe)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  warm: {
    type: 'warm',
    name: 'Warm',
    colors: {
      primary: '#F97316', // Orange
      secondary: '#EF4444', // Red
      accent: '#EC4899', // Pink
      background: 'linear-gradient(to bottom right, #fff7ed, #fef2f2, #fdf2f8)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  cool: {
    type: 'cool',
    name: 'Cool',
    colors: {
      primary: '#3B82F6', // Blue
      secondary: '#14B8A6', // Teal
      accent: '#6366F1', // Indigo
      background: 'linear-gradient(to bottom right, #eff6ff, #f0fdfa, #eef2ff)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  nature: {
    type: 'nature',
    name: 'Nature',
    colors: {
      primary: '#22C55E', // Green
      secondary: '#84CC16', // Lime
      accent: '#EAB308', // Yellow
      background: 'linear-gradient(to bottom right, #f0fdf4, #fefce8, #fef9c3)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  professional: {
    type: 'professional',
    name: 'Professional',
    colors: {
      primary: '#6B7280', // Gray
      secondary: '#475569', // Slate
      accent: '#3B82F6', // Blue
      background: 'linear-gradient(to bottom right, #f9fafb, #f1f5f9, #eff6ff)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  vibrant: {
    type: 'vibrant',
    name: 'Vibrant',
    colors: {
      primary: '#EC4899', // Pink
      secondary: '#8B5CF6', // Purple
      accent: '#6366F1', // Indigo
      background: 'linear-gradient(to bottom right, #fdf2f8, #faf5ff, #eef2ff)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
  custom: {
    type: 'custom',
    name: 'Custom',
    colors: {
      primary: '#06B6D4',
      secondary: '#3B82F6',
      accent: '#8B5CF6',
      background: 'linear-gradient(to bottom right, #ffffff, #f0f9ff, #e0f2fe)',
      text: '#1F2937',
    },
    applyBackground: true,
  },
};

interface SectionColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (palette: ColorPalette) => void;
  currentPalette?: ColorPalette;
}

export default function SectionColorPaletteModal({
  isOpen,
  onClose,
  onSave,
  currentPalette,
}: SectionColorPaletteModalProps) {
  const [selectedPaletteType, setSelectedPaletteType] = useState<ColorPaletteType>(
    currentPalette?.type || 'default'
  );
  const [applyBackground, setApplyBackground] = useState(
    currentPalette?.applyBackground !== undefined ? currentPalette.applyBackground : true
  );
  const [customColors, setCustomColors] = useState({
    primary: currentPalette?.colors.primary || PREDEFINED_PALETTES.default.colors.primary,
    secondary: currentPalette?.colors.secondary || PREDEFINED_PALETTES.default.colors.secondary,
    accent: currentPalette?.colors.accent || PREDEFINED_PALETTES.default.colors.accent,
    background: currentPalette?.colors.background || PREDEFINED_PALETTES.default.colors.background,
    text: currentPalette?.colors.text || PREDEFINED_PALETTES.default.colors.text,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (currentPalette) {
      setSelectedPaletteType(currentPalette.type);
      setApplyBackground(currentPalette.applyBackground !== undefined ? currentPalette.applyBackground : true);
      if (currentPalette.type === 'custom') {
        setCustomColors(currentPalette.colors);
      }
    }
  }, [currentPalette]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePaletteSelect = (type: ColorPaletteType) => {
    setSelectedPaletteType(type);
    if (type !== 'custom') {
      setCustomColors(PREDEFINED_PALETTES[type].colors);
      setApplyBackground(PREDEFINED_PALETTES[type].applyBackground !== undefined ? PREDEFINED_PALETTES[type].applyBackground : true);
    }
  };

  const handleSave = () => {
    const palette: ColorPalette = selectedPaletteType === 'custom'
      ? {
          type: 'custom',
          name: 'Custom',
          colors: customColors,
          applyBackground,
        }
      : {
          ...PREDEFINED_PALETTES[selectedPaletteType],
          applyBackground,
        };
    
    onSave(palette);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999,
        pointerEvents: 'all'
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in mx-4 z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative',
          zIndex: 100000,
          transform: 'translateY(0)',
          maxWidth: '768px',
          margin: '0 1rem'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Color Palette Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Predefined Palettes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Predefined Palettes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(['default', 'warm', 'cool', 'nature', 'professional', 'vibrant'] as ColorPaletteType[]).map((type) => {
                const palette = PREDEFINED_PALETTES[type];
                const isSelected = selectedPaletteType === type;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handlePaletteSelect(type)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-semibold text-gray-800">{palette.name}</div>
                      <div className="flex gap-1.5">
                        <div
                          className="w-8 h-8 rounded-full shadow-md"
                          style={{ backgroundColor: palette.colors.primary }}
                        />
                        <div
                          className="w-8 h-8 rounded-full shadow-md"
                          style={{ backgroundColor: palette.colors.secondary }}
                        />
                        <div
                          className="w-8 h-8 rounded-full shadow-md"
                          style={{ backgroundColor: palette.colors.accent }}
                        />
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Option */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Custom Colors</h3>
              <button
                type="button"
                onClick={() => handlePaletteSelect('custom')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedPaletteType === 'custom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Use Custom
              </button>
            </div>

            {selectedPaletteType === 'custom' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#06B6D4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={customColors.text}
                        onChange={(e) => setCustomColors({ ...customColors, text: e.target.value })}
                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.text}
                        onChange={(e) => setCustomColors({ ...customColors, text: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#1F2937"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Gradient (CSS gradient string)
                  </label>
                  <input
                    type="text"
                    value={customColors.background}
                    onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="linear-gradient(to bottom right, #ffffff, #f0f9ff, #e0f2fe)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use CSS gradient syntax or a single color (e.g., #ffffff)
                  </p>
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 rounded-lg border border-gray-300" style={{ background: customColors.background }}>
                  <div className="flex gap-2 mb-2">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: customColors.primary }}
                    />
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: customColors.secondary }}
                    />
                    <div
                      className="w-12 h-12 rounded-lg shadow-md"
                      style={{ backgroundColor: customColors.accent }}
                    />
                  </div>
                  <p style={{ color: customColors.text }} className="text-sm font-medium">
                    Preview Text Color
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Background Toggle */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Apply Background Color
                </label>
                <p className="text-xs text-gray-600">
                  Toggle whether to apply the background gradient/color to the section
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyBackground}
                  onChange={(e) => setApplyBackground(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Colors
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );

  // Use React Portal to render modal at document root level for true independence
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
