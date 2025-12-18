# Block Reordering Implementation

## ✅ Fixed Issues

### 1. **Backend Router Prefix** ✅
- **Problem**: Blocks router didn't have `/history` prefix, causing 404 errors
- **Fix**: Added `prefix="/history"` to blocks router
- **File**: `app/routers/blocks.py`

```python
router = APIRouter(prefix="/history", tags=["blocks"])
```

### 2. **Frontend API Path** ✅
- **Status**: Already correct - uses `/history/{docId}/blocks`
- **File**: `src/app/services/PdfApi.js`

## 🎯 Reordering Solution

### **Up/Down Arrow Buttons** (Implemented)

Instead of drag-and-drop (which is complex with dynamically rendered content), we implemented **up/down arrow buttons** that appear on hover:

- ✅ **Up Arrow (↑)**: Moves section before the previous section
- ✅ **Down Arrow (↓)**: Moves section after the next section
- ✅ Uses `moveBlockBeforeAfter()` API function
- ✅ Only shows when blocks are available
- ✅ Automatically refreshes blocks after reorder

### How It Works

1. **On Section Hover**:
   - Up/down buttons appear on the left side
   - Buttons are blue (#3B82F6) to distinguish from add button (green)

2. **On Click**:
   - Finds current block and target block
   - Calls `moveBlockBeforeAfter(blockId, "before"/"after", targetBlockId)`
   - Refreshes blocks list
   - UI updates automatically

3. **Visual Feedback**:
   - Buttons fade in/out on hover
   - Loading state during reorder
   - Smooth transitions

## 📍 Implementation Details

### Files Modified

1. **Backend**: `app/routers/blocks.py`
   - Added `/history` prefix to router

2. **Frontend**: `src/app/pages/CodePreview/page.tsx`
   - Added up/down buttons to sections
   - Integrated with `moveBlockBeforeAfter` hook function
   - Added `data-block-id` attribute to sections

### Code Location

The reordering buttons are added in the section hover effect (around line 1850-1960):

```typescript
// Up button
upButton.addEventListener('click', async (e) => {
  const sortedBlocks = getSortedBlocks(blocks);
  const sectionBlocks = sortedBlocks.filter((b) => b.type === "section");
  const currentIndex = sectionBlocks.findIndex((b) => b.block_id === blockId);
  if (currentIndex > 0) {
    const targetBlock = sectionBlocks[currentIndex - 1];
    const success = await moveBlockBeforeAfter(blockId, "before", targetBlock.block_id);
    if (success) {
      await refreshBlocks();
    }
  }
});
```

## 🎨 User Experience

### Visual Design
- **Up Button**: Blue circle, top-left of section
- **Down Button**: Blue circle, below up button
- **Add Button**: Green circle, bottom-center (existing)
- All buttons fade in on hover, fade out on leave

### Behavior
- ✅ Only shows when blocks are available (saved documents)
- ✅ Disabled for first section (no up button)
- ✅ Disabled for last section (no down button)
- ✅ Smooth animations
- ✅ Loading indicator during reorder

## 🔄 Alternative: Drag and Drop

If you want drag-and-drop instead, we created `DraggableBlockList.tsx` component that can be used in a sidebar or separate view. However, for the preview page, up/down buttons are more reliable because:

1. ✅ Works with dynamically rendered content
2. ✅ No conflicts with existing hover effects
3. ✅ Simpler to implement
4. ✅ More accessible (keyboard-friendly)
5. ✅ Clear visual feedback

## 📊 API Endpoints Used

### 1. `POST /history/{doc_id}/blocks/move`
```json
{
  "block_id": "uuid-123",
  "position": "before" | "after",
  "target_block_id": "uuid-456"
}
```

### 2. `PUT /history/{doc_id}/blocks/order` (Alternative)
```json
{
  "block_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### 3. `GET /history/{doc_id}/blocks`
- Used to refresh blocks after reorder

## ✅ Testing Checklist

- [x] Backend router prefix fixed
- [x] Up/down buttons appear on hover
- [x] Buttons only show when blocks available
- [x] Reordering works via API
- [x] Blocks refresh after reorder
- [x] UI updates correctly
- [x] No errors in console

## 🚀 Next Steps (Optional)

1. **Add keyboard shortcuts**: Arrow keys to move sections
2. **Add drag-and-drop sidebar**: Use `DraggableBlockList` component
3. **Add visual indicators**: Show order numbers
4. **Add undo/redo**: Track reorder history

---

**Status**: ✅ **Complete & Working**

The reordering system is now fully integrated and working with the backend API!

