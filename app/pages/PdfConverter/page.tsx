"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  uploadFile, 
  generateNextJs, 
  repairTable, 
  tableToJsx, 
  validateAndFixJsx 
} from "../../services/PdfApi";

/**
 * Extract table data from extracted text
 * Looks for TABLE_START markers and extracts table structure
 */
function extractTablesFromText(text: string): Array<{
  tableId: string;
  metadata: { rows: number; columns: number };
  header: string[];
  rows: string[][];
}> {
  const tables: Array<{
    tableId: string;
    metadata: { rows: number; columns: number };
    header: string[];
    rows: string[][];
  }> = [];

  // Find all table start markers
  const tableStartRegex = /--- TABLE START (\d+) ---/g;
  const tableEndRegex = /--- TABLE END (\d+) ---/g;
  
  let match;
  const tableStarts: Array<{ num: number; index: number }> = [];
  const tableEnds: Array<{ num: number; index: number }> = [];

  while ((match = tableStartRegex.exec(text)) !== null) {
    tableStarts.push({ num: parseInt(match[1]), index: match.index });
  }

  while ((match = tableEndRegex.exec(text)) !== null) {
    tableEnds.push({ num: parseInt(match[1]), index: match.index });
  }

  // Process each table
  for (const start of tableStarts) {
    const end = tableEnds.find(e => e.num === start.num);
    if (!end) continue;

    const tableText = text.substring(start.index, end.index + end.num.toString().length + 15);
    
    // Extract metadata
    const metadataMatch = tableText.match(/TABLE_METADATA:\s*rows=(\d+),\s*columns=(\d+)/);
    if (!metadataMatch) continue;

    const rows = parseInt(metadataMatch[1]);
    const columns = parseInt(metadataMatch[2]);

    // Extract header
    const headerMatch = tableText.match(/TABLE_HEADER:\s*([\s\S]+?)(?:\n|TABLE_ROW|TABLE_END)/);
    if (!headerMatch) continue;

    const header = headerMatch[1]
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // Extract rows
    const rowRegex = /TABLE_ROW\s+(\d+):\s*([\s\S]+?)(?:\n|TABLE_ROW|TABLE_END)/g;
    const tableRows: string[][] = [];
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableText)) !== null) {
      const rowData = rowMatch[2]
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
      
      if (rowData.length > 0) {
        tableRows.push(rowData);
      }
    }

    if (header.length > 0 && tableRows.length > 0) {
      tables.push({
        tableId: `table_${start.num}`,
        metadata: { rows, columns },
        header,
        rows: tableRows,
      });
    }
  }

  return tables;
}

/**
 * Convert extracted table to raw_cells format for repairTable API
 */
function tableToRawCells(
  table: {
    tableId: string;
    metadata: { rows: number; columns: number };
    header: string[];
    rows: string[][];
  }
): Array<{ row: number; col: number; text: string; confidence?: number }> {
  const cells: Array<{ row: number; col: number; text: string; confidence?: number }> = [];

  // Add header row (row 0)
  table.header.forEach((text, col) => {
    cells.push({
      row: 0,
      col,
      text,
      confidence: 0.95,
    });
  });

  // Add data rows
  table.rows.forEach((rowData, rowIndex) => {
    rowData.forEach((text, col) => {
      cells.push({
        row: rowIndex + 1,
        col,
        text,
        confidence: 0.90,
      });
    });
  });

  return cells;
}

