"use client";

/**
 * Draggable Block List Component
 * Provides drag-and-drop reordering for document blocks
 */

import React, { useState, useCallback } from "react";
import type { Block } from "../types/BlockTypes";

interface DraggableBlockListProps {
  blocks: Block[];
  onReorder: (blockIds: string[]) => Promise<boolean>;
  onBlockClick?: (block: Block) => void;
  renderBlock: (block: Block, index: number) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function DraggableBlockList({
  blocks,
  onReorder,
  onBlockClick,
  renderBlock,
  className = "",
  disabled = false,
}: DraggableBlockListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (disabled) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", index.toString());
      // Add visual feedback
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = "0.5";
      }
    },
    [disabled]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (disabled || draggedIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [disabled, draggedIndex]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      if (disabled || draggedIndex === null) return;
      e.preventDefault();

      if (draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      // Calculate new order
      const newBlocks = [...sortedBlocks];
      const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(dropIndex, 0, draggedBlock);

      // Extract block IDs in new order
      const newBlockIds = newBlocks.map((block) => block.block_id);

      // Update via API
      setIsReordering(true);
      try {
        const success = await onReorder(newBlockIds);
        if (!success) {
          console.error("Failed to reorder blocks");
        }
      } catch (error) {
        console.error("Error reordering blocks:", error);
      } finally {
        setIsReordering(false);
        setDraggedIndex(null);
        setDragOverIndex(null);
      }
    },
    [disabled, draggedIndex, sortedBlocks, onReorder]
  );

  if (sortedBlocks.length === 0) {
    return (
      <div className={`text-gray-500 text-center py-8 ${className}`}>
        No blocks to display
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedBlocks.map((block, index) => {
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={block.block_id}
            draggable={!disabled && !isReordering}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onBlockClick?.(block)}
            className={`
              relative
              transition-all duration-200
              ${isDragging ? "opacity-50 scale-95" : ""}
              ${isDragOver ? "transform translate-y-2 border-t-4 border-t-blue-500" : ""}
              ${disabled || isReordering ? "cursor-not-allowed opacity-60" : "cursor-move"}
              ${onBlockClick ? "cursor-pointer hover:bg-gray-50" : ""}
            `}
            style={{
              cursor: disabled || isReordering ? "not-allowed" : "move",
            }}
          >
            {/* Drag handle indicator */}
            {!disabled && !isReordering && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 hover:bg-blue-500 transition-colors rounded-l" />
            )}

            {/* Block content */}
            <div className="pl-4">{renderBlock(block, index)}</div>

            {/* Drop indicator */}
            {isDragOver && draggedIndex !== null && draggedIndex !== index && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded" />
            )}
          </div>
        );
      })}

      {/* Loading overlay */}
      {isReordering && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              <span className="text-gray-700">Reordering blocks...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

