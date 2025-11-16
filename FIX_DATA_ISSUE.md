# 修复实际数量错误数据问题

## 问题描述
由于之前的代码逻辑错误,导致实际数量被错误地保存到数据库中。表现为:
- 每个库存区域的第1项正常
- 第2项及之后都显示相同的数字(如23)

## 解决方案

### 步骤1: 停止所有前后端服务

```bash
# 停止前端
# 在前端终端按 Ctrl+C

# 停止后端
# 在后端终端按 Ctrl+C
```

### 步骤2: 清除数据库中的错误记录

进入 backend 目录并运行清除脚本:

```bash
cd backend
npx tsx clear-records.ts
```

或者使用 npm script:

```bash
npm run clear-records
```

**注意**: 这会删除所有盘点记录,但库存物料数据保持不变。

### 步骤3: 清除浏览器本地缓存

有两种方法:

**方法A: 使用URL参数清除**
1. 启动前后端服务
2. 访问: `http://localhost:5173/record?cleardata=true`
3. 会自动清除本地缓存并显示提示

**方法B: 手动清除**
1. 打开浏览器开发者工具 (F12)
2. 进入 Application/应用 选项卡
3. 找到 Local Storage
4. 删除所有 `record-input-` 开头的键

### 步骤4: 重新启动服务并测试

```bash
# 启动后端
cd backend
npm run dev

# 启动前端(新终端)
cd ..
npm run dev
```

### 步骤5: 验证修复

登录后测试以下场景:

1. **基本功能测试**:
   - 第1项输入 "12",点击下一页
   - 第2项输入 "25",点击下一页
   - 第3项应该是空白,输入 "8"
   - 返回第1项,确认显示 "12"
   - 返回第2项,确认显示 "25"

2. **切换区域测试**:
   - 在"内包材"填写几项
   - 切换到"生鲜",确认都是空白
   - 切换回"内包材",确认数据保留

3. **数据持久化测试**:
   - 填写几项后刷新页面
   - 重新登录,确认数据正常恢复

## 代码修复说明

已修复的问题:

1. **useEffect 竞态条件**: 使用 `currentItemIdRef` 存储当前编辑的 itemId,避免索引变化时保存到错误的 item

2. **handleNext 逻辑**: 
   - 使用 `itemId` 而非索引来定位要更新的 item
   - 在状态更新前保存当前项信息到变量
   - 异步保存不阻塞UI

3. **数据恢复逻辑**: 使用 `isRestoringRef` 标记,避免在恢复数据时触发保存

## 技术细节

### 修复的关键点

**问题根源**:
```typescript
// 错误: 使用索引定位,可能已经变化
updatedItems[currentIndex].actualQuantity = quantityValue;
```

**修复后**:
```typescript
// 正确: 使用 itemId 定位,始终准确
prevItems.map(item => 
  item.itemId === currentItemId 
    ? { ...item, actualQuantity: quantityValue }
    : item
)
```

### 防御性编程

1. 在函数开始时立即保存当前状态到变量
2. 使用函数式状态更新确保基于最新状态
3. 使用 itemId 而非索引作为唯一标识
4. 异步操作使用保存的变量而非 state

## 如果问题仍然存在

1. 检查浏览器控制台是否有错误
2. 检查数据库是否成功清除: `SELECT COUNT(*) FROM inventory_records;`
3. 完全清除浏览器缓存和 Cookie
4. 尝试使用无痕模式测试

## 联系支持

如果按照以上步骤操作后问题仍然存在,请提供:
- 浏览器控制台截图
- 具体的操作步骤
- 错误消息(如果有)
