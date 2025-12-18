"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getBlocks,
  updateBlocks,
  reorderBlocks,
  reorderBlocksSimple,
  moveBlock,
} from "@/app/services/PdfApi";
import type {
  Block,
  BlockListResponse,
  BlockOperation,
  GetBlocksOptions,
} from "@/app/types/BlockTypes";

export interface UseBlocksReturn {
  // State
  blocks: Block[];
  isLoading: boolean;
  error: string | null;
  total: number;

  // Actions
  fetchBlocks: (options?: GetBlocksOptions) => Promise<void>;
  updateBlock: (blockId: string, changes: Record<string, any>) => Promise<boolean>;
  addBlock: (block: Omit<Block, "id" | "block_id" | "created_at" | "updated_at">) => Promise<boolean>;
  deleteBlock: (blockId: string) => Promise<boolean>;
  reorderBlocksArray: (blockIds: string[]) => Promise<boolean>;
  moveBlockBeforeAfter: (blockId: string, position: "before" | "after", targetBlockId: string) => Promise<boolean>;
  refreshBlocks: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing document blocks
 * Provides a simple interface for block CRUD operations
 * 
 * @param docId - Document ID
 * @param autoFetch - Automatically fetch blocks on mount (default: true)
 * @param initialOptions - Initial options for fetching blocks
 */
export function useBlocks(
  docId: string | null,
  autoFetch: boolean = true,
  initialOptions?: GetBlocksOptions
): UseBlocksReturn {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [lastOptions, setLastOptions] = useState<GetBlocksOptions | undefined>(initialOptions);

  /**
   * Fetch blocks from API
   */
  const fetchBlocks = useCallback(
    async (options?: GetBlocksOptions) => {
      if (!docId) {
        setError("Document ID is required");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response: BlockListResponse = await getBlocks(docId, options || lastOptions);
        setBlocks(response.blocks);
        setTotal(response.total);
        if (options) {
          setLastOptions(options);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch blocks";
        setError(message);
        console.error("Failed to fetch blocks:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [docId, lastOptions]
  );

  /**
   * Refresh blocks (re-fetch with last options)
   */
  const refreshBlocks = useCallback(async () => {
    await fetchBlocks();
  }, [fetchBlocks]);

  /**
   * Update a block
   */
  const updateBlock = useCallback(
    async (blockId: string, changes: Record<string, any>): Promise<boolean> => {
      if (!docId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const operations: BlockOperation[] = [
          {
            action: "update",
            block_id: blockId,
            changes,
          },
        ];

        const response: BlockListResponse = await updateBlocks(docId, operations);
        setBlocks(response.blocks);
        setTotal(response.total);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update block";
        setError(message);
        console.error("Failed to update block:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  /**
   * Add a new block
   */
  const addBlock = useCallback(
    async (
      block: Omit<Block, "id" | "block_id" | "created_at" | "updated_at">
    ): Promise<boolean> => {
      if (!docId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const operations: BlockOperation[] = [
          {
            action: "add",
            block: {
              ...block,
              document_id: docId,
            },
          },
        ];

        const response: BlockListResponse = await updateBlocks(docId, operations);
        setBlocks(response.blocks);
        setTotal(response.total);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add block";
        setError(message);
        console.error("Failed to add block:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  /**
   * Delete a block (soft delete)
   */
  const deleteBlock = useCallback(
    async (blockId: string): Promise<boolean> => {
      if (!docId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const operations: BlockOperation[] = [
          {
            action: "delete",
            block_id: blockId,
          },
        ];

        const response: BlockListResponse = await updateBlocks(docId, operations);
        setBlocks(response.blocks);
        setTotal(response.total);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete block";
        setError(message);
        console.error("Failed to delete block:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  /**
   * Reorder blocks using simple array method
   */
  const reorderBlocksArray = useCallback(
    async (blockIds: string[]): Promise<boolean> => {
      if (!docId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response: BlockListResponse = await reorderBlocksSimple(docId, blockIds);
        setBlocks(response.blocks);
        setTotal(response.total);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reorder blocks";
        setError(message);
        console.error("Failed to reorder blocks:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  /**
   * Move a block before or after another block
   */
  const moveBlockBeforeAfter = useCallback(
    async (
      blockId: string,
      position: "before" | "after",
      targetBlockId: string
    ): Promise<boolean> => {
      if (!docId) {
        setError("Document ID is required");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response: BlockListResponse = await moveBlock(docId, blockId, position, targetBlockId);
        setBlocks(response.blocks);
        setTotal(response.total);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to move block";
        setError(message);
        console.error("Failed to move block:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setBlocks([]);
    setIsLoading(false);
    setError(null);
    setTotal(0);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && docId) {
      fetchBlocks(initialOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, autoFetch]); // Only depend on docId and autoFetch

  return {
    // State
    blocks,
    isLoading,
    error,
    total,

    // Actions
    fetchBlocks,
    updateBlock,
    addBlock,
    deleteBlock,
    reorderBlocksArray,
    moveBlockBeforeAfter,
    refreshBlocks,
    reset,
  };
}

