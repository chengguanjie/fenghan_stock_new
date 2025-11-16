# 修复重复物料项问题

## 问题描述

在库存盘点系统中发现每个区域的第一项和第二项卡片内容完全一样,这是由于 Excel 导入时没有去重机制导致的。

## 问题原因

1. **Excel 数据重复**: Excel 文件中可能包含重复的行
2. **导入逻辑缺陷**: 旧版本的导入代码对每一行都创建新记录,没有检查是否已存在
3. **数据库约束缺失**: 数据库 schema 中没有设置唯一约束来防止重复

## 解决方案

### 1. 代码修复 (已完成)

修改了 `backend/src/services/inventory.service.ts` 中的 `uploadItemsFromExcel` 方法:

- ✅ **Excel 内部去重**: 基于 `(name, area, materialCode)` 组合去重
- ✅ **数据库去重检查**: 导入前查询数据库,只创建不存在的记录
- ✅ **详细的导入报告**: 返回导入统计信息,包括重复项数量

### 2. 清理现有重复数据

#### 运行清理脚本

```bash
cd backend
npm run tsx remove-duplicates.ts
```

**注意**: 
- 此脚本会删除重复的物料项及其关联的盘点记录
- 基于 `(name, area, materialCode)` 组合识别重复项
- 保留最早创建的记录,删除其他重复项
- 运行前建议备份数据库

#### 手动清理 (SQL 方式)

如果不想使用脚本,也可以执行以下 SQL:

```sql
-- 1. 查看重复项
SELECT name, area, materialCode, COUNT(*) as count
FROM inventory_items
GROUP BY name, area, materialCode
HAVING count > 1;

-- 2. 删除重复项(保留最早的记录)
DELETE i1 FROM inventory_items i1
INNER JOIN inventory_items i2 
WHERE i1.id > i2.id 
  AND i1.name = i2.name 
  AND i1.area = i2.area 
  AND i1.materialCode = i2.materialCode;
```

## 验证修复

### 1. 检查数据库

```sql
-- 应该返回 0 行
SELECT name, area, materialCode, COUNT(*) as count
FROM inventory_items
GROUP BY name, area, materialCode
HAVING count > 1;
```

### 2. 测试导入功能

1. 准备一个包含重复行的测试 Excel 文件
2. 通过管理后台上传
3. 检查返回信息是否包含 "跳过 X 条重复数据"
4. 验证数据库中没有创建重复项

### 3. 测试前端显示

1. 登录用户账号
2. 进入盘点页面
3. 查看每个区域的物料列表
4. 确认没有连续相同的物料项

## 预防措施

### 建议的数据库优化

为了从根本上防止重复,可以考虑添加复合唯一索引:

```prisma
// 在 schema.prisma 中添加
model InventoryItem {
  // ... 现有字段 ...
  
  @@unique([name, area, materialCode], name: "unique_inventory_item")
  @@map("inventory_items")
}
```

然后运行:
```bash
cd backend
npx prisma migrate dev --name add_unique_constraint
```

**注意**: 只有在清理所有重复数据后才能添加此约束

## 导入数据的最佳实践

1. **Excel 准备**:
   - 上传前在 Excel 中删除重复行
   - 使用 Excel 的"删除重复项"功能

2. **分批导入**:
   - 对于大量数据,分批导入可以更容易发现和处理问题

3. **验证数据**:
   - 导入后检查返回信息
   - 留意 "duplicatesSkipped" 字段

## 回滚

如果清理过程中出现问题,可以从备份恢复:

```bash
# 恢复数据库备份
mysql -u root -p stock_deck < backup.sql
```

## 测试清理脚本

如果想在正式运行前测试脚本,可以修改 `remove-duplicates.ts`:

```typescript
// 注释掉删除操作,只打印信息
// const deletedRecords = await prisma.inventoryRecord.deleteMany({...});
// const deletedItems = await prisma.inventoryItem.deleteMany({...});
console.log('测试模式: 不会实际删除数据');
```
