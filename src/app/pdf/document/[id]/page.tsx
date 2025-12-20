import { notFound } from "next/navigation";
import StructureRenderer from "@/app/components/StructureRenderer";
import type { SeparatedStructure } from "@/app/types/ExtractTypes";
import { getDocumentServer } from "@/app/services/HistoryApiServer";
import "./print.css";
import "./fonts.css";

// Helper function to detect Arabic text
function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Detect if document has Arabic content
function detectDocumentDirection(structure: SeparatedStructure): "rtl" | "ltr" {
  let hasArabicContent = false;

  // Check generated sections
  if (structure.generated?.sections) {
    for (const section of structure.generated.sections) {
      if (hasArabic(section.title || "") || hasArabic(section.content || "")) {
        hasArabicContent = true;
        break;
      }
    }
  }

  // Check generated tables
  if (!hasArabicContent && structure.generated?.tables) {
    for (const table of structure.generated.tables) {
      if (hasArabic(table.title || "")) {
        hasArabicContent = true;
        break;
      }
      // Check table content
      if (table.columns) {
        for (const col of table.columns) {
          if (hasArabic(String(col))) {
            hasArabicContent = true;
            break;
          }
        }
      }
      if (table.rows) {
        for (const row of table.rows) {
          if (Array.isArray(row)) {
            for (const cell of row) {
              if (hasArabic(String(cell))) {
                hasArabicContent = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Check user elements
  if (!hasArabicContent && structure.user?.elements) {
    for (const element of structure.user.elements) {
      const data = element.data || {};
      const dataStr = JSON.stringify(data);
      if (hasArabic(dataStr)) {
        hasArabicContent = true;
        break;
      }
    }
  }

  return hasArabicContent ? "rtl" : "ltr";
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PDFDocumentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // Validate document ID
  if (!id || id === 'undefined' || id === 'null') {
    console.error("Invalid document ID:", id);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Invalid Document ID</h1>
        <p>Please ensure the document is saved before generating PDF.</p>
      </div>
    );
  }

  // Fetch document using token if provided
  // The backend generates a short-lived token when generating PDF
  let document;
  try {
    // Use server-compatible version that accepts optional token
    const response = await getDocumentServer(id, token || undefined);
    document = response.document;
  } catch (error) {
    console.error("Failed to fetch document:", error, "ID:", id, "Token:", token ? "provided" : "none");
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Document Not Found</h1>
        <p>Could not load document with ID: {id}</p>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {token 
            ? "The PDF token may have expired or is invalid. Please try generating the PDF again."
            : "No authentication token provided. Please ensure you are logged in and have permission to view this document."}
        </p>
      </div>
    );
  }

  if (!document || !document.extracted_data) {
    console.error("Document missing data:", { document: !!document, extracted_data: !!document?.extracted_data });
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Document Data Missing</h1>
        <p>The document exists but has no content to display.</p>
      </div>
    );
  }

  // Normalize to SeparatedStructure format
  const structure: SeparatedStructure = {
    generated: document.extracted_data.generated || { sections: [], tables: [] },
    user: document.extracted_data.user || { elements: [] },
    layout: document.extracted_data.layout || [],
    meta: document.extracted_data.meta || {},
  };

  // Detect document direction
  const direction = detectDocumentDirection(structure);

  return (
    <div className="pdf-document-body" dir={direction}>
      <div className="pdf-container">
        <StructureRenderer
          structure={structure}
          editable={false}
          className="pdf-structure-renderer"
        />
      </div>
    </div>
  );
}