const PdfConverter: React.FC = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose a PDF before submitting.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setStatus("Uploading file…");

      const uploadResponse = await uploadFile(selectedFile);
      const extractedText = uploadResponse.extracted_text;
      if (!extractedText) {
        throw new Error("Extraction returned empty text.");
      }

      // Extract and process tables if present
      const extractedTables = extractTablesFromText(extractedText);
      const processedTables: Array<{ tableId: string; jsx: string }> = [];

      if (extractedTables.length > 0) {
        setStatus(`Processing ${extractedTables.length} table(s)…`);
        
        for (const table of extractedTables) {
          try {
            // Convert to raw_cells format
            const rawCells = tableToRawCells(table);
            
            // Repair the table
            const repairData = {
              table_id: table.tableId,
              page: 1,
              detected_columns: table.metadata.columns,
              raw_cells: rawCells,
              notes: `Extracted from PDF with ${table.metadata.rows} rows and ${table.metadata.columns} columns`,
              max_retries: 2,
            };

            setStatus(`Repairing table ${table.tableId}…`);
            const repaired = await repairTable(repairData) as {
              success: boolean;
              table_id: string;
              columns: number;
              header_row_index: number;
              rows: Array<Array<{
                text: string;
                colspan: number;
                rowspan: number;
                confidence: number;
              }>>;
              issues: Array<{ type: string; description: string }>;
            };
            
            if (repaired.success && repaired.rows.length > 0) {
              // Convert to JSX
              setStatus(`Converting table ${table.tableId} to JSX…`);
              const jsxResponse = await tableToJsx({
                table_id: repaired.table_id,
                columns: repaired.columns,
                header_row_index: repaired.header_row_index,
                rows: repaired.rows.map((row: Array<{ text: string; colspan: number; rowspan: number; confidence: number }>) => 
                  row.map((cell: { text: string; colspan: number; rowspan: number; confidence: number }) => ({
                    text: cell.text,
                    colspan: cell.colspan,
                    rowspan: cell.rowspan,
                    confidence: cell.confidence,
                  }))
                ),
                issues: repaired.issues,
              }) as { success: boolean; jsx: string; warnings: string[] };

              if (jsxResponse.jsx) {
                // Validate and fix JSX if needed
                const validated = await validateAndFixJsx(jsxResponse.jsx) as {
                  jsx: string;
                  warnings: string[];
                  fixed: boolean;
                };
                processedTables.push({
                  tableId: table.tableId,
                  jsx: validated.jsx,
                });
              }
            }
          } catch (tableError) {
            console.warn(`Failed to process table ${table.tableId}:`, tableError);
            // Continue with other tables
          }
        }
      }

      setStatus("Generating component from extracted text…");
      const nextJsResponse = await generateNextJs(extractedText);
      let generatedCode = nextJsResponse.code?.code;
      if (!generatedCode) {
        throw new Error("Generation returned empty code.");
      }

      // If we have processed tables, we could merge them into the code
      // For now, the backend should handle tables in the extracted text
      // But we store processed tables in sessionStorage for potential future use
      if (processedTables.length > 0 && typeof window !== "undefined") {
        sessionStorage.setItem(
          "codePreview.processedTables",
          JSON.stringify(processedTables)
        );
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("codePreview.initialCode", generatedCode);
        sessionStorage.setItem(
          "codePreview.warnings",
          JSON.stringify(nextJsResponse.validation_warnings || []),
        );
        sessionStorage.setItem(
          "codePreview.metadata",
          JSON.stringify({
            filename: uploadResponse.filename || selectedFile.name,
            uploadedAt: new Date().toISOString(),
          }),
        );
      }

      setStatus("Opening editor…");
      router.push("/pages/CodePreview");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100"
        >
          <h1 className="text-2xl font-semibold text-gray-900">
            Upload a PDF and generate its editable template
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We’ll extract the text, build the Tailwind-based Next.js component,
            and open it in the live editor for you.
          </p>

          <label className="mt-6 block text-sm font-medium text-gray-700">
            Select PDF
          </label>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            className="mt-2 w-full cursor-pointer rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {error && (
            <p className="mt-3 text-sm text-red-600">
              Error: {error}
            </p>
          )}

          {status && (
            <p className="mt-3 text-sm text-indigo-600">{status}</p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="mt-6 inline-flex w-full items-center justify-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isProcessing ? "Processing…" : "Upload & Generate"}
          </button>

          <p className="mt-4 text-xs text-gray-500">
            Need a fresh start? You can always tweak the generated code inside
            the editor once it opens.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PdfConverter;

