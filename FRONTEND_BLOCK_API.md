# Frontend Block API Usage Guide

## Overview

New block management functions have been added to `PdfApi.js` to support the block-based editing system. These functions allow you to work with individual blocks (sections, tables) instead of the entire document structure.

## Available Functions

### 1. Get Blocks

```javascript
import { getBlocks } from '@/app/services/PdfApi';

// Get all blocks
const response = await getBlocks(docId);
console.log(response.blocks); // Array of blocks
console.log(response.total);   // Total count

// Get only OCR blocks
const ocrBlocks = await getBlocks(docId, { source: 'ocr' });

// Get only user-created blocks
const userBlocks = await getBlocks(docId, { source: 'user' });

// Include deleted blocks
const allBlocks = await getBlocks(docId, { includeDeleted: true });
```

**Response:**
```javascript
{
  blocks: [
    {
      id: "...",
      block_id: "uuid-...",
      document_id: "...",
      type: "section" | "table" | "text" | "component",
      content: { ... },
      order: 0,
      style: { bold: false, italic: false, ... },
      source: "ocr" | "user",
      is_deleted: false,
      created_at: "...",
      updated_at: "..."
    }
  ],
  total: 5,
  document_id: "..."
}
```

---

### 2. Update Blocks

```javascript
import { updateBlocks } from '@/app/services/PdfApi';

// Update a block's content and style
await updateBlocks(docId, [
  {
    action: "update",
    block_id: "uuid-123",
    changes: {
      content: {
        title: "Updated Title",
        content: "Updated content"
      },
      style: {
        bold: true,
        italic: false
      }
    }
  }
]);

// Add a new block
await updateBlocks(docId, [
  {
    action: "add",
    block: {
      block_id: "uuid-999", // Or omit to auto-generate
      document_id: docId,
      type: "section",
      content: {
        id: "section_new",
        title: "New Section",
        content: "New content"
      },
      order: 999,
      source: "user"
    }
  }
]);

// Delete a block (soft delete)
await updateBlocks(docId, [
  {
    action: "delete",
    block_id: "uuid-123"
  }
]);

// Multiple operations at once
await updateBlocks(docId, [
  { action: "update", block_id: "uuid-1", changes: { ... } },
  { action: "add", block: { ... } },
  { action: "delete", block_id: "uuid-2" }
]);
```

---

### 3. Reorder Blocks (Simple Method) ⭐ Recommended

```javascript
import { reorderBlocksSimple } from '@/app/services/PdfApi';

// Just send block IDs in the order you want
await reorderBlocksSimple(docId, [
  "uuid-3",  // Will be order 0
  "uuid-1",  // Will be order 1
  "uuid-2"   // Will be order 2
]);

// Perfect for drag-and-drop
const newOrder = blocks.map(b => b.block_id); // After drag
await reorderBlocksSimple(docId, newOrder);
```

---

### 4. Move Block Before/After ⭐ Recommended for Single Moves

```javascript
import { moveBlock } from '@/app/services/PdfApi';

// Move block-2 before block-1
await moveBlock(docId, "uuid-2", "before", "uuid-1");

// Move block-2 after block-1
await moveBlock(docId, "uuid-2", "after", "uuid-1");

// Perfect for "Move Up" / "Move Down" buttons
async function moveBlockUp(docId, blockId) {
  const blocks = await getBlocks(docId);
  const currentIndex = blocks.blocks.findIndex(b => b.block_id === blockId);
  if (currentIndex > 0) {
    const targetBlock = blocks.blocks[currentIndex - 1];
    await moveBlock(docId, blockId, "before", targetBlock.block_id);
  }
}

async function moveBlockDown(docId, blockId) {
  const blocks = await getBlocks(docId);
  const currentIndex = blocks.blocks.findIndex(b => b.block_id === blockId);
  if (currentIndex < blocks.blocks.length - 1) {
    const targetBlock = blocks.blocks[currentIndex + 1];
    await moveBlock(docId, blockId, "after", targetBlock.block_id);
  }
}
```

