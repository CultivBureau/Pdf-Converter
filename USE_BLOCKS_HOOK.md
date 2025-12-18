# useBlocks Hook - Usage Guide

## Overview

The `useBlocks` hook provides a simple, React-friendly interface for managing document blocks. It wraps all the block API functions and handles state management automatically.

## Installation

The hook is already available at:
```
src/app/Hooks/useBlocks.ts
```

## Basic Usage

```tsx
import { useBlocks } from "@/app/Hooks/useBlocks";

function MyComponent({ docId }: { docId: string }) {
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

  // Use the hook...
}
```

## Hook API

### State

- `blocks: Block[]` - Array of blocks
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message if any
- `total: number` - Total number of blocks

### Actions

- `fetchBlocks(options?)` - Fetch blocks (with optional filters)
- `updateBlock(blockId, changes)` - Update a block
- `addBlock(block)` - Add a new block
- `deleteBlock(blockId)` - Delete a block
- `reorderBlocksArray(blockIds)` - Reorder blocks (simple method)
- `moveBlockBeforeAfter(blockId, position, targetBlockId)` - Move block
- `refreshBlocks()` - Refresh blocks list
- `reset()` - Reset all state

## Examples

### Example 1: Display Blocks

```tsx
function BlocksList({ docId }: { docId: string }) {
  const { blocks, isLoading, error } = useBlocks(docId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {blocks.map((block) => (
        <div key={block.block_id}>
          <h3>{block.content.title}</h3>
          <p>{block.content.content}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Edit Block

```tsx
function EditableBlock({ docId, blockId }: { docId: string; blockId: string }) {
  const { updateBlock } = useBlocks(docId, false); // Don't auto-fetch

  const handleSave = async (newTitle: string) => {
    const success = await updateBlock(blockId, {
      content: { title: newTitle },
    });
    if (success) {
      alert("Updated!");
    }
  };

  return (
    <input
      onBlur={(e) => handleSave(e.target.value)}
      placeholder="Block title"
    />
  );
}
```

### Example 3: Drag and Drop Reordering

```tsx
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function DraggableBlocks({ docId }: { docId: string }) {
  const { blocks, reorderBlocksArray } = useBlocks(docId);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const blockIds = items.map((item) => item.block_id);
    reorderBlocksArray(blockIds);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="blocks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {blocks.map((block, index) => (
              <Draggable
                key={block.block_id}
                draggableId={block.block_id}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {block.content.title}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

### Example 4: Move Up/Down Buttons

```tsx
function BlockWithControls({ docId, block }: { docId: string; block: Block }) {
  const { blocks, moveBlockBeforeAfter } = useBlocks(docId, false);

  const handleMoveUp = async () => {
    const currentIndex = blocks.findIndex((b) => b.block_id === block.block_id);
    if (currentIndex > 0) {
      const targetBlock = blocks[currentIndex - 1];
      await moveBlockBeforeAfter(block.block_id, "before", targetBlock.block_id);
    }
  };

  const handleMoveDown = async () => {
    const currentIndex = blocks.findIndex((b) => b.block_id === block.block_id);
    if (currentIndex < blocks.length - 1) {
      const targetBlock = blocks[currentIndex + 1];
      await moveBlockBeforeAfter(block.block_id, "after", targetBlock.block_id);
    }
  };

  return (
    <div>
      <button onClick={handleMoveUp}>↑</button>
      <button onClick={handleMoveDown}>↓</button>
      <h3>{block.content.title}</h3>
    </div>
  );
}
```

### Example 5: Add New Block

```tsx
function AddBlockButton({ docId }: { docId: string }) {
  const { blocks, addBlock } = useBlocks(docId, false);

  const handleAdd = async () => {
    const maxOrder = Math.max(...blocks.map((b) => b.order), -1);
    const success = await addBlock({
      type: "section",
      content: {
        id: `section_${Date.now()}`,
        title: "New Section",
        content: "Content here",
      },
      order: maxOrder + 1,
      style: {},
      source: "user",
      is_deleted: false,
    });
    if (success) {
      alert("Block added!");
    }
  };

  return <button onClick={handleAdd}>Add Section</button>;
}
```

### Example 6: Filter Blocks

```tsx
function FilteredBlocks({ docId }: { docId: string }) {
  const { blocks, fetchBlocks } = useBlocks(docId, false);

  useEffect(() => {
    // Fetch only OCR blocks
    fetchBlocks({ source: "ocr" });
  }, [docId]);

  return (
    <div>
      {blocks.map((block) => (
        <div key={block.block_id}>{block.content.title}</div>
      ))}
    </div>
  );
}
```

## Integration with Existing Components

### Option 1: Use Hook Directly in Component

```tsx
// In your existing component
import { useBlocks } from "@/app/Hooks/useBlocks";

function CodePreviewPage() {
  const docId = "...";
  const { blocks, updateBlock } = useBlocks(docId);

  // Use blocks in your component
}
```

### Option 2: Create Wrapper Component

```tsx
// Create a BlocksProvider component
function BlocksProvider({ docId, children }) {
  const blocksData = useBlocks(docId);
  return (
    <BlocksContext.Provider value={blocksData}>
      {children}
    </BlocksContext.Provider>
  );
}
```

### Option 3: Use Alongside Existing Code

```tsx
// Keep existing extracted_data flow
// Add blocks API for specific operations
function MyComponent({ docId }) {
  const { blocks } = useBlocks(docId);
  
  // Use blocks for editing
  // Use extracted_data for display (if needed)
}
```

## Best Practices

1. **Auto-fetch vs Manual**: Use `autoFetch: true` for simple cases, `false` for more control
2. **Error Handling**: Always check `error` state and handle it
3. **Loading States**: Show loading indicator when `isLoading` is true
4. **Optimistic Updates**: Consider updating local state immediately, then sync with API
5. **Refresh After Changes**: Call `refreshBlocks()` after external changes

## Migration Path

1. **Phase 1**: Add hook alongside existing code (no changes)
2. **Phase 2**: Use hook for new features (editing, reordering)
3. **Phase 3**: Gradually migrate existing features to use blocks

The hook is **additive** - it doesn't break existing functionality!

