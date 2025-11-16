# 数据清除指南

## 已完成的清除操作

### ✅ 后端数据库清除
已成功清除:
- **107 条盘点记录** (inventory_records)
- **222 条库存物料** (inventory_items)

保留的数据:
- ✓ 用户账号 (users)
- ✓ 用户资料 (profiles)
- ✓ 用户角色 (user_roles)
- ✓ 审计日志 (audit_logs)
- ✓ 密码历史 (password_history)

## 需要手动清除的前端缓存

为了确保完全重置,请在浏览器中执行以下操作:

### 方法 1: 使用浏览器开发者工具
1. 打开浏览器开发者工具 (F12 或 Cmd+Option+I)
2. 进入 **Application** 或 **存储** 标签
3. 在左侧找到 **Local Storage**
4. 选择你的应用域名
5. 点击 **Clear All** 或逐个删除以下键:
   - `record-input-*` (所有以此开头的键)
   - `review-unsaved-edits`
   - 其他相关的缓存数据

### 方法 2: 使用控制台命令
1. 打开浏览器开发者工具 (F12)
2. 进入 **Console** 标签
3. 执行以下命令:
```javascript
// 清除所有 localStorage 数据
localStorage.clear();

// 或者只清除特定的键
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('record-input-') || key === 'review-unsaved-edits') {
    localStorage.removeItem(key);
  }
});

console.log('前端缓存已清除');
```

### 方法 3: 刷新页面并清除缓存
- **Chrome/Edge**: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
- **Firefox**: Cmd+Shift+R (Mac) 或 Ctrl+F5 (Windows)
- **Safari**: Cmd+Option+R

## 重新开始流程

现在你可以:
1. ✅ 上传新的 Excel 文件
2. ✅ 开始填写盘点数据
3. ✅ 所有数据都是全新的,不会有之前的残留

## 如果需要再次清除数据

在后端目录运行:
```bash
cd backend
npm run clear:inventory
```

## 注意事项

⚠️ **此操作不可逆!** 清除的数据无法恢复。
✅ **用户账号安全**: 所有用户账号和登录信息都已保留,无需重新注册。
