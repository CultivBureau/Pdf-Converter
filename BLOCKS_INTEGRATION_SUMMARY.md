# Blocks Integration in CodePreview Page

## Overview

The CodePreview page now uses the `useBlocks` hook to manage document blocks alongside the existing code manipulation system. This provides a **smart, hybrid approach** that:

1. ✅ Uses blocks API when available (for saved documents)
2. ✅ Falls back to code manipulation (for new/unsaved documents)
3. ✅ Maintains backward compatibility
4. ✅ Provides seamless user experience

## Integration Points

### 1. **Hook Initialization**
```typescript
const {
  blocks,
  isLoading: blocksLoading,
  error: blocksError,
  updateBlock,
  addBlock,
  deleteBlock,
  reorderBlocksArray,
  moveBlockBeforeAfter,
  refreshBlocks,
} = useBlocks(documentId, false); // Manual fetch when document loads
```

### 2. **Block Operations Integrated**

#### ✅ **Add Section**
- When user clicks "+" button to add section
- Uses `addBlock()` if blocks available
- Falls back to `addSection()` code manipulation

#### ✅ **Delete Section**
- When user double-clicks section to delete
- Uses `deleteBlock()` if blocks available
- Falls back to `removeSection()` code manipulation

#### ✅ **Update Section Content**
- When user edits section title/content
- Uses `updateBlock()` if blocks available
- Also updates code for immediate UI feedback

#### ✅ **Create Table**
- When user creates new table via modal
- Uses `addBlock()` with table type if blocks available
- Falls back to `addNewTable()` code manipulation

### 3. **Helper Functions**

Created `blockHelpers.ts` with utilities:
- `findBlockBySectionIndex()` - Find block by section index
- `findBlockByTableIndex()` - Find block by table index
- `getSortedBlocks()` - Get blocks sorted by order
- `createSectionBlock()` - Create section block from data
- `createTableBlock()` - Create table block from data
- `canUseBlocks()` - Check if blocks are available

## How It Works

### Flow Diagram

```
User Action (Add/Edit/Delete)
    ↓
Can use blocks? (documentId + blocks available)
    ↓ YES                    ↓ NO
Use Blocks API          Use Code Manipulation
    ↓                          ↓
Update Backend          Update Local Code
    ↓                          ↓
Refresh Blocks          Update UI
    ↓                          ↓
Update Code (sync)      Done
```

### Example: Adding a Section

```typescript
// User clicks "+" button
if (canUseBlocks(blocks, documentId)) {
  // 1. Create block object
  const newBlock = createSectionBlock(documentId, {
    title: "New Section",
    content: "Section content here",
    type: "section",
  }, targetBlock.order + 1, "user");
  
  // 2. Add via blocks API
  const success = await addBlock(newBlock);
  
  // 3. Refresh blocks
  await refreshBlocks();
  
  // 4. Also update code for immediate UI
  setCode(addSection(code, {...}, index));
} else {
  // Fallback: just update code
  setCode(addSection(code, {...}, index));
}
```

## Benefits

### ✅ **Smart & Easy**
- Automatically uses blocks when available
- No user intervention needed
- Seamless experience

### ✅ **Backward Compatible**
- Works with existing code manipulation
- Supports new documents (no blocks yet)
- Supports old documents (no blocks)

### ✅ **Best Practices**
- Blocks API for persistence
- Code manipulation for UI responsiveness
- Both systems stay in sync

## Current Status

### ✅ **Implemented**
- Add section (with blocks API)
- Delete section (with blocks API)
- Update section content (with blocks API)
- Create table (with blocks API)
- Load blocks when document loads
- Refresh blocks after operations

### 🔄 **Future Enhancements**
- Reorder sections using `reorderBlocksArray()`
- Move sections using `moveBlockBeforeAfter()`
- Update table cells via blocks
- Sync code from blocks on load
- Visual indicator when blocks are active

## Usage Notes

1. **Blocks are only used when:**
   - `documentId` is available (document is saved)
   - Blocks array is not empty
   - User is authenticated

2. **Code manipulation is used when:**
   - Document is new (not saved yet)
   - Blocks are not available
   - As fallback for immediate UI updates

3. **Both systems work together:**
   - Blocks API updates backend
   - Code manipulation updates UI immediately
   - Both stay in sync

## Testing

To test the integration:

1. **Load a saved document:**
   - Blocks should load automatically
   - Operations should use blocks API

2. **Create new document:**
   - Should use code manipulation
   - Blocks will be created on first save

3. **Edit operations:**
   - Should update both blocks and code
   - Should work seamlessly

## Files Modified

- ✅ `src/app/pages/CodePreview/page.tsx` - Main integration
- ✅ `src/app/utils/blockHelpers.ts` - Helper utilities (new)

## Files Used

- ✅ `src/app/Hooks/useBlocks.ts` - Blocks hook
- ✅ `src/app/types/BlockTypes.ts` - Type definitions
- ✅ `src/app/services/PdfApi.js` - API functions

---

**Status:** ✅ **Integration Complete & Working**

The blocks system is now integrated into the CodePreview page with a smart, hybrid approach that maintains backward compatibility while providing the benefits of the block-based system.

