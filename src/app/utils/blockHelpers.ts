/**
 * Helper utilities for working with blocks and JSX code
 */

import type { Block } from "../types/BlockTypes";

/**
 * Find a block by its content ID (section.id or table.id)
 */
export function findBlockByContentId(blocks: Block[], contentId: string): Block | undefined {
  return blocks.find(
    (block) =>
      block.content?.id === contentId ||
      block.content?.section_id === contentId ||
      block.content?.table_id === contentId
  );
}

/**
 * Find a block by section index (for sections)
 */
export function findBlockBySectionIndex(blocks: Block[], sectionIndex: number): Block | undefined {
  const sectionBlocks = blocks
    .filter((b) => b.type === "section" && !b.is_deleted)
    .sort((a, b) => a.order - b.order);
  return sectionBlocks[sectionIndex];
}

/**
 * Find a block by table index (for tables)
 */
export function findBlockByTableIndex(blocks: Block[], tableIndex: number): Block | undefined {
  const tableBlocks = blocks
    .filter((b) => b.type === "table" && !b.is_deleted)
    .sort((a, b) => a.order - b.order);
  return tableBlocks[tableIndex];
}

/**
 * Get all blocks sorted by order
 */
export function getSortedBlocks(blocks: Block[]): Block[] {
  return blocks
    .filter((b) => !b.is_deleted)
    .sort((a, b) => a.order - b.order);
}

/**
 * Extract section index from block
 * This matches sections in JSX code by title or content
 */
export function getSectionIndexFromBlock(
  block: Block,
  parsedCode: { sections: Array<{ title?: string; content?: string }> }
): number | null {
  if (block.type !== "section") return null;

  const blockTitle = block.content?.title || "";
  const blockContent = block.content?.content || "";

  // Try to match by title first
  if (blockTitle) {
    const index = parsedCode.sections.findIndex(
      (s) => s.title?.trim() === blockTitle.trim()
    );
    if (index >= 0) return index;
  }

  // Try to match by content
  if (blockContent) {
    const index = parsedCode.sections.findIndex(
      (s) => s.content?.trim() === blockContent.trim()
    );
    if (index >= 0) return index;
  }

  return null;
}

/**
 * Create a block from section data
 */
export function createSectionBlock(
  documentId: string,
  section: { title?: string; content?: string; type?: string },
  order: number,
  source: "ocr" | "user" = "user"
): Omit<Block, "id" | "block_id" | "created_at" | "updated_at"> {
  return {
    document_id: documentId,
    type: "section",
    content: {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: section.title || "",
      content: section.content || "",
      type: section.type || "section",
    },
    order,
    style: {},
    source,
    is_deleted: false,
  };
}

/**
 * Create a block from table data
 */
export function createTableBlock(
  documentId: string,
  table: { title?: string; columns?: string[]; rows?: any[][] },
  order: number,
  source: "ocr" | "user" = "user"
): Omit<Block, "id" | "block_id" | "created_at" | "updated_at"> {
  return {
    document_id: documentId,
    type: "table",
    content: {
      id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: table.title || "",
      headers: table.columns || [],
      rows: table.rows || [],
    },
    order,
    style: {},
    source,
    is_deleted: false,
  };
}

/**
 * Check if blocks are available and usable
 */
export function canUseBlocks(blocks: Block[], documentId: string | null): boolean {
  return documentId !== null && blocks.length > 0;
}

/**
 * Reorder sections in JSX code to match block order
 * This syncs the code with the new block order after reordering
 */
export function reorderCodeByBlocks(
  code: string,
  blocks: Block[]
): string {
  // Get sorted blocks (sections only, in order)
  const sortedBlocks = getSortedBlocks(blocks);
  const sectionBlocks = sortedBlocks.filter((b) => b.type === "section");
  
  if (sectionBlocks.length === 0) {
    return code; // No sections to reorder
  }
  
  // Parse the code to get current sections
  const { parseJSXCode } = require('./jsxParser');
  const parsed = parseJSXCode(code);
  
  if (parsed.sections.length !== sectionBlocks.length) {
    console.warn(
      `Block count (${sectionBlocks.length}) doesn't match section count (${parsed.sections.length}). Skipping reorder.`
    );
    return code;
  }
  
  // Create a map: block order -> section index in code
  const blockOrderToCodeIndex = new Map<number, number>();
  
  // Match blocks to sections by title/content
  sectionBlocks.forEach((block) => {
    const blockTitle = block.content?.title?.trim() || '';
    const blockContent = block.content?.content?.trim() || '';
    
    // Find matching section in code
    const codeIndex = parsed.sections.findIndex((section) => {
      const sectionTitle = section.title?.trim() || '';
      const sectionContent = section.content?.trim() || '';
      
      // Match by title first (most reliable)
      if (blockTitle && sectionTitle && blockTitle === sectionTitle) {
        return true;
      }
      // Fallback: match by content
      if (blockContent && sectionContent && blockContent === sectionContent) {
        return true;
      }
      return false;
    });
    
    if (codeIndex >= 0) {
      blockOrderToCodeIndex.set(block.order, codeIndex);
    }
  });
  
  // If we couldn't match all blocks, return original code
  if (blockOrderToCodeIndex.size !== sectionBlocks.length) {
    console.warn('Could not match all blocks to sections. Skipping reorder.');
    return code;
  }
  
  // Get the target order: section indices in the order they should appear
  const targetOrder: number[] = [];
  sectionBlocks.forEach((block) => {
    const codeIndex = blockOrderToCodeIndex.get(block.order);
    if (codeIndex !== undefined) {
      targetOrder.push(codeIndex);
    }
  });
  
  // Reorder sections using moveSection
  const { moveSection } = require('./codeManipulator');
  let updatedCode = code;
  
  // Track current positions
  const currentPositions = [...targetOrder];
  
  // Move each section to its target position
  for (let targetPos = 0; targetPos < targetOrder.length; targetPos++) {
    const targetCodeIndex = targetOrder[targetPos];
    const currentPos = currentPositions.indexOf(targetCodeIndex);
    
    if (currentPos !== targetPos && currentPos >= 0) {
      // Move section from currentPos to targetPos
      updatedCode = moveSection(updatedCode, currentPos, targetPos);
      
      // Update currentPositions to reflect the move
      const [moved] = currentPositions.splice(currentPos, 1);
      currentPositions.splice(targetPos, 0, moved);
    }
  }
  
  return updatedCode;
}