---

### 5. Reorder Blocks (Old Method - Full Control)

```javascript
import { reorderBlocks } from '@/app/services/PdfApi';

// Explicit order values (use when you need precise control)
await reorderBlocks(docId, [
  { block_id: "uuid-1", order: 0 },
  { block_id: "uuid-2", order: 1 },
  { block_id: "uuid-3", order: 2 }
]);
```

---

## Common Use Cases

### Drag and Drop Reordering

```javascript
// User drags block to new position
function handleDragEnd(result) {
  if (!result.destination) return;
  
  const items = Array.from(blocks);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  
  // Update order
  const blockIds = items.map(item => item.block_id);
  await reorderBlocksSimple(docId, blockIds);
}
```

### Edit Block Content

```javascript
// User edits a section title
async function updateSectionTitle(docId, blockId, newTitle) {
  await updateBlocks(docId, [
    {
      action: "update",
      block_id: blockId,
      changes: {
        content: {
          title: newTitle
        }
      }
    }
  ]);
}
```

### Add New Section

```javascript
// User adds a new section
async function addNewSection(docId, title, content) {
  const blocks = await getBlocks(docId);
  const maxOrder = Math.max(...blocks.blocks.map(b => b.order), -1);
  
  await updateBlocks(docId, [
    {
      action: "add",
      block: {
        document_id: docId,
        type: "section",
        content: {
          id: `section_${Date.now()}`,
          title: title,
          content: content
        },
        order: maxOrder + 1,
        source: "user"
      }
    }
  ]);
}
```

### Delete Block

```javascript
// User deletes a block
async function deleteBlock(docId, blockId) {
  await updateBlocks(docId, [
    {
      action: "delete",
      block_id: blockId
    }
  ]);
}
```

### Apply Formatting

```javascript
// Make text bold
async function makeBold(docId, blockId) {
  await updateBlocks(docId, [
    {
      action: "update",
      block_id: blockId,
      changes: {
        style: {
          bold: true
        }
      }
    }
  ]);
}
```

---

## Integration with Existing Code

### Option 1: Use Blocks API for Edits (Recommended)

```javascript
// Instead of sending full extracted_data on every save
// Use blocks API for edits, then save only jsx_code

// Edit blocks
await updateBlocks(docId, operations);

// Save document (without extracted_data - blocks are already updated)
await updateDocument(docId, {
  jsx_code: updatedCode,
  metadata: { ... }
});
```

### Option 2: Hybrid Approach

```javascript
// Use blocks for frequent edits
await updateBlocks(docId, operations);

// Use extracted_data only when structure fundamentally changes
await updateDocument(docId, {
  extracted_data: newStructure,
  jsx_code: updatedCode
});
```

---

## Error Handling

```javascript
import { getBlocks, updateBlocks, moveBlock } from '@/app/services/PdfApi';

try {
  const blocks = await getBlocks(docId);
  // ... use blocks
} catch (error) {
  console.error("Failed to get blocks:", error.message);
  // Handle error (show toast, etc.)
}

try {
  await updateBlocks(docId, operations);
  // Show success message
} catch (error) {
  console.error("Failed to update blocks:", error.message);
  // Handle error
}
```

---

## Benefits

✅ **No Duplication:** Each block has immutable ID
✅ **No Data Loss:** Operations are atomic
✅ **Efficient:** Only send changes, not entire document
✅ **Simple:** Easy-to-use functions
✅ **Flexible:** Multiple ways to reorder (simple, move, explicit)

---

## Migration Path

1. **Phase 1 (Current):** Keep using `extracted_data` for saves
2. **Phase 2 (Optional):** Start using blocks API for edits
3. **Phase 3 (Future):** Fully migrate to blocks-based editing

The new functions are **additive** - existing code continues to work!

