"use client";

/**
 * Example component showing how to use the useBlocks hook
 * This is a reference implementation - adapt it to your needs
 */

import React from "react";
import { useBlocks } from "../Hooks/useBlocks";
import type { Block } from "../types/BlockTypes";

interface BlocksManagerProps {
  docId: string;
}

export default function BlocksManager({ docId }: BlocksManagerProps) {
  const {
    blocks,
    isLoading,
    error,
    total,
    updateBlock,
    addBlock,
    deleteBlock,
    reorderBlocksArray,
    moveBlockBeforeAfter,
    refreshBlocks,
  } = useBlocks(docId, true); // Auto-fetch on mount

  // Example: Update block content
  const handleUpdateBlock = async (blockId: string, newTitle: string) => {
    const success = await updateBlock(blockId, {
      content: {
        title: newTitle,
      },
    });
    if (success) {
      console.log("Block updated successfully");
    }
  };

  // Example: Add new section
  const handleAddSection = async () => {
    const maxOrder = Math.max(...blocks.map((b) => b.order), -1);
    const success = await addBlock({
      type: "section",
      content: {
        id: `section_${Date.now()}`,
        title: "New Section",
        content: "New content here",
      },
      order: maxOrder + 1,
      style: {},
      source: "user",
      is_deleted: false,
    });
    if (success) {
      console.log("Block added successfully");
    }
  };

  // Example: Delete block
  const handleDeleteBlock = async (blockId: string) => {
    if (window.confirm("Are you sure you want to delete this block?")) {
      const success = await deleteBlock(blockId);
      if (success) {
        console.log("Block deleted successfully");
      }
    }
  };

  // Example: Reorder blocks (drag and drop)
  const handleReorder = async (newOrder: string[]) => {
    const success = await reorderBlocksArray(newOrder);
    if (success) {
      console.log("Blocks reordered successfully");
    }
  };

  // Example: Move block up
  const handleMoveUp = async (blockId: string) => {
    const currentIndex = blocks.findIndex((b) => b.block_id === blockId);
    if (currentIndex > 0) {
      const targetBlock = blocks[currentIndex - 1];
      const success = await moveBlockBeforeAfter(blockId, "before", targetBlock.block_id);
      if (success) {
        console.log("Block moved up successfully");
      }
    }
  };

  // Example: Move block down
  const handleMoveDown = async (blockId: string) => {
    const currentIndex = blocks.findIndex((b) => b.block_id === blockId);
    if (currentIndex < blocks.length - 1) {
      const targetBlock = blocks[currentIndex + 1];
      const success = await moveBlockBeforeAfter(blockId, "after", targetBlock.block_id);
      if (success) {
        console.log("Block moved down successfully");
      }
    }
  };

  if (isLoading) {
    return <div>Loading blocks...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="blocks-manager">
      <div className="blocks-header">
        <h2>Document Blocks ({total})</h2>
        <button onClick={refreshBlocks}>Refresh</button>
        <button onClick={handleAddSection}>Add Section</button>
      </div>

      <div className="blocks-list">
        {blocks.map((block) => (
          <div key={block.block_id} className="block-item">
            <div className="block-header">
              <span className="block-type">{block.type}</span>
              <span className="block-source">{block.source}</span>
              <span className="block-order">Order: {block.order}</span>
            </div>
            <div className="block-content">
              {block.type === "section" && (
                <div>
                  <h3>{block.content.title || "Untitled"}</h3>
                  <p>{block.content.content?.substring(0, 100)}...</p>
                </div>
              )}
              {block.type === "table" && (
                <div>
                  <h3>Table</h3>
                  <p>Headers: {block.content.headers?.join(", ")}</p>
                  <p>Rows: {block.content.rows?.length || 0}</p>
                </div>
              )}
            </div>
            <div className="block-actions">
              <button onClick={() => handleMoveUp(block.block_id)}>↑</button>
              <button onClick={() => handleMoveDown(block.block_id)}>↓</button>
              <button onClick={() => handleDeleteBlock(block.block_id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

