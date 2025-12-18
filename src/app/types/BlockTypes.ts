/**
 * Type definitions for block-based document editing
 */

export interface BlockStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: "left" | "center" | "right" | "justify";
}

export interface Block {
  id: string;
  block_id: string;
  document_id: string;
  type: "section" | "table" | "text" | "component";
  content: Record<string, any>;
  order: number;
  style: BlockStyle;
  source: "ocr" | "user";
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockListResponse {
  blocks: Block[];
  total: number;
  document_id: string;
}

export interface BlockOperation {
  action: "update" | "add" | "delete";
  block_id?: string;
  block?: BlockCreate;
  changes?: Record<string, any>;
}

export interface BlockCreate {
  block_id?: string;
  document_id: string;
  type: "section" | "table" | "text" | "component";
  content: Record<string, any>;
  order: number;
  style?: BlockStyle;
  source: "ocr" | "user";
  is_deleted?: boolean;
}

export interface BlockUpdate {
  content?: Record<string, any>;
  order?: number;
  style?: BlockStyle;
  is_deleted?: boolean;
}

export interface GetBlocksOptions {
  includeDeleted?: boolean;
  source?: "ocr" | "user";
}

