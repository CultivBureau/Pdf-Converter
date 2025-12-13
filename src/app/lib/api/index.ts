/**
 * PDF Converter Backend - Frontend SDK
 * 
 * Complete TypeScript SDK for integrating with PDF Converter Backend API
 * Adapted for Next.js with cookie-based token management
 */

export * from './types';
export * from './client';
export { PDFConverterClient, apiClient } from './client';

// Re-export for convenience
export { apiClient as pdfConverterClient } from './client';

