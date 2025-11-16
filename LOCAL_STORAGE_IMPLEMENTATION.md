# 本地存储功能实现说明

## 功能概述

为了确保用户在填写盘点数据时,已填写的内容不会因为退出或刷新而丢失,我们在以下两个页面实现了本地存储功能:

### 1. Record 页面 (盘点录入)

**实现细节:**

- **自动保存输入**: 当用户在输入框中输入数量时,数据会自动保存到 `localStorage`
- **存储键格式**: `record-input-${userId}-${itemId}` - 确保每个用户的每个物料项都有独立的存储
- **恢复机制**: 
  - 当切换到某个物料项时,自动检查是否有未保存的输入
  - 如果该物料已经保存到数据库,则显示数据库中的值
  - 如果未保存但有本地输入,则恢复本地输入
  - 如果都没有,则显示空值
- **清理机制**: 当用户点击"下一页"并成功保存到数据库后,会自动清除该物料的本地临时存储

**代码位置**: `/src/pages/Record.tsx`

```typescript
// 保存当前输入到localStorage
useEffect(() => {
  if (currentItem && quantity) {
    const key = `record-input-${userId}-${currentItem.itemId}`;
    localStorage.setItem(key, quantity);
  }
}, [quantity, currentItem, userId]);

// 恢复当前项的输入
useEffect(() => {
  if (currentItem && userId) {
    const key = `record-input-${userId}-${currentItem.itemId}`;
    const savedQuantity = localStorage.getItem(key);
    if (savedQuantity && !currentItem.actualQuantity) {
      setQuantity(savedQuantity);
    } else if (currentItem.actualQuantity !== undefined) {
      setQuantity(currentItem.actualQuantity.toString());
    } else {
      setQuantity("");
    }
  }
}, [currentIndex, currentItem, userId]);
```

### 2. Review 页面 (盘点校对)

**实现细节:**

- **自动保存编辑**: 每次用户修改数据后,所有记录都会自动保存到 `localStorage`
- **存储键**: `review-unsaved-edits` - 存储所有记录的当前状态
- **恢复机制**: 
  - 页面加载时,检查是否有未提交的编辑
  - 如果有,自动恢复这些编辑并提示用户
  - 使用 `useRef` 确保只恢复一次,避免循环更新
- **清理机制**: 当用户成功提交所有记录后,自动清除本地存储

**代码位置**: `/src/pages/Review.tsx`

```typescript
// 从localStorage恢复未保存的编辑
useEffect(() => {
  if (hasRestoredEdits.current || items.length === 0) return;
  
  const savedEdits = localStorage.getItem('review-unsaved-edits');
  if (savedEdits) {
    try {
      const edits = JSON.parse(savedEdits);
      const updatedItems = [...items];
      let hasChanges = false;
      
      edits.forEach((edit: { id: string; actualQuantity: number }) => {
        const index = updatedItems.findIndex(item => item.id === edit.id);
        if (index !== -1 && updatedItems[index].actualQuantity !== edit.actualQuantity) {
          updatedItems[index].actualQuantity = edit.actualQuantity;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setItems(updatedItems);
        toast.info("已恢复未保存的修改");
      }
      hasRestoredEdits.current = true;
    } catch (error) {
      console.error("恢复编辑失败:", error);
    }
  }
}, [items]);

// 保存未提交的编辑到localStorage
useEffect(() => {
  if (items.length > 0) {
    const edits = items.map(item => ({
      id: item.id,
      actualQuantity: item.actualQuantity
    }));
    localStorage.setItem('review-unsaved-edits', JSON.stringify(edits));
  }
}, [items]);
```

## 用户体验

### 场景 1: 盘点录入中途退出

1. 用户在 Record 页面填写物料数量
2. 输入数字后,数据自动保存到 localStorage
3. 用户关闭浏览器或刷新页面
4. 重新打开页面后,切换到该物料时,之前输入的数字会自动恢复

### 场景 2: 校对页面修改后退出

1. 用户在 Review 页面修改某些数据
2. 修改后的数据自动保存到 localStorage
3. 用户关闭浏览器或刷新页面
4. 重新打开页面后,会看到提示"已恢复未保存的修改",所有修改都会恢复

### 场景 3: 正常完成流程

1. 用户在 Record 页面填写并保存到数据库 → 本地临时存储被清除
2. 用户在 Review 页面确认并提交 → 本地编辑存储被清除
3. 系统保持干净,不会积累无用的本地数据

## 技术要点

1. **数据隔离**: 使用 `userId` 和 `itemId` 确保不同用户和不同物料的数据不会混淆
2. **智能恢复**: 优先使用数据库数据,只在没有数据库数据时才使用本地存储
3. **自动清理**: 成功保存到数据库后自动清理本地存储,避免数据冗余
4. **用户提示**: 恢复数据时给予明确的提示,让用户知道发生了什么
5. **错误处理**: 使用 try-catch 包裹 JSON 解析,防止损坏的数据导致崩溃

## 注意事项

- localStorage 有大小限制(通常 5-10MB),但对于盘点数据来说完全足够
- localStorage 数据永久保存,除非用户清除浏览器数据或代码主动删除
- 不同浏览器的 localStorage 是独立的
- 隐私模式下 localStorage 可能不可用或在关闭窗口后清除
